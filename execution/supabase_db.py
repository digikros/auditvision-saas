import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def insert_invoice(invoice_data, user_id=None):
    """
    Inserts invoice data into Supabase via REST API.
    
    Args:
        invoice_data: Dictionary with keys (fornecedor, nif, numero_factura, valor, data, descricao, arquivo)
        user_id: UUID of the authenticated user.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase URL or Key not configured in .env")
        return False

    if user_id:
        invoice_data["user_id"] = user_id

    url = f"{SUPABASE_URL}/rest/v1/invoices"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    try:
        logger.info(f"Gravando factura no Supabase: {invoice_data.get('fornecedor')}")
        response = requests.post(url, headers=headers, json=invoice_data, timeout=10)
        response.raise_for_status()
        logger.info("Factura gravada com sucesso no Supabase!")
        return True
    except Exception as e:
        logger.error(f"Erro ao gravar no Supabase: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Detalhes do erro: {e.response.text}")
        return False
