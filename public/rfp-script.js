// At the top of rfp-script.js
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const analysisStatusArea = document.getElementById('analysis-status-area');
    const analysisResultsArea = document.getElementById('analysis-results-area');
    const questionsResultContentDiv = document.getElementById('questions-result-content');
    const summaryResultContentDiv = document.getElementById('summary-result-content');
    const yearSpanRFP = document.getElementById('current-year-rfp');

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    const showLoadingStateRFP = (isLoading, message = "Processing...") => {
        // ... (your existing showLoadingStateRFP function)
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
        }
    };

    const hideLoadingStateRFP = (delay = 0) => {
        // ... (your existing hideLoadingStateRFP function)
         setTimeout(() => {
            if (analysisStatusArea) {
                 if (analysisStatusArea.innerHTML.includes('<div class="spinner">')) { // Only hide if it's a generic loading
                    analysisStatusArea.style.display = 'none';
                    analysisStatusArea.innerHTML = '';
                }
            }
            if (generateAnalysisButton) generateAnalysisButton.disabled = false;
        }, delay);
    };

    async function extractTextFromPdf(file) {
        // ... (your existing extractTextFromPdf function)
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
                        textContent += text.items.map(item => item.str).join(' ') + '\n'; 
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
            let rfpFileName = "UnknownRFP"; // Default filename

            if (!file) {
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please select an RFP PDF file.</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                generateAnalysisButton.disabled = false;
                return;
            }
            rfpFileName = file.name; // Get the filename

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

                if (!rfpText || rfpText.trim().length < 50) {
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
2. A list of at least 10 critical and insightful clarification questions based on the RFP. These questions should help in better understanding specific needs, scope, constraints, and expectations to prepare a comprehensive proposal. Focus on questions that uncover ambiguities or unstated assumptions.

Use the following format strictly:

###SUMMARY_START###
[Your generated summary of the RFP here. Aim for key bullet points ideally.]
###SUMMARY_END###

###QUESTIONS_START###
[Your list of generated questions here. Each question should ideally be on a new line. You can use natural numbering. Use bold titles to separate project sections.]
###QUESTIONS_END###

RFP Text:
---
${rfpText}
---
`;

            let summaryText = "Summary could not be extracted."; // Initialize for broader scope
            let questionsText = "Questions could not be extracted."; // Initialize for broader scope

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
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');

                const summaryMatch = rawAiOutput.match(/###SUMMARY_START###([\s\S]*?)###SUMMARY_END###/);
                summaryText = summaryMatch && summaryMatch[1] ? summaryMatch[1].trim() : summaryText;
                
                const questionsMatch = rawAiOutput.match(/###QUESTIONS_START###([\s\S]*?)###QUESTIONS_END###/);
                questionsText = questionsMatch && questionsMatch[1] ? questionsMatch[1].trim() : questionsText;

                // Display Summary
                summaryResultContentDiv.innerHTML = '';
                summaryText.split('\n').forEach(line => { /* ... (your existing display logic for summary, converting ** to <strong>) ... */ 
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                        const p = document.createElement('p');
                        let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        p.innerHTML = formattedLine; 
                        summaryResultContentDiv.appendChild(p);
                    }
                });

                // Display Questions
                questionsResultContentDiv.innerHTML = '';
                const questionsList = document.createElement('ol');
                questionsList.className = 'numbered-list';
                questionsText.split('\n').forEach(q => { /* ... (your existing display logic for questions, converting ** to <strong>) ... */ 
                    const trimmedQuestion = q.trim();
                    if (trimmedQuestion) {
                        const listItem = document.createElement('li');
                        let formattedQuestion = trimmedQuestion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        formattedQuestion = formattedQuestion.replace(/^(\*|-|\d+\.)\s+/, ''); 
                        listItem.innerHTML = formattedQuestion; 
                        questionsList.appendChild(listItem);
                    }
                });
                questionsResultContentDiv.appendChild(questionsList);

                analysisResultsArea.style.display = 'block';
                const firstTabLink = document.querySelector('.tabs-container .tab-link');
                if (firstTabLink) firstTabLink.click(); 

                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete! Saving results...</p>`;
                analysisStatusArea.style.display = 'flex';

                // **** NEW: Save the analysis ****
                try {
                    const saveResponse = await fetch('/api/rfp-analysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            rfpFileName: rfpFileName,
                            rfpSummary: summaryText,
                            generatedQuestions: questionsText,
                            status: 'analyzed' // Or any default status you prefer
                        })
                    });
                    if (!saveResponse.ok) {
                        const saveErrorResult = await saveResponse.json().catch(() => ({error: "Failed to save analysis and couldn't parse error."}));
                        throw new Error(saveErrorResult.error || `Failed to save analysis. Status: ${saveResponse.status}`);
                    }
                    const saveData = await saveResponse.json();
                    console.log("Save response:", saveData);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete and results saved!</p>`;
                } catch (saveError) {
                    console.error("Error saving RFP analysis:", saveError);
                    // Update status to show analysis was done but saving failed.
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">RFP analysis complete, but failed to save results: ${saveError.message}</p>`;
                }
                // ******************************

                hideLoadingStateRFP(5000);

            } catch (error) {
                console.error("Error during AI analysis or saving:", error);
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex'; // Ensure status area is visible for errors
                hideLoadingStateRFP(5000);
            } finally {
                generateAnalysisButton.disabled = false;
            }
        });
    } else {
        console.error("RFP form (#rfp-details-form) not found.");
    }

    window.openTab = function(evt, tabName) { /* ... (your existing openTab function) ... */ 
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
    };
    const firstTabLink = document.querySelector('.tabs-container .tab-link');
    if (firstTabLink && document.getElementById('questions-tab')) {
        const activeTab = document.querySelector('.tabs-container .tab-link.active');
        if(!activeTab){
            document.getElementById('questions-tab').style.display = "block";
            firstTabLink.className += " active";
        } else {
            const activeTabName = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
            if (document.getElementById(activeTabName)) {
                document.getElementById(activeTabName).style.display = "block";
            }
        }
    }
});
