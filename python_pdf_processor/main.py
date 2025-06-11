from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import io
import logging
from pydantic import BaseModel
from pypdf import PdfReader
from pdf2image import convert_from_bytes
from google.cloud import vision

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
MIN_CHARS_PER_PAGE_HEURISTIC = 100

app = FastAPI(title="Cendien Document Processing Service")

# --- CORS Configuration ---
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
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
                logger.error(f"OCR error on page {i+1} of {file_name}: {ocr_page_err}", exc_info=True)
                ocr_text_parts.append(f"[OCR Error on page {i+1}]")

        return {"text": "\n\n".join(ocr_text_parts), "pages_processed": pages_processed}

    except Exception as e:
        logger.error(f"Failed to convert PDF to images for OCR: {e}", exc_info=True)
        raise

async def extract_text_from_pdf_bytes(pdf_bytes: bytes, file_name: str) -> dict:
    logger.info(f"File: {file_name} - Received {len(pdf_bytes)} bytes for pypdf processing.")
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
        logger.error(f"Error processing PDF {file_name} with {method_used}: {e}", exc_info=True)
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
    addendum_files: Optional[List[UploadFile]] = File(None) 
):
    all_files_to_process = [main_rfp]
    if addendum_files:
        valid_addendums = [f for f in addendum_files if isinstance(f, UploadFile)]
        all_files_to_process.extend(valid_addendums)

    if not all_files_to_process:
        raise HTTPException(status_code=400, detail="No valid PDF files provided.")

    full_extracted_text_parts = []
    processing_details_list = []
    any_errors = False

    for rfp_file in all_files_to_process:
        file_name = rfp_file.filename
        logger.info(f"Processing file: {file_name}")
        logger.info(f"UploadFile details - Filename: {rfp_file.filename}, Content-Type: {rfp_file.content_type}, Size (from headers if available): {rfp_file.size if hasattr(rfp_file, 'size') else 'N/A'}")
        
        try:
            logger.info(f"Attempting 'await rfp_file.read()' for {file_name}")
            contents = await rfp_file.read()
            logger.info(f"Successfully read {len(contents)} bytes for file: {file_name}")
            
            # --- ADDED LOGGING FOR FIRST FEW BYTES ---
            if contents:
                logger.info(f"First 20 bytes (raw): {contents[:20]}") 
                try:
                    # This is just for illustrative purposes to see if it's printable text
                    logger.info(f"First 20 bytes (decoded as utf-8, illustrative only): {contents[:20].decode('utf-8', errors='ignore')}")
                except Exception:
                    logger.info("First 20 bytes could not be decoded as utf-8 (which is expected for binary files).")
            # --- END OF ADDED LOGGING ---
            
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
            logger.error(f"Failed to read file {file_name} or process its content: {e}", exc_info=True) 
            any_errors = True
            processing_details_list.append(ProcessingDetail(file_name=file_name, method="file_read_or_processing", status="failure", error_message=str(e)))
        finally:
            logger.info(f"Attempting 'await rfp_file.close()' for {file_name}")
            await rfp_file.close()
            logger.info(f"Successfully closed file stream for {file_name}")

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
