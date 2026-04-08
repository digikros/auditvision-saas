"""
OCR Engine — Extração de dados de facturas via Mistral AI
Layer 3 (Execution) — Envia imagens/PDFs para a API do Mistral e extrai dados estruturados.

Campos extraídos:
- Fornecedor / Emissor
- NIF
- Número da factura
- Valor total
- Data de emissão
- Descrição dos produtos/serviços
"""

import os
import re
import json
import base64
import logging
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_MODEL = "pixtral-large-latest"

# Supported image MIME types
MIME_MAP = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}

# Extraction prompt — instructs the model to return structured JSON
EXTRACTION_PROMPT = """Analisa esta factura e extrai os seguintes dados em formato JSON.

Campos obrigatórios:
- "fornecedor": Nome completo do fornecedor ou emissor da factura (normalmente no topo)
- "nif": Número de Identificação Fiscal (NIF/NIPC) do EMISSOR/FORNECEDOR. 
- "numero_factura": Número ou referência da factura
- "valor": Valor total da factura (incluir moeda, ex: "1.250,00 KZ")
- "data": Data de emissão no formato DD/MM/AAAA
- "descricao": Descrição resumida dos produtos ou serviços facturados

Regras Críticas para NIF:
1. Extrai APENAS o NIF do FORNECEDOR/EMISSOR.
2. Procura por termos como: "NIF/NIPC", "Nr Contribuinte", "Contribuinte Nr", "NIF do Emissor".
3. IGNORE QUALQUER NIF de cliente, adquirente ou consumidor (ex: ignorar campos como "Cliente:", "Nome:", "Morada:" na secção de adquirente).
4. Se houver dois NIFs, o do fornecedor costuma estar no cabeçalho ou junto aos dados da empresa emissora.

Outras Regras:
1. Responde APENAS com o JSON, sem texto adicional, sem markdown, sem ```json
2. Se um campo não for legível ou não existir (exceto fornecedor e nif), usa "Não identificado"
3. O valor deve preferencialmente usar a moeda da factura
4. A data deve estar no formato DD/MM/AAAA

Exemplo de resposta:
{"fornecedor": "Empresa ABC, Lda.", "nif": "123456789", "numero_factura": "FT 2024/0001", "valor": "1.500,00 KZ", "data": "15/03/2024", "descricao": "Serviços de consultoria em TI"}
"""


def _encode_file_to_base64(file_path: str) -> str:
    """Encode a file to base64 string."""
    with open(file_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def _get_mime_type(file_path: str) -> str:
    """Get MIME type from file extension."""
    ext = Path(file_path).suffix.lower()
    mime = MIME_MAP.get(ext)
    if not mime:
        raise ValueError(f"Tipo de ficheiro não suportado: {ext}")
    return mime


def _parse_json_response(text: str) -> dict:
    """
    Parse JSON from the model's response.
    Handles cases where the model wraps JSON in markdown code blocks.
    """
    # Remove markdown code block markers if present
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning(f"Falha ao parsear JSON: {e}. Resposta bruta: {text[:200]}")
        # Try to extract JSON from the text using regex
        match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        # Return structured error
        return {
            "fornecedor": "Não identificado",
            "nif": "Não identificado",
            "numero_factura": "Não identificado",
            "valor": "Não identificado",
            "data": "Não identificado",
            "descricao": f"Erro na extração: {text[:150]}",
        }


def _validate_result(result: dict) -> dict:
    """Ensure all required fields exist in the result."""
    required_fields = [
        "fornecedor",
        "nif",
        "numero_factura",
        "valor",
        "data",
        "descricao",
    ]
    for field in required_fields:
        if field not in result or not result[field]:
            result[field] = "Não identificado"
    return result


import requests

def extract_invoice_data(file_path: str, original_filename: str = "") -> dict:
    """
    Extract structured data from an invoice file using Mistral AI Vision.

    Args:
        file_path: Absolute path to the invoice file (image or PDF).
        original_filename: Original name of the uploaded file.

    Returns:
        dict with keys: fornecedor, nif, numero_factura, valor, data, descricao, arquivo

    Raises:
        ValueError: If the API key is not configured or file type is unsupported.
        RuntimeError: If the API call fails after retries.
    """
    if not MISTRAL_API_KEY:
        raise ValueError(
            "MISTRAL_API_KEY não configurada. Defina no ficheiro .env"
        )

    mime_type = _get_mime_type(file_path)
    file_b64 = _encode_file_to_base64(file_path)
    data_uri = f"data:{mime_type};base64,{file_b64}"

    logger.info(
        f"A processar factura: {original_filename or file_path} "
        f"({mime_type}, {len(file_b64) // 1024}KB base64)"
    )

    # Build the message with image/document
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": data_uri,
                },
                {
                    "type": "text",
                    "text": EXTRACTION_PROMPT,
                },
            ],
        }
    ]

    # Call Mistral API with retry logic using requests
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    payload = {
        "model": MISTRAL_MODEL,
        "messages": messages,
        "temperature": 0.1
    }

    max_retries = 3
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Chamada à API Mistral REST (tentativa {attempt}/{max_retries})")

            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()

            data = response.json()
            raw_text = data["choices"][0]["message"]["content"]
            
            logger.info(f"Resposta recebida ({len(raw_text)} chars)")
            logger.debug(f"Resposta bruta: {raw_text[:300]}")

            # Parse and validate
            result = _parse_json_response(raw_text)
            result = _validate_result(result)
            result["arquivo"] = original_filename or Path(file_path).name

            logger.info(
                f"Extração concluída: {result['fornecedor']} | "
                f"Factura: {result['numero_factura']} | "
                f"Valor: {result['valor']}"
            )

            return result

        except requests.exceptions.RequestException as e:
            last_error = e
            logger.error(
                f"Erro HTTP na tentativa {attempt}/{max_retries}: {type(e).__name__}: {e}"
            )
            # If we got a response, print its content to help debugging
            if hasattr(e, "response") and e.response is not None:
                logger.error(f"Detalhes do erro Mistral: {e.response.text}")
            
            if attempt < max_retries:
                import time
                wait_time = attempt * 2
                logger.info(f"A aguardar {wait_time}s antes de tentar novamente...")
                time.sleep(wait_time)
        except Exception as e:
            last_error = e
            logger.error(
                f"Erro na tentativa {attempt}/{max_retries}: {type(e).__name__}: {e}"
            )
            if attempt < max_retries:
                import time
                wait_time = attempt * 2
                logger.info(f"A aguardar {wait_time}s antes de tentar novamente...")
                time.sleep(wait_time)

    # All retries failed
    error_msg = f"Falha após {max_retries} tentativas: {last_error}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    if len(sys.argv) < 2:
        print("Uso: python ocr_engine.py <caminho_do_ficheiro>")
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"Ficheiro não encontrado: {filepath}")
        sys.exit(1)

    result = extract_invoice_data(filepath)
    print(json.dumps(result, indent=2, ensure_ascii=False))
