"""
Invoice Upload Server
Layer 3 (Execution) — Flask API that serves the frontend and handles file uploads.
Integrates OCR engine (Mistral AI) and email sender for the full automation pipeline.

Flow:
1. Receive files via POST /upload
2. Save to .tmp/uploads/
3. Extract data via Mistral AI OCR (ocr_engine.py)
4. Send results email (email_sender.py)
5. Return JSON results to frontend
"""

import os
import uuid
import json
import logging
import threading
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
TMP_DIR = BASE_DIR / ".tmp" / "uploads"
# Em produção o Flask servirá o Dashboard construído (Vite build)
FRONTEND_DIR = BASE_DIR / "dashboard" / "dist"

# Caso a pasta dist não exista (desenvolvimento local), usa a pasta frontend original
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = BASE_DIR / "frontend"

TMP_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", 20)) * 1024 * 1024  # bytes

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE * 10  # allow batch uploads


def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def process_post_extraction_sync(results: list[dict], user_id: str = None) -> None:
    """Save to Supabase synchronously."""
    try:
        # 1. Enviar Email (DESACTIVADO a pedido do utilizador)
        # from email_sender import send_invoice_email
        # send_invoice_email(results)
        
        # 2. Gravar no Supabase
        from supabase_db import insert_invoice
        for res in results:
            insert_invoice(res, user_id=user_id)
        logger.info(f"🗄️ {len(results)} factura(s) sincronizada(s) com o Supabase para o user {user_id}.")

    except Exception as e:
        logger.error(f"Erro no processamento pós-extração: {e}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def serve_frontend():
    """Serve the main HTML page."""
    return send_from_directory(str(FRONTEND_DIR), "index.html")


@app.route("/upload", methods=["POST"])
def upload_invoices():
    """
    Receive one or more invoice files, process with OCR, and return extracted data.

    Flow:
    1. Validate and save uploaded files
    2. Process each file with Mistral AI OCR
    3. Send results via email (async)
    4. Return JSON results to the frontend
    """
    if "files" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado."}), 400

    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"error": "Nenhum arquivo selecionado."}), 400

    results = []
    errors = []
    saved_paths = []

    # ------ Step 1: Validate & Save ------
    for file in files:
        if not file or file.filename == "":
            continue

        if not allowed_file(file.filename):
            errors.append(
                f"'{file.filename}' — tipo não suportado. Use PDF, PNG, JPG ou WEBP."
            )
            continue

        # Save to .tmp/uploads/
        safe_name = f"{uuid.uuid4().hex}_{file.filename}"
        save_path = TMP_DIR / safe_name

        try:
            file.save(str(save_path))
            saved_paths.append((str(save_path), file.filename))
            logger.info(f"✅ Arquivo salvo: {save_path.name}")
        except Exception as e:
            logger.error(f"Erro ao salvar '{file.filename}': {e}")
            errors.append(f"'{file.filename}' — erro ao salvar: {str(e)}")

    if not saved_paths and errors:
        return jsonify({"error": "Nenhum arquivo válido.", "details": errors}), 400

    # ------ Step 2: OCR Processing ------
    from ocr_engine import extract_invoice_data

    for file_path, original_name in saved_paths:
        try:
            logger.info(f"🔍 A processar OCR: {original_name}")
            result = extract_invoice_data(file_path, original_name)
            results.append(result)
            logger.info(
                f"✅ OCR concluído: {original_name} → "
                f"{result.get('fornecedor', '?')} | {result.get('valor', '?')}"
            )
        except Exception as e:
            logger.error(f"❌ Erro OCR em '{original_name}': {e}")
            errors.append(f"'{original_name}' — erro no processamento OCR: {str(e)}")
            # Add partial result so the user knows this file failed
            results.append({
                "arquivo": original_name,
                "fornecedor": "Erro no processamento",
                "nif": "—",
                "numero_factura": "—",
                "valor": "—",
                "data": "—",
                "descricao": f"Não foi possível processar: {str(e)[:100]}",
            })

    # ------ Step 3: Save to DB (Synchronous to avoid delay) ------
    user_id = request.form.get("user_id")
    successful_results = [
        r for r in results if r.get("fornecedor") != "Erro no processamento"
    ]
    
    if successful_results:
        logger.info(f"🗄️ A iniciar sincronização síncrona para {len(successful_results)} resultado(s)...")
        process_post_extraction_sync(successful_results, user_id)
    elif results:
        # Se houve tentativas mas nenhum sucesso, o status geral deve ser erro ou aviso forte
        logger.warning("⚠️ Nenhum resultado válido para sincronizar.")

    # ------ Step 4: Cleanup temp files ------
    for file_path, _ in saved_paths:
        try:
            os.remove(file_path)
            logger.debug(f"🗑️ Temp file removido: {file_path}")
        except OSError:
            pass

    # ------ Response ------
    is_fully_successful = len(successful_results) == len(results) and len(results) > 0
    has_any_success = len(successful_results) > 0

    response = {
        "success": has_any_success,
        "message": (
            "Factura(s) processada(s) e sincronizada(s) com sucesso!"
            if is_fully_successful
            else "Processamento concluído com alguns avisos."
            if has_any_success
            else "Falha no processamento das facturas."
        ),
        "total_processados": len(results),
        "resultados": results,
    }

    if errors:
        response["avisos"] = errors

    logger.info(
        f"🏁 Upload concluído: {len(results)} processado(s), "
        f"{len(errors)} aviso(s)"
    )
    return jsonify(response), 200


@app.errorhandler(Exception)
def handle_exception(e):
    """Handle uncaught exceptions and return JSON."""
    code = 500
    if hasattr(e, "code"):
        code = e.code
    
    logger.error(f"⚠️ Erro não tratado: {str(e)}")
    return jsonify({
        "success": False,
        "message": f"Erro interno no servidor: {str(e)}",
        "error": type(e).__name__
    }), code


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    logger.info(f"🚀 Servidor AuditVision iniciado em http://localhost:{port}")
    app.run(debug=True, port=port, host="0.0.0.0")
