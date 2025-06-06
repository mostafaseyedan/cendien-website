/**
 * @file pdfHandler.js
 * @description Handles PDF parsing and text extraction using pdf.js.
 */

// We need to import the library in the main script, but this ensures we have a dedicated module for its logic.
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

// Set worker source once for the application. This should be called from the main app scripts.
export function initializePdfWorker() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';
}

/**
 * Extracts text content from a single PDF file.
 * @param {File} file - The PDF file object.
 * @returns {Promise<string>} - A promise that resolves with the extracted text.
 */
export function extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const pdfData = new Uint8Array(event.target.result);
                const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let fullText = '';
                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    // Join items with a space and add a newline for each page for better separation.
                    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                resolve(fullText.trim());
            } catch (err) {
                reject(new Error(`Failed to extract text from PDF '${file.name}': ${err.message}`));
            }
        };
        reader.onerror = (err) => reject(new Error(`FileReader error for '${file.name}': ${err.message}`));
        reader.readAsArrayBuffer(file);
    });
}
