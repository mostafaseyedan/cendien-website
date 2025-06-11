from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import io
import logging
import base64 # Make sure to import base64
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
        logger.error(f"Failed to convert PDF to images for OCR for {file_name}: {e}", exc_info=True)
        raise

async def extract_text_from_pdf_bytes(pdf_bytes: bytes, file_name: str) -> dict:
    logger.info(f"File: {file_name} - Received {len(pdf_bytes)} bytes for pypdf processing.")
    text_content = ""
    pages_processed = 0
    error_message_detail = None
    method_used = "direct_extraction"
    
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes)) # pypdf expects raw binary PDF bytes
        pages_processed = len(reader.pages)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_content += extracted + "\n"
        logger.info(f"File: {file_name}, Method: PyPDF, Pages: {pages_processed}, Text length: {len(text_content)}")

        avg_chars_per_page = (len(text_content) / pages_processed) if pages_processed > 0 else 0
        if avg_chars_per_page < MIN_CHARS_PER_PAGE_HEURISTIC and pages_processed > 0 : # Ensure pages_processed > 0 for OCR fallback
            logger.warning(f"Direct extraction for {file_name} yielded short text ({avg_chars_per_page:.0f} chars/page). Attempting OCR fallback.")
            method_used = "ocr_extraction"
            ocr_result = await extract_text_with_ocr(pdf_bytes, file_name) # OCR also expects raw binary PDF bytes
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
        logger.info(f"UploadFile details - Filename: {rfp_file.filename}, Declared Content-Type: {rfp_file.content_type}, Size (from headers if available): {rfp_file.size if hasattr(rfp_file, 'size') else 'N/A'}")
        
        contents_to_process = b'' # Initialize to empty bytes

        try:
            logger.info(f"Attempting 'await rfp_file.read()' for {file_name}")
            received_bytes = await rfp_file.read()
            logger.info(f"Successfully read {len(received_bytes)} bytes from upload for file: {file_name}")
            
            contents_to_process = received_bytes # Assume raw binary by default

            if received_bytes:
                logger.info(f"First 20 raw bytes from upload: {received_bytes[:20]}")
                
                is_likely_base64_encoded_pdf = False
                # Sniffing for base64: Check if it starts with 'JVBER' (base64 of '%PDF')
                # and decodes to something starting with '%PDF'
                if len(received_bytes) >= 20: # Need enough bytes for a reasonable sniff and decode check
                    try:
                        # Check if the start of the received bytes, when decoded as text, looks like 'JVBER'
                        if received_bytes[:5].decode('ascii', errors='ignore').upper() == 'JVBER':
                            # Try to decode a small portion to see if it yields '%PDF'
                            # A common base64 prefix for PDF is 'JVBERi0xLXYZ' where XYZ is the version
                            # The first 4 bytes of decoded content should be '%PDF'
                            decoded_header_check = base64.b64decode(received_bytes[:20]) # Decode a bit more
                            if decoded_header_check[:4] == b'%PDF':
                                is_likely_base64_encoded_pdf = True
                                logger.info(f"File {file_name} appears to be base64 encoded PDF based on header sniffing.")
                            else:
                                logger.info(f"File {file_name} started with JVBER but did not decode to %PDF. Treating as binary.")
                        else:
                             logger.info(f"File {file_name} does not start with JVBER. Treating as binary.")
                    except Exception as sniff_err:
                        # This might happen if received_bytes[:5].decode('ascii') fails, or b64decode fails on non-base64
                        logger.warning(f"Sniffing for base64 PDF for {file_name} caused an error: {sniff_err}. Assuming raw binary.")
                
                if is_likely_base64_encoded_pdf:
                    try:
                        # If it's likely base64, attempt to decode the whole thing
                        base64_string = received_bytes.decode('ascii') # Base64 should be ASCII
                        contents_to_process = base64.b64decode(base64_string)
                        logger.info(f"Successfully base64 decoded {file_name}. Original size: {len(received_bytes)}, Decoded size: {len(contents_to_process)}")
                        if contents_to_process:
                             logger.info(f"First 20 DECODED bytes (raw): {contents_to_process[:20]}")
                    except Exception as b64_error:
                        logger.error(f"Base64 decoding FAILED for {file_name} despite sniffing positively: {b64_error}", exc_info=True)
                        # If decoding fails here, something is wrong.
                        # It's safer to try processing the original bytes, though it will likely fail in pypdf.
                        contents_to_process = received_bytes 
                        any_errors = True # Mark that an error occurred during this critical step
                        processing_details_list.append(ProcessingDetail(
                            file_name=file_name, method="base64_decode_failure", status="failure", 
                            error_message=f"Failed to base64 decode: {b64_error}"
                        ))
                        # Continue to next file if there are multiple, or the flow will naturally go to return
                        if any_errors: # if this is the only file, this error will be part of the response
                           pass # let the loop continue if there are other files, or finish if not
                else:
                    logger.info(f"File {file_name} will be processed as raw binary based on sniffing (not detected as base64 PDF).")
            
            # Only proceed to extraction if no error during base64 decoding prevented it
            # (and any_errors wasn't set by a base64_decode_failure for this file)
            # Find if this file already had a base64 decode failure
            file_had_b64_decode_error = any(
                pd.file_name == file_name and pd.method == "base64_decode_failure" 
                for pd in processing_details_list
            )

            if not file_had_b64_decode_error:
                extraction_result = await extract_text_from_pdf_bytes(contents_to_process, file_name)

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
            logger.error(f"Outer exception for file {file_name} or process its content: {e}", exc_info=True) 
            any_errors = True
            # Avoid adding duplicate error if one was already added for b64 decode failure for this file
            if not any(pd.file_name == file_name for pd in processing_details_list):
                processing_details_list.append(ProcessingDetail(file_name=file_name, method="file_read_or_outer_processing", status="failure", error_message=str(e)))
        finally:
            logger.info(f"Attempting 'await rfp_file.close()' for {file_name}")
            await rfp_file.close()
            logger.info(f"Successfully closed file stream for {file_name}")

    final_text = "\n\n".join(full_extracted_text_parts)
    overall_status = "success"
    if any_errors:
        # If there's any extracted text despite some errors, it's partial success.
        # Otherwise, it's a full error.
        overall_status = "partial_success" if full_extracted_text_parts else "error"
        # Ensure processing_details_list is not empty if status is error/partial_success
        if not processing_details_list and all_files_to_process: # Should not happen if any_errors is True
             processing_details_list.append(ProcessingDetail(
                 file_name=all_files_to_process[0].filename if all_files_to_process else "unknown_file", 
                 method="unknown", status="error", error_message="Unknown processing error"
             ))


    return PDFProcessResponse(
        status=overall_status,
        extracted_text=final_text,
        processing_details=processing_details_list,
    )

@app.get("/")
def read_root():
    return {"status": "success", "message": "Python PDF Processing Service is running."}
