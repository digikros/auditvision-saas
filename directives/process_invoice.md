# Directive: Process Invoice

## Goal
Receive invoice files (images or PDFs) via a web form, extract structured data using Mistral AI OCR, and send results by email.

## Inputs
- Invoice files uploaded via the web frontend
- Accepted formats: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`
- Multiple files can be uploaded in a single submission
- Maximum file size: 20MB per file

## Tools / Scripts
| Script | Purpose |
|---|---|
| `execution/server.py` | Flask API — serves the frontend, handles uploads, orchestrates the pipeline |
| `execution/ocr_engine.py` | Mistral AI Vision — extracts structured data from invoice images/PDFs |
| `execution/email_sender.py` | Gmail SMTP — sends formatted email with extracted results |

## Process Flow
1. User opens the web form at `http://localhost:5000`
2. User drags/selects one or more invoice files
3. Frontend validates file types and sizes in real-time
4. User clicks "Enviar Factura(s)"
5. Files are uploaded to the server with progress tracking
6. Server saves files to `.tmp/uploads/`
7. **OCR Processing**: Each file is sent to Mistral AI (`pixtral-large-latest`) as base64
8. Mistral returns structured JSON with: fornecedor, nif, numero_factura, valor, data, descricao
9. **Email Sending** (async): Results are emailed to `benolisio7k@gmail.com` from `digikros2024@gmail.com`
10. Server returns JSON results to the frontend
11. Frontend displays success message and extracted data cards
12. Temp files are cleaned up from `.tmp/uploads/`

## Outputs
JSON response per invoice:

```json
{
  "arquivo": "factura.pdf",
  "fornecedor": "Nome do fornecedor/emissor",
  "nif": "Número de Identificação Fiscal",
  "numero_factura": "Número da factura",
  "valor": "Valor total com moeda",
  "descricao": "Descrição dos produtos/serviços",
  "data": "DD/MM/AAAA"
}
```

Email sent to destinatário with HTML-formatted table of all results.

## Environment Variables (`.env`)
| Variable | Description |
|---|---|
| `MISTRAL_API_KEY` | Chave da API Mistral para OCR |
| `SMTP_USER` | Email remetente (Gmail) |
| `SMTP_PASSWORD` | App Password do Gmail |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `EMAIL_DESTINATARIO` | Email destinatário dos resultados |
| `FLASK_PORT` | Porta do servidor (default: 5000) |
| `MAX_FILE_SIZE_MB` | Tamanho máximo por ficheiro (default: 20) |

## Edge Cases & Learnings
- Mistral `pixtral-large-latest` supports both images and PDFs as base64 data URIs
- Retry logic (3 attempts with backoff) handles transient API failures
- JSON parsing has fallback regex extraction for when the model wraps JSON in markdown
- Email is sent asynchronously (background thread) to not block the HTTP response
- Fields not found are set to "Não identificado" instead of failing
- Gmail requires App Password (not regular password) when 2FA is enabled
- Temp files are cleaned up after processing to avoid disk space issues
