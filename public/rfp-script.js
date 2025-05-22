// At the top of rfp-script.js
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

// Set the workerSrc for PDF.js
// Ensure this URL is correct and the worker file is accessible.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button'); // ID updated in HTML
    const analysisStatusArea = document.getElementById('analysis-status-area'); // ID updated in HTML
    const analysisResultsArea = document.getElementById('analysis-results-area'); // Main container for tabs
    
    // Specific content divs within tabs
    const questionsResultContentDiv = document.getElementById('questions-result-content');
    const summaryResultContentDiv = document.getElementById('summary-result-content');
    
    const yearSpanRFP = document.getElementById('current-year-rfp');

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    const showLoadingStateRFP = (isLoading, message = "Processing...") => {
        if (!analysisStatusArea) return;
        if (isLoading) {
            analysisStatusArea.style.display = 'flex';
            analysisStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if (generateAnalysisButton) generateAnalysisButton.disabled = true;
            analysisResultsArea.style.display = 'none'; 
            if(questionsResultContentDiv) questionsResultContentDiv.innerHTML = ''; 
            if(summaryResultContentDiv) summaryResultContentDiv.innerHTML = '';
        } else {
            // Button re-enabling handled in finally or specific success/error
        }
    };

    const hideLoadingStateRFP = (delay = 0) => {
        setTimeout(() => {
            if (analysisStatusArea) {
                // Only hide if it's just a generic loading message, not an error/success message
                 if (analysisStatusArea.innerHTML.includes('<div class="spinner">')) {
                    analysisStatusArea.style.display = 'none';
                    analysisStatusArea.innerHTML = '';
                }
            }
            if (generateAnalysisButton) generateAnalysisButton.disabled = false;
        }, delay);
    };

    // Basic conceptual function for PDF text extraction
    async function extractTextFromPdf(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const pdfData = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        // Join text items, ensuring spaces between words that might be separate items
                        textContent += text.items.map(item => item.str).join(' ') + '\n'; // Add newline after each page's content
                    }
                    resolve(textContent.trim());
                } catch (err) {
                    console.error("Error during PDF.js processing:", err);
                    reject(new Error(`Failed to extract text from PDF: ${err.message}`));
                }
            };
            reader.onerror = (err) => {
                console.error("FileReader error:", err);
                reject(new Error(`FileReader error: ${err.message}`));
            };
            reader.readAsArrayBuffer(file);
        });
    }


    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            showLoadingStateRFP(true, "Starting analysis...");

            const file = rfpFileUpload.files[0];

            if (!file) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please select an RFP PDF file.</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                generateAnalysisButton.disabled = false;
                return;
            }

            if (file.type !== "application/pdf") {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Invalid file type. Please upload a PDF.</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                generateAnalysisButton.disabled = false;
                return;
            }

            let rfpText = "";
            try {
                showLoadingStateRFP(true, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                console.log("Extracted RFP Text (first 500 chars):", rfpText.substring(0, 500) + "...");

                if (!rfpText || rfpText.trim().length < 50) { // Basic check for content
                    throw new Error("Could not extract sufficient text from the PDF, or PDF is empty/corrupted.");
                }
            } catch (error) {
                console.error("Error extracting PDF text:", error);
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                generateAnalysisButton.disabled = false;
                return;
            }

            const aiPrompt = `Please analyze the following Request for Proposal (RFP) text.
Provide two distinct sections in your response, clearly delimited:
1. A concise summary of the RFP.
2. A list of 5 to 10 critical and insightful clarification questions based on the RFP. These questions should help in better understanding specific needs, scope, constraints, and expectations to prepare a comprehensive proposal. Focus on questions that uncover ambiguities or unstated assumptions.

Use the following format strictly:

###SUMMARY_START###
[Your generated summary of the RFP here. Aim for 3-5 key bullet points or a short paragraph.]
###SUMMARY_END###

###QUESTIONS_START###
[Your list of generated questions here. Each question should ideally be on a new line. You can use natural numbering or bullets if appropriate.]
###QUESTIONS_END###

RFP Text:
---
${rfpText}
---
`;

            try {
                showLoadingStateRFP(true, "AI is analyzing and generating content...");
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt })
                });

                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' }));
                    throw new Error(errorResult.error || `AI API error! Status: ${response.status}`);
                }

                const data = await response.json();
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, ''); // Handle multiline ```

                // Parse summary
                const summaryMatch = rawAiOutput.match(/###SUMMARY_START###([\s\S]*?)###SUMMARY_END###/);
                const summaryText = summaryMatch && summaryMatch[1] ? summaryMatch[1].trim() : "Summary could not be extracted.";
                
                // Parse questions
                const questionsMatch = rawAiOutput.match(/###QUESTIONS_START###([\s\S]*?)###QUESTIONS_END###/);
                const questionsText = questionsMatch && questionsMatch[1] ? questionsMatch[1].trim() : "Questions could not be extracted.";

                // Display Summary
                summaryResultContentDiv.innerHTML = ''; // Clear previous
                summaryText.split('\n').forEach(line => {
                    if (line.trim()) {
                        const p = document.createElement('p');
                        // Basic formatting: if line starts with typical bullet/number, treat as list item conceptually
                        if (line.trim().match(/^(\*|-|\d+\.)\s+/)) {
                            const li = document.createElement('li');
                            li.textContent = line.trim().replace(/^(\*|-|\d+\.)\s+/, '');
                            // If you want to append to a UL, create UL first
                            summaryResultContentDiv.appendChild(li); // Or append to a UL
                        } else {
                            p.textContent = line.trim();
                            summaryResultContentDiv.appendChild(p);
                        }
                    }
                });


                // Display Questions (formatted as an ordered list)
                questionsResultContentDiv.innerHTML = ''; // Clear previous
                const questionsList = document.createElement('ol');
                questionsList.className = 'numbered-list'; // For potential specific styling
                questionsText.split('\n').forEach(q => {
                    if (q.trim()) {
                        const listItem = document.createElement('li');
                        listItem.textContent = q.trim().replace(/^(\*|-|\d+\.)\s+/, ''); // Clean up existing bullets/numbers
                        questionsList.appendChild(listItem);
                    }
                });
                questionsResultContentDiv.appendChild(questionsList);

                analysisResultsArea.style.display = 'block';
                // Ensure the "Questions" tab is active by default if it's the first one
                document.querySelector('.tabs-container .tab-link').click(); // Simulate click on first tab to show it

                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete!</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);

            } catch (error) {
                console.error("Error generating analysis with AI:", error);
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error during AI analysis: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
            } finally {
                generateAnalysisButton.disabled = false;
            }
        });
    } else {
        console.error("RFP form (#rfp-details-form) not found.");
    }

    // Tab switching logic (if you move it from HTML)
    // Ensure the openTab function is defined here if not inline in HTML.
    // Example:
    window.openTab = function(evt, tabName) { // Expose to global scope if called by inline HTML onclick
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.style.display = "block";
        }
        if (evt && evt.currentTarget) {
            evt.currentTarget.className += " active";
        }
    }
    // Initialize the first tab (Questions) as active if not already handled by HTML/CSS
    const firstTabLink = document.querySelector('.tabs-container .tab-link');
    if (firstTabLink && document.getElementById('questions-tab')) {
         // Check if no tab is active yet (e.g. on initial load after results are populated)
        const activeTab = document.querySelector('.tabs-container .tab-link.active');
        if(!activeTab){
            document.getElementById('questions-tab').style.display = "block";
            firstTabLink.className += " active";
        } else {
             // If a tab is already active (e.g. from previous interaction or HTML default), ensure its content is visible
            const activeTabName = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
            if (document.getElementById(activeTabName)) {
                document.getElementById(activeTabName).style.display = "block";
            }
        }
    }


});
