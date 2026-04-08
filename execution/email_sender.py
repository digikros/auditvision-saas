"""
Email Sender — Envio de resultados de facturas por email
Layer 3 (Execution) — Envia email formatado com os dados extraídos das facturas.

Usa Gmail SMTP com App Password.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_DESTINATARIO = os.getenv("EMAIL_DESTINATARIO")


def _build_invoice_html(result: dict) -> str:
    """Build an HTML block for a single invoice result."""
    return f"""
    <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; width:180px; font-size:14px;">
                📄 Ficheiro
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529;">
                {result.get('arquivo', 'N/A')}
            </td>
        </tr>
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; font-size:14px;">
                🏢 Fornecedor
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529;">
                {result.get('fornecedor', 'Não identificado')}
            </td>
        </tr>
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; font-size:14px;">
                🔢 NIF
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529;">
                {result.get('nif', 'Não identificado')}
            </td>
        </tr>
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; font-size:14px;">
                📋 Nº Factura
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529;">
                {result.get('numero_factura', 'Não identificado')}
            </td>
        </tr>
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; font-size:14px;">
                💰 Valor Total
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529; font-weight:600;">
                {result.get('valor', 'Não identificado')}
            </td>
        </tr>
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; font-size:14px;">
                📅 Data
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529;">
                {result.get('data', 'Não identificado')}
            </td>
        </tr>
        <tr>
            <td style="padding:10px 14px; background:#f8f9fa; border:1px solid #e9ecef; font-weight:600; color:#495057; font-size:14px;">
                📝 Descrição
            </td>
            <td style="padding:10px 14px; background:#ffffff; border:1px solid #e9ecef; font-size:14px; color:#212529;">
                {result.get('descricao', 'Não identificado')}
            </td>
        </tr>
    </table>
    """


def _build_email_body(results: list[dict]) -> str:
    """Build the full HTML email body with all invoice results."""
    now = datetime.now().strftime("%d/%m/%Y às %H:%M")
    count = len(results)
    plural = "s" if count > 1 else ""

    invoices_html = ""
    for i, result in enumerate(results, 1):
        invoices_html += f"""
        <div style="margin-bottom:24px;">
            <h3 style="margin:0 0 12px 0; font-size:16px; color:#3a3a3c; font-weight:600;">
                Factura {i} de {count}
            </h3>
            {_build_invoice_html(result)}
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin:0; padding:0; background-color:#f5f5f7; font-family:'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width:600px; margin:0 auto; padding:32px 16px;">

            <!-- Header -->
            <div style="background:linear-gradient(135deg, #3a3a3c 0%, #636366 100%); border-radius:12px 12px 0 0; padding:28px 32px; text-align:center;">
                <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.02em;">
                    ✅ AuditVision
                </h1>
                <p style="margin:6px 0 0; color:rgba(255,255,255,0.75); font-size:13px;">
                    Processamento automático de facturas
                </p>
            </div>

            <!-- Body -->
            <div style="background:#ffffff; padding:28px 32px; border-left:1px solid #e5e5ea; border-right:1px solid #e5e5ea;">

                <p style="margin:0 0 6px; font-size:14px; color:#636366;">
                    {now}
                </p>
                <p style="margin:0 0 24px; font-size:15px; color:#1d1d1f; line-height:1.5;">
                    {count} factura{plural} processada{plural} com sucesso.
                    Abaixo encontram-se os dados extraídos automaticamente.
                </p>

                <hr style="border:none; border-top:1px solid #e5e5ea; margin:0 0 24px;">

                {invoices_html}
            </div>

            <!-- Footer -->
            <div style="background:#f8f9fa; border-radius:0 0 12px 12px; padding:20px 32px; border:1px solid #e5e5ea; border-top:none; text-align:center;">
                <p style="margin:0; font-size:12px; color:#8e8e93;">
                    Email enviado automaticamente pelo AuditVision — Digikros
                </p>
                <p style="margin:4px 0 0; font-size:11px; color:#aeaeb2;">
                    Este é um email automático. Não responda a esta mensagem.
                </p>
            </div>

        </div>
    </body>
    </html>
    """


def send_invoice_email(
    results: list[dict],
    destinatario: Optional[str] = None,
) -> bool:
    """
    Send an email with the extracted invoice data.

    Args:
        results: List of dicts with extracted invoice data.
        destinatario: Override recipient email. Uses EMAIL_DESTINATARIO from .env if not provided.

    Returns:
        True if email was sent successfully.

    Raises:
        ValueError: If SMTP credentials are missing.
        RuntimeError: If email sending fails.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        raise ValueError(
            "Credenciais SMTP não configuradas. "
            "Defina SMTP_USER e SMTP_PASSWORD no ficheiro .env"
        )

    to_email = destinatario or EMAIL_DESTINATARIO
    if not to_email:
        raise ValueError(
            "Destinatário não definido. "
            "Defina EMAIL_DESTINATARIO no .env ou passe como argumento."
        )

    count = len(results)
    plural = "s" if count > 1 else ""
    now = datetime.now().strftime("%d/%m/%Y %H:%M")

    # Build email
    msg = MIMEMultipart("alternative")
    msg["From"] = f"AuditVision <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = (
        f"📄 Factura{plural} Processada{plural} (AuditVision) — {count} documento{plural} | {now}"
    )

    # HTML body
    html_body = _build_email_body(results)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # Plain text fallback
    plain_lines = [
        f"AuditVision — {count} factura{plural} processada{plural}",
        f"Data: {now}",
        "=" * 50,
    ]
    for i, r in enumerate(results, 1):
        plain_lines.extend([
            f"\nFactura {i}:",
            f"  Ficheiro: {r.get('arquivo', 'N/A')}",
            f"  Fornecedor: {r.get('fornecedor', 'N/A')}",
            f"  NIF: {r.get('nif', 'N/A')}",
            f"  Nº Factura: {r.get('numero_factura', 'N/A')}",
            f"  Valor: {r.get('valor', 'N/A')}",
            f"  Data: {r.get('data', 'N/A')}",
            f"  Descrição: {r.get('descricao', 'N/A')}",
            "-" * 50,
        ])

    msg.attach(MIMEText("\n".join(plain_lines), "plain", "utf-8"))

    # Send
    try:
        logger.info(f"A enviar email para {to_email} via {SMTP_HOST}:{SMTP_PORT}")

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"✅ Email enviado com sucesso para {to_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        error_msg = (
            f"Autenticação SMTP falhou. Verifique SMTP_USER e SMTP_PASSWORD. "
            f"Para Gmail, use uma App Password. Erro: {e}"
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    except smtplib.SMTPException as e:
        error_msg = f"Erro SMTP ao enviar email: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    except Exception as e:
        error_msg = f"Erro inesperado ao enviar email: {type(e).__name__}: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    # Test with mock data
    test_results = [
        {
            "arquivo": "factura_teste.pdf",
            "fornecedor": "Empresa Exemplo, Lda.",
            "nif": "123456789",
            "numero_factura": "FT 2026/0001",
            "valor": "1.250,00 €",
            "data": "07/04/2026",
            "descricao": "Serviços de consultoria e desenvolvimento de software",
        }
    ]

    send_invoice_email(test_results)
