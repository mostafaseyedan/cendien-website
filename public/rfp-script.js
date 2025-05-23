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
    
    // New elements for the saved analyses list
    const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
    const noSavedAnalysesP = document.getElementById('no-saved-analyses');

    const yearSpanRFP = document.getElementById('current-year-rfp');

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    const showLoadingStateRFP = (isLoading, message = "Processing...") => { /* ... same as before ... */ 
        if (!analysisStatusArea) return;
        if (isLoading) {
            analysisStatusArea.style.display = 'flex';
            analysisStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if (generateAnalysisButton) generateAnalysisButton.disabled = true;
            // Keep analysisResultsArea visible if it already has content from a previous load
            // analysisResultsArea.style.display = 'none'; 
            // if(questionsResultContentDiv) questionsResultContentDiv.innerHTML = ''; 
            // if(summaryResultContentDiv) summaryResultContentDiv.innerHTML = '';
        }
    };

    const hideLoadingStateRFP = (delay = 0) => { /* ... same as before ... */ 
        setTimeout(() => {
            if (analysisStatusArea) {
                 if (analysisStatusArea.innerHTML.includes('<div class="spinner">')) {
                    analysisStatusArea.style.display = 'none';
                    analysisStatusArea.innerHTML = '';
                }
            }
            if (generateAnalysisButton) generateAnalysisButton.disabled = false;
        }, delay);
    };

    async function extractTextFromPdf(file) { /* ... same as before ... */ 
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

    // **** NEW FUNCTION: Load and display saved RFP analyses ****
    async function loadSavedAnalyses() {
        if (!savedAnalysesListDiv || !noSavedAnalysesP) return;

        try {
            // Optionally show a small loading indicator for this list
            // savedAnalysesListDiv.innerHTML = '<p>Loading saved analyses...</p>'; 
            
            const response = await fetch('/api/rfp-analyses');
            if (!response.ok) {
                const errData = await response.json().catch(() => ({error: "Failed to fetch analyses."}));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const analyses = await response.json();

            savedAnalysesListDiv.innerHTML = ''; // Clear previous items or loading message

            if (analyses.length === 0) {
                noSavedAnalysesP.style.display = 'block';
            } else {
                noSavedAnalysesP.style.display = 'none';
                analyses.forEach(analysis => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'analyzed-rfp-item';

                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'rfp-date';
                    // Format Firestore Timestamp (assuming analysisDate is a Firestore Timestamp object)
                    analyses.forEach(analysis => {
                        console.log("Raw analysisDate from server:", analysis.analysisDate); 
                        console.log("Type of analysisDate:", typeof analysis.analysisDate);

                        let formattedDate = 'N/A';
                    // MODIFIED CONDITION: Check for _seconds
                            if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') { 
                                const date = new Date(analysis.analysisDate._seconds * 1000); // Use _seconds
                            if (!isNaN(date.valueOf())) { 
                                formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                            } else {
                                console.warn("Timestamp object with _seconds resulted in invalid Date:", analysis.analysisDate);
                          }
                            } else if (typeof analysis.analysisDate === 'string') { 
    // This block remains as a fallback if the date is already a string
                              try {
                                const date = new Date(analysis.analysisDate);
                                if (!isNaN(date.valueOf())) { 
                                 formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                            } else {
                                console.warn("Date string was unparsable or resulted in invalid Date:", analysis.analysisDate);
                            }
                            } catch(e) { 
                                console.error("Error parsing date string:", analysis.analysisDate, e);
                            }
                            } else if (analysis.analysisDate) { 
                                console.warn("analysisDate is in an unexpected format (not string or expected timestamp object):", analysis.analysisDate);
                            }
                            dateSpan.textContent = formattedDate;
                });

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'rfp-name';
                    nameSpan.textContent = analysis.rfpFileName || 'Unnamed RFP';
                    nameSpan.title = analysis.rfpFileName || 'Unnamed RFP'; // Show full name on hover

                    const statusDotSpan = document.createElement('span');
                    statusDotSpan.className = 'rfp-status-dot';
                    // Map status to color - customize this as needed
                    // Assuming 'status' field exists, e.g., 'analyzed', 'new', 'error'
                    const statusColor = analysis.status === 'analyzed' ? 'green' : 
                                        analysis.status === 'new' ? 'orange' : 'red'; // Example
                    statusDotSpan.classList.add(statusColor);


                    const viewLink = document.createElement('a');
                    viewLink.href = '#'; // Prevent page jump
                    viewLink.className = 'rfp-view-details';
                    viewLink.dataset.id = analysis.id; // Store Firestore document ID
                    viewLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    viewLink.title = "View Analysis Details";

                    viewLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const analysisId = e.currentTarget.dataset.id;
                        console.log(`View details for analysis ID: ${analysisId}`);
                        showLoadingStateRFP(true, `Loading analysis for ${nameSpan.textContent}...`);
                        analysisResultsArea.style.display = 'none'; // Hide while loading new
                        try {
                            const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                            if (!detailResponse.ok) {
                                const errDetData = await detailResponse.json().catch(() => ({error: "Failed to fetch analysis details."}));
                                throw new Error(errDetData.error || `HTTP error! Status: ${detailResponse.status}`);
                            }
                            const detailedAnalysis = await detailResponse.json();

                            // Populate summary tab
                            summaryResultContentDiv.innerHTML = '';
                            (detailedAnalysis.rfpSummary || "Summary not available.").split('\n').forEach(line => {
                                const p = document.createElement('p');
                                p.innerHTML = line.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                summaryResultContentDiv.appendChild(p);
                            });

                            // Populate questions tab
                            questionsResultContentDiv.innerHTML = '';
                            const qList = document.createElement('ol');
                            qList.className = 'numbered-list';
                            (detailedAnalysis.generatedQuestions || "Questions not available.").split('\n').forEach(q => {
                                if (q.trim()) {
                                    const li = document.createElement('li');
                                    let fq = q.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                    fq = fq.replace(/^(\*|-|\d+\.)\s+/, '');
                                    li.innerHTML = fq;
                                    qList.appendChild(li);
                                }
                            });
                            questionsResultContentDiv.appendChild(qList);
                            
                            analysisResultsArea.style.display = 'block';
                            document.querySelector('.tabs-container .tab-link').click(); // Activate first tab

                            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${detailedAnalysis.rfpFileName}</p>`;
                            analysisStatusArea.style.display = 'flex';
                            hideLoadingStateRFP(5000);

                        } catch (loadError) {
                            console.error("Error loading saved analysis:", loadError);
                            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error loading analysis: ${loadError.message}</p>`;
                            analysisStatusArea.style.display = 'flex';
                            hideLoadingStateRFP(5000);
                        } finally {
                           generateAnalysisButton.disabled = false; // Ensure main button is re-enabled
                        }
                    });

                    itemDiv.appendChild(dateSpan);
                    itemDiv.appendChild(nameSpan);
                    itemDiv.appendChild(statusDotSpan);
                    itemDiv.appendChild(viewLink);
                    savedAnalysesListDiv.appendChild(itemDiv);
                });
            }
        } catch (error) {
            console.error("Failed to load saved RFP analyses:", error);
            noSavedAnalysesP.textContent = `Error loading analyses: ${error.message}`;
            noSavedAnalysesP.style.display = 'block';
            savedAnalysesListDiv.innerHTML = ''; // Clear any partial content or loading message
        }
    }
    // **********************************************************


    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            // ... (existing submit handler logic for file validation, PDF extraction, AI call) ...
            event.preventDefault();
            showLoadingStateRFP(true, "Starting analysis...");

            const file = rfpFileUpload.files[0];
            let rfpFileName = "UnknownRFP"; 

            if (!file) { /* ... */ analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please select an RFP PDF file.</p>`; analysisStatusArea.style.display = 'flex'; hideLoadingStateRFP(5000); generateAnalysisButton.disabled = false; return; }
            rfpFileName = file.name; 

            if (file.type !== "application/pdf") { /* ... */ analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Invalid file type. Please upload a PDF.</p>`; analysisStatusArea.style.display = 'flex'; hideLoadingStateRFP(5000); generateAnalysisButton.disabled = false; return;}

            let rfpText = "";
            try { /* ... PDF extraction ... */ 
                showLoadingStateRFP(true, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                if (!rfpText || rfpText.trim().length < 50) { throw new Error("Could not extract sufficient text from the PDF, or PDF is empty/corrupted.");}
            } catch (error) { /* ... error handling ... */ console.error("Error extracting PDF text:", error); analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">${error.message}</p>`; analysisStatusArea.style.display = 'flex'; hideLoadingStateRFP(5000); generateAnalysisButton.disabled = false; return; }

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
            let summaryText = "Summary could not be extracted.";
            let questionsText = "Questions could not be extracted.";

            try {
                showLoadingStateRFP(true, "AI is analyzing and generating content...");
                const response = await fetch('/api/generate', { /* ... AI call ... */ 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt })
                });
                if (!response.ok) { const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' })); throw new Error(errorResult.error || `AI API error! Status: ${response.status}`); }
                const data = await response.json();
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
                const summaryMatch = rawAiOutput.match(/###SUMMARY_START###([\s\S]*?)###SUMMARY_END###/);
                summaryText = summaryMatch && summaryMatch[1] ? summaryMatch[1].trim() : summaryText;
                const questionsMatch = rawAiOutput.match(/###QUESTIONS_START###([\s\S]*?)###QUESTIONS_END###/);
                questionsText = questionsMatch && questionsMatch[1] ? questionsMatch[1].trim() : questionsText;

                // Display Summary & Questions (logic from previous step)
                summaryResultContentDiv.innerHTML = ''; summaryText.split('\n').forEach(line => { const tL=line.trim(); if(tL){const p=document.createElement('p'); p.innerHTML=tL.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'); summaryResultContentDiv.appendChild(p);}});
                questionsResultContentDiv.innerHTML = ''; const qL=document.createElement('ol'); qL.className='numbered-list'; questionsText.split('\n').forEach(q => {const tQ=q.trim(); if(tQ){const li=document.createElement('li'); let fQ=tQ.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'); fQ=fQ.replace(/^(\*|-|\d+\.)\s+/,''); li.innerHTML=fQ; qL.appendChild(li);}}); questionsResultContentDiv.appendChild(qL);
                
                analysisResultsArea.style.display = 'block';
                const firstTabLink = document.querySelector('.tabs-container .tab-link');
                if (firstTabLink) firstTabLink.click();
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete! Saving results...</p>`;
                analysisStatusArea.style.display = 'flex';

                // Save the analysis
                try {
                    const saveResponse = await fetch('/api/rfp-analysis', { /* ... save call ... */ 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rfpFileName: rfpFileName, rfpSummary: summaryText, generatedQuestions: questionsText, status: 'analyzed' })
                    });
                    if (!saveResponse.ok) { const saveErrorResult = await saveResponse.json().catch(() => ({error: "Failed to save analysis and couldn't parse error."})); throw new Error(saveErrorResult.error || `Failed to save analysis. Status: ${saveResponse.status}`);}
                    const saveData = await saveResponse.json();
                    console.log("Save response:", saveData);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete and results saved!</p>`;
                    await loadSavedAnalyses(); // Refresh the list after saving
                } catch (saveError) {
                    console.error("Error saving RFP analysis:", saveError);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">RFP analysis complete, but failed to save results: ${saveError.message}</p>`;
                }
                hideLoadingStateRFP(5000);

            } catch (error) { /* ... error handling for AI call ... */ 
                console.error("Error during AI analysis or saving:", error);
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error: ${error.message}</p>`;
                analysisStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
            } finally {
                generateAnalysisButton.disabled = false;
            }
        });
            } else {
        console.error("RFP form (#rfp-details-form) not found.");
    }

    window.openTab = function(evt, tabName) { /* ... same as before ... */ 
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
        const targetTab = document.getElementById(tabName);
        if (targetTab) targetTab.style.display = "block";
        if (evt && evt.currentTarget) evt.currentTarget.className += " active";
    };
    
    // Load saved analyses when the page loads
    loadSavedAnalyses(); 
});
