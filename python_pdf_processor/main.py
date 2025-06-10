from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import io
import logging
from pydantic import BaseModel
from pydantic import BaseModel
from pypdf import PdfReader
from pdf2image import convert_from_bytes
from google.cloud import vision

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Heuristic to trigger OCR: if direct extraction yields fewer than this many characters per page on average.
MIN_CHARS_PER_PAGE_HEURISTIC = 100

app = FastAPI(title="Cendien Document Processing Service")

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for API Response ---
class ProcessingDetail(BaseModel):
    file_name: str
    method: str
    status: str
    pages_processed: int = 0
    error_message: str | None = None

class PDFProcessResponse(BaseModel):
    status: str
    extracted_text: str | None = None
    processing_details: List[ProcessingDetail] = []
    error_message: str | None = None

# --- PDF Text Extraction Logic with OCR Fallback ---
async def extract_text_with_ocr(pdf_bytes: bytes, file_name: str) -> dict:
    """Performs OCR on each page of a PDF and returns the aggregated text."""
    logger.info(f"Performing OCR for file: {file_name}")
    ocr_text_parts = []
    pages_processed = 0
    
    vision_client = vision.ImageAnnotatorClient()
    
    try:
        images = convert_from_bytes(pdf_bytes)
        pages_processed = len(images)

        for i, page_image in enumerate(images):
            try:
                with io.BytesIO() as output:
                    page_image.save(output, format="PNG")
                content = output.getvalue()

                image = vision.Image(content=content)
                response = vision_client.text_detection(image=image)
                
                if response.error.message:
                    raise Exception(f"Vision API error on page {i+1}: {response.error.message}")

                ocr_text_parts.append(response.full_text_annotation.text)
                logger.info(f"Successfully OCR'd page {i+1} of {file_name}")

            except Exception as ocr_page_err:
                logger.error(f"OCR error on page {i+1} of {file_name}: {ocr_page_err}")
                ocr_text_parts.append(f"[OCR Error on page {i+1}]")

        return {"text": "\n\n".join(ocr_text_parts), "pages_processed": pages_processed}

    except Exception as e:
        logger.error(f"Failed to convert PDF to images for OCR: {e}")
        raise

async def extract_text_from_pdf_bytes(pdf_bytes: bytes, file_name: str) -> dict:
    """Extracts text, trying direct method first and falling back to OCR if needed."""
    text_content = ""
    pages_processed = 0
    error_message_detail = None
    method_used = "direct_extraction"
    
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_processed = len(reader.pages)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_content += extracted + "\n"
        logger.info(f"File: {file_name}, Method: PyPDF, Pages: {pages_processed}, Text length: {len(text_content)}")

        avg_chars_per_page = (len(text_content) / pages_processed) if pages_processed > 0 else 0
        if avg_chars_per_page < MIN_CHARS_PER_PAGE_HEURISTIC:
            logger.warning(f"Direct extraction for {file_name} yielded short text ({avg_chars_per_page:.0f} chars/page). Attempting OCR fallback.")
            method_used = "ocr_extraction"
            ocr_result = await extract_text_with_ocr(pdf_bytes, file_name)
            text_content = ocr_result["text"]
            pages_processed = ocr_result["pages_processed"]

    except Exception as e:
        logger.error(f"Error processing PDF {file_name} with {method_used}: {e}")
        error_message_detail = str(e)

    return {
        "text": text_content.strip(),
        "method_used": method_used,
        "pages_processed": pages_processed,
        "error_message_detail": error_message_detail
    }

# --- API Endpoint for Processing PDFs ---
@app.post("/process-rfp-pdf/", response_model=PDFProcessResponse)
async def process_rfp_files_endpoint(
    main_rfp: UploadFile = File(...),
    addendum_files: List[UploadFile] = File([])
):
    all_files_to_process = []
    if main_rfp:
        all_files_to_process.append(main_rfp) # <-- CORRECTED VARIABLE NAME
    all_files_to_process.extend(addendum_files)

    if not all_files_to_process:
        raise HTTPException(status_code=400, detail="No PDF files provided.")

    full_extracted_text_parts = []
    processing_details_list = []
    any_errors = False

    for rfp_file in all_files_to_process:
        file_name = rfp_file.filename
        logger.info(f"Processing file: {file_name}")
        
        try:
            contents = await rfp_file.read()
            extraction_result = await extract_text_from_pdf_bytes(contents, file_name)

            if extraction_result["error_message_detail"]:
                any_errors = True
                processing_details_list.append(ProcessingDetail(
                    file_name=file_name,
                    method=extraction_result["method_used"],
                    status="failure",
                    error_message=extraction_result["error_message_detail"]
                ))
            else:
                full_extracted_text_parts.append(f"--- START OF DOCUMENT: {file_name} ---\n{extraction_result['text']}\n--- END OF DOCUMENT: {file_name} ---")
                processing_details_list.append(ProcessingDetail(
                    file_name=file_name,
                    method=extraction_result["method_used"],
                    status="success",
                    pages_processed=extraction_result["pages_processed"]
                ))

        except Exception as e:
            logger.error(f"Failed to read file {file_name}: {e}")
            any_errors = True
            processing_details_list.append(ProcessingDetail(file_name=file_name, method="file_read", status="failure", error_message=str(e)))
        finally:
            await rfp_file.close()

    final_text = "\n\n".join(full_extracted_text_parts)
    overall_status = "success"
    if any_errors:
        overall_status = "partial_success" if final_text else "error"

    return PDFProcessResponse(
        status=overall_status,
        extracted_text=final_text,
        processing_details=processing_details_list,
    )

@app.get("/")
def read_root():
    return {"status": "success", "message": "Python PDF Processing Service is running."}