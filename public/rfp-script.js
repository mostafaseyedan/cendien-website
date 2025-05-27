// At the top of rfp-script.js
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const analysisStatusArea = document.getElementById('analysis-status-area');
    const analysisResultsArea = document.getElementById('analysis-results-area');
    
    // Content divs for each tab
    const summaryResultContentDiv = document.getElementById('summary-result-content');
    const questionsResultContentDiv = document.getElementById('questions-result-content');
    const deadlinesResultContentDiv = document.getElementById('deadlines-result-content');
    const requirementsResultContentDiv = document.getElementById('requirements-result-content');
    const stakeholdersResultContentDiv = document.getElementById('stakeholders-result-content');
    const risksResultContentDiv = document.getElementById('risks-result-content');
    
    const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
    const noSavedAnalysesP = document.getElementById('no-saved-analyses');

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
            // Clear all tab content areas
            if(summaryResultContentDiv) summaryResultContentDiv.innerHTML = ''; 
            if(questionsResultContentDiv) questionsResultContentDiv.innerHTML = ''; 
            if(deadlinesResultContentDiv) deadlinesResultContentDiv.innerHTML = '';
            if(requirementsResultContentDiv) requirementsResultContentDiv.innerHTML = '';
            if(stakeholdersResultContentDiv) stakeholdersResultContentDiv.innerHTML = '';
            if(risksResultContentDiv) risksResultContentDiv.innerHTML = '';
        }
    };

    const hideLoadingStateRFP = (delay = 0) => {
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

    async function extractTextFromPdf(file) {
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
                        fullText += textContent.items.map(item => item.str).join(' ') + '\n'; 
                    }
                    resolve(fullText.trim());
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

    // Helper function to format and display content (handles basic bolding and lists)
    function formatAndDisplayContent(parentElement, textContent, sectionTitleForList) {
        if (!parentElement) {
            console.warn("Parent element for display not found for section:", sectionTitleForList || "Unknown");
            return;
        }
        parentElement.innerHTML = ''; // Clear previous content
        
        const lines = textContent.split('\n');
        let currentList = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                // Check if line starts with a list marker (e.g., *, -, 1.)
                const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);
                
                if (listMatch) {
                    if (!currentList) { // Start a new list if not already in one
                        // For questions, we always use <ol>. For others, use <ul> by default.
                        currentList = (parentElement === questionsResultContentDiv) ? document.createElement('ol') : document.createElement('ul');
                        if (parentElement === questionsResultContentDiv) currentList.className = 'numbered-list';
                        parentElement.appendChild(currentList);
                    }
                    const listItem = document.createElement('li');
                    listItem.innerHTML = formattedLine.substring(listMatch[0].length); // Remove the marker
                    currentList.appendChild(listItem);
                } else {
                    currentList = null; // End of a list
                    const p = document.createElement('p');
                    p.innerHTML = formattedLine;
                    parentElement.appendChild(p);
                }
            } else {
                 // If there's an empty line and we were in a list, end the list.
                currentList = null;
            }
        });
    }


    async function loadSavedAnalyses() {
        if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
        try {
            const response = await fetch('/api/rfp-analyses');
            if (!response.ok) {
                const errData = await response.json().catch(() => ({error: "Failed to fetch analyses."}));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const analyses = await response.json();
            savedAnalysesListDiv.innerHTML = ''; 
            if (analyses.length === 0) {
                noSavedAnalysesP.style.display = 'block';
            } else {
                noSavedAnalysesP.style.display = 'none';
                analyses.forEach(analysis => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'analyzed-rfp-item';
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'rfp-date';
                    let formattedDate = 'N/A';
                    if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') { 
                        const date = new Date(analysis.analysisDate._seconds * 1000); 
                        if (!isNaN(date.valueOf())) { 
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            formattedDate = `${year}/${month}/${day} ${hours}:${minutes}`;
                        }
                    } else if (typeof analysis.analysisDate === 'string') { /* ... date parsing ... */ }
                    dateSpan.textContent = formattedDate;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'rfp-name';
                    nameSpan.textContent = analysis.rfpTitle || analysis.rfpFileName || 'Unnamed RFP'; // Prefer rfpTitle
                    nameSpan.title = analysis.rfpTitle || analysis.rfpFileName || 'Unnamed RFP';
                    const statusDotSpan = document.createElement('span');
                    statusDotSpan.className = 'rfp-status-dot';
                    const statusColor = analysis.status === 'analyzed' ? 'green' : analysis.status === 'new' ? 'orange' : 'red';
                    statusDotSpan.classList.add(statusColor);
                    const viewLink = document.createElement('a');
                    viewLink.href = '#'; 
                    viewLink.className = 'rfp-view-details';
                    viewLink.dataset.id = analysis.id; 
                    viewLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    viewLink.title = "View Analysis Details";

                    viewLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const analysisId = e.currentTarget.dataset.id;
                        showLoadingStateRFP(true, `Loading analysis for ${nameSpan.textContent}...`);
                        analysisResultsArea.style.display = 'none'; 
                        try {
                            const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                            if (!detailResponse.ok) { /* ... error handling ... */ throw new Error("Failed to fetch details");}
                            const detailedAnalysis = await detailResponse.json();

                            formatAndDisplayContent(summaryResultContentDiv, detailedAnalysis.rfpSummary || "Summary not available.");
                            formatAndDisplayContent(questionsResultContentDiv, detailedAnalysis.generatedQuestions || "Questions not available.");
                            formatAndDisplayContent(deadlinesResultContentDiv, detailedAnalysis.rfpDeadlines || "Deadlines not extracted.");
                            formatAndDisplayContent(requirementsResultContentDiv, detailedAnalysis.rfpKeyRequirements || "Key Requirements not extracted.");
                            formatAndDisplayContent(stakeholdersResultContentDiv, detailedAnalysis.rfpStakeholders || "Stakeholders not extracted.");
                            formatAndDisplayContent(risksResultContentDiv, detailedAnalysis.rfpRisks || "Risks not extracted.");
                            
                            analysisResultsArea.style.display = 'block';
                            document.querySelector('.tabs-container .tab-link.active').click(); // Re-click active or default to first

                            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName}</p>`;
                            analysisStatusArea.style.display = 'flex';
                            hideLoadingStateRFP(5000);
                        } catch (loadError) { /* ... error handling ... */ } 
                        finally { generateAnalysisButton.disabled = false; }
                    });
                    itemDiv.appendChild(dateSpan); itemDiv.appendChild(nameSpan); itemDiv.appendChild(statusDotSpan); itemDiv.appendChild(viewLink);
                    savedAnalysesListDiv.appendChild(itemDiv);
                });
            }
        } catch (error) { /* ... error handling ... */ }
    }

    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            // Get values from new form fields
            const rfpTitle = document.getElementById('rfpTitle').value.trim() || "Untitled RFP Analysis";
            const rfpType = document.getElementById('rfpType').value;
            const submittedBy = document.getElementById('submittedBy').value;

            showLoadingStateRFP(true, "Starting analysis...");
            const file = rfpFileUpload.files[0];
            let rfpFileName = "UnknownRFP"; 
            if (!file) { /* ... validation ... */ return; }
            rfpFileName = file.name; 
            if (file.type !== "application/pdf") { /* ... validation ... */ return; }

            let rfpText = "";
            try { /* ... PDF extraction ... */ 
                 showLoadingStateRFP(true, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                if (!rfpText || rfpText.trim().length < 50) { throw new Error("Could not extract sufficient text from PDF.");}
            } catch (error) { /* ... error handling ... */ return; }

            const aiPrompt = `Please analyze the following Request for Proposal (RFP) text.
Provide the following distinct sections in your response, each clearly delimited:
1. A concise summary of the RFP.
2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.
3. Key Deadlines mentioned in the RFP.
4. A list of Key Requirements (e.g., mandatory, highly desirable).
5. Mentioned Stakeholders or Key Contacts.
6. Potential Risks or Red Flags identified in the RFP.

Use the following format strictly for each section:

###SUMMARY_START###
[Your generated summary of the RFP here. Aim for 5-8 key bullet points or a paragraph.]
###SUMMARY_END###

###QUESTIONS_START###
[Your list of generated questions here. Each question should ideally be on a new line. You can use natural numbering.]
###QUESTIONS_END###

###DEADLINES_START###
[List any key deadlines, e.g., Submission Deadline: YYYY-MM-DD, Q&A Period Ends: YYYY-MM-DD.]
###DEADLINES_END###

###KEY_REQUIREMENTS_START###
[List key requirements. You can use bullet points. Categorize if possible, e.g., **Mandatory:**, **Desirable:**.]
###KEY_REQUIREMENTS_END###

###STAKEHOLDERS_START###
[List any mentioned stakeholders, roles, or key contacts.]
###STAKEHOLDERS_END###

###RISKS_START###
[List any potential risks, ambiguities, or red flags identified.]
###RISKS_END###

RFP Text:
---
${rfpText}
---
`;
            // Initialize variables for all sections
            let summaryText, questionsText, deadlinesText, requirementsText, stakeholdersText, risksText;
            const defaultErrorMsg = (section) => `${section.replace(/_/g, ' ')} not extracted.`;

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

                const parseSection = (output, sectionName) => {
                    const regex = new RegExp(`###${sectionName}_START###([\\s\\S]*?)###${sectionName}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : defaultErrorMsg(sectionName);
                };

                summaryText = parseSection(rawAiOutput, "SUMMARY");
                questionsText = parseSection(rawAiOutput, "QUESTIONS");
                deadlinesText = parseSection(rawAiOutput, "DEADLINES");
                requirementsText = parseSection(rawAiOutput, "KEY_REQUIREMENTS");
                stakeholdersText = parseSection(rawAiOutput, "STAKEHOLDERS");
                risksText = parseSection(rawAiOutput, "RISKS");
                
                // Display Content in Tabs
                formatAndDisplayContent(summaryResultContentDiv, summaryText);
                formatAndDisplayContent(questionsResultContentDiv, questionsText); // Will be wrapped in OL by helper if list-like
                formatAndDisplayContent(deadlinesResultContentDiv, deadlinesText);
                formatAndDisplayContent(requirementsResultContentDiv, requirementsText);
                formatAndDisplayContent(stakeholdersResultContentDiv, stakeholdersText);
                formatAndDisplayContent(risksResultContentDiv, risksText);
                
                analysisResultsArea.style.display = 'block';
                document.querySelector('.tabs-container .tab-link.active').click(); // Re-activate current or default tab

                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete! Saving results...</p>`;
                analysisStatusArea.style.display = 'flex';

                try {
                    const savePayload = { 
                        rfpTitle: rfpTitle, // New field
                        rfpType: rfpType,   // New field
                        submittedBy: submittedBy, // New field
                        rfpFileName: rfpFileName, 
                        rfpSummary: summaryText, 
                        generatedQuestions: questionsText,
                        rfpDeadlines: deadlinesText,
                        rfpKeyRequirements: requirementsText,
                        rfpStakeholders: stakeholdersText,
                        rfpRisks: risksText,
                        status: 'analyzed' 
                    };
                    const saveResponse = await fetch('/api/rfp-analysis', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(savePayload)
                    });
                    if (!saveResponse.ok) { const saveErrorResult = await saveResponse.json().catch(() => ({error: "Failed to save and parse error."})); throw new Error(saveErrorResult.error || `Failed to save. Status: ${saveResponse.status}`);}
                    const saveData = await saveResponse.json();
                    console.log("Save response:", saveData);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Analysis complete and results saved!</p>`;
                    await loadSavedAnalyses(); 
                } catch (saveError) {
                    console.error("Error saving RFP analysis:", saveError);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">Analysis complete, but failed to save results: ${saveError.message}</p>`;
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
    } else { /* ... */ }

    window.openTab = function(evt, tabName) { /* ... same as before ... */ };
    
    const firstActiveTabButton = document.querySelector('.tabs-container .tab-link.active');
    if (firstActiveTabButton) {
        const tabNameToOpen = firstActiveTabButton.getAttribute('onclick').match(/'([^']*)'/)[1];
        if(document.getElementById(tabNameToOpen)) {
             document.getElementById(tabNameToOpen).style.display = "block";
        }
    } else { // Fallback if no tab is initially active in HTML
        const firstTabLink = document.querySelector('.tabs-container .tab-link');
        if (firstTabLink) firstTabLink.click();
    }
    loadSavedAnalyses(); 
});
