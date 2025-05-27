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
    const insightsResultContentDiv = document.getElementById('insights-result-content'); // New div for insights
    
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
            if(questionsResultContentDiv) questionsResultContentDiv.innerHTML = ''; 
            if(summaryResultContentDiv) summaryResultContentDiv.innerHTML = '';
            if(insightsResultContentDiv) insightsResultContentDiv.innerHTML = ''; // Clear insights
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

    function formatAndDisplayContent(parentElement, textContent, title) {
        parentElement.innerHTML = ''; // Clear previous content
        if (title) {
            const h4 = document.createElement('h4');
            h4.style.fontWeight = 'bold';
            h4.style.marginTop = '10px';
            h4.style.marginBottom = '5px';
            h4.textContent = title;
            parentElement.appendChild(h4);
        }

        textContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const p = document.createElement('p');
                let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Basic list item detection (could be improved)
                if (formattedLine.match(/^(\*|-|\d+\.)\s+/)) {
                    const ul = parentElement.querySelector('ul') || document.createElement('ul');
                    if (!parentElement.contains(ul)) {
                        parentElement.appendChild(ul);
                    }
                    const li = document.createElement('li');
                    li.innerHTML = formattedLine.replace(/^(\*|-|\d+\.)\s+/, '');
                    ul.appendChild(li);
                } else {
                    p.innerHTML = formattedLine;
                    parentElement.appendChild(p);
                }
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
                            const datePart = `<span class="math-inline">\{date\.getFullYear\(\)\}/</span>{String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                            const timePart = `<span class="math-inline">\{String\(date\.getHours\(\)\)\.padStart\(2, '0'\)\}\:</span>{String(date.getMinutes()).padStart(2, '0')}`;
                            formattedDate = `${datePart} ${timePart}`;
                        }
                    } else if (typeof analysis.analysisDate === 'string') { 
                        try {
                            const date = new Date(analysis.analysisDate);
                            if (!isNaN(date.valueOf())) { 
                                 formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                            }
                        } catch(e) { /* N/A */ }
                    }
                    dateSpan.textContent = formattedDate;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'rfp-name';
                    nameSpan.textContent = analysis.rfpFileName || 'Unnamed RFP';
                    nameSpan.title = analysis.rfpFileName || 'Unnamed RFP';
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
                            if (!detailResponse.ok) {
                                const errDetData = await detailResponse.json().catch(() => ({error: "Failed to fetch analysis details."}));
                                throw new Error(errDetData.error || `HTTP error! Status: ${detailResponse.status}`);
                            }
                            const detailedAnalysis = await detailResponse.json();

                            formatAndDisplayContent(summaryResultContentDiv, detailedAnalysis.rfpSummary || "Summary not available.");
                            
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

                            // Populate Key Insights Tab
                            insightsResultContentDiv.innerHTML = ''; // Clear previous
                            formatAndDisplayContent(insightsResultContentDiv, detailedAnalysis.rfpDeadlines || "Not extracted.", "Deadlines:");
                            formatAndDisplayContent(insightsResultContentDiv, detailedAnalysis.rfpKeyRequirements || "Not extracted.", "Key Requirements:");
                            formatAndDisplayContent(insightsResultContentDiv, detailedAnalysis.rfpStakeholders || "Not extracted.", "Stakeholders:");
                            formatAndDisplayContent(insightsResultContentDiv, detailedAnalysis.rfpRisks || "Not extracted.", "Potential Risks/Red Flags:");
                            
                            analysisResultsArea.style.display = 'block';
                            document.querySelector('.tabs-container .tab-link').click(); 

                            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Displaying saved analysis: ${detailedAnalysis.rfpFileName}</p>`;
                            analysisStatusArea.style.display = 'flex';
                            hideLoadingStateRFP(5000);

                        } catch (loadError) {
                            console.error("Error loading saved analysis:", loadError);
                            analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error loading analysis: ${loadError.message}</p>`;
                            analysisStatusArea.style.display = 'flex';
                            hideLoadingStateRFP(5000);
                        } finally {
                           generateAnalysisButton.disabled = false;
                        }
                    });
                    itemDiv.appendChild(dateSpan); itemDiv.appendChild(nameSpan); itemDiv.appendChild(statusDotSpan); itemDiv.appendChild(viewLink);
                    savedAnalysesListDiv.appendChild(itemDiv);
                });
            }
        } catch (error) {
            console.error("Failed to load saved RFP analyses:", error);
            noSavedAnalysesP.textContent = `Error loading analyses: ${error.message}`;
            noSavedAnalysesP.style.display = 'block';
            savedAnalysesListDiv.innerHTML = '';
        }
    }

    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            showLoadingStateRFP(true, "Starting analysis...");
            const file = rfpFileUpload.files[0];
            let rfpFileName = "UnknownRFP"; 
            if (!file) { analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please select an RFP PDF file.</p>`; analysisStatusArea.style.display = 'flex'; hideLoadingStateRFP(5000); generateAnalysisButton.disabled = false; return; }
            rfpFileName = file.name; 
            if (file.type !== "application/pdf") { analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Invalid file type. Please upload a PDF.</p>`; analysisStatusArea.style.display = 'flex'; hideLoadingStateRFP(5000); generateAnalysisButton.disabled = false; return;}

            let rfpText = "";
            try { 
                showLoadingStateRFP(true, "Extracting text from PDF...");
                rfpText = await extractTextFromPdf(file);
                if (!rfpText || rfpText.trim().length < 50) { throw new Error("Could not extract sufficient text from the PDF, or PDF is empty/corrupted.");}
            } catch (error) { console.error("Error extracting PDF text:", error); analysisStatusArea.innerHTML = `<p class="loading-text" style="color:red;">${error.message}</p>`; analysisStatusArea.style.display = 'flex'; hideLoadingStateRFP(5000); generateAnalysisButton.disabled = false; return; }

            const aiPrompt = `Please analyze the following Request for Proposal (RFP) text.
Provide the following distinct sections in your response, each clearly delimited:
1. A concise summary of the RFP.
2. A list of 10 to 20 critical and insightful clarification questions based on the RFP.
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
            // Initialize variables to hold parsed AI output
            let summaryText = "Summary could not be extracted.";
            let questionsText = "Questions could not be extracted.";
            let deadlinesText = "Deadlines not extracted.";
            let requirementsText = "Key Requirements not extracted.";
            let stakeholdersText = "Stakeholders not extracted.";
            let risksText = "Risks not extracted.";

            try {
                showLoadingStateRFP(true, "AI is analyzing and generating content...");
                const response = await fetch('/api/generate', { 
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
                    return match && match[1] ? match[1].trim() : `${sectionName.replace(/_/g, ' ')} not extracted.`;
                };

                summaryText = parseSection(rawAiOutput, "SUMMARY");
                questionsText = parseSection(rawAiOutput, "QUESTIONS");
                deadlinesText = parseSection(rawAiOutput, "DEADLINES");
                requirementsText = parseSection(rawAiOutput, "KEY_REQUIREMENTS");
                stakeholdersText = parseSection(rawAiOutput, "STAKEHOLDERS");
                risksText = parseSection(rawAiOutput, "RISKS");
                
                // Display Content in Tabs
                formatAndDisplayContent(summaryResultContentDiv, summaryText);
                questionsResultContentDiv.innerHTML = ''; const qL=document.createElement('ol'); qL.className='numbered-list'; questionsText.split('\n').forEach(q => {const tQ=q.trim(); if(tQ){const li=document.createElement('li'); let fQ=tQ.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>'); fQ=fQ.replace(/^(\*|-|\d+\.)\s+/,''); li.innerHTML=fQ; qL.appendChild(li);}}); questionsResultContentDiv.appendChild(qL);
                
                insightsResultContentDiv.innerHTML = ''; // Clear previous insights
                formatAndDisplayContent(insightsResultContentDiv, deadlinesText, "Deadlines:");
                formatAndDisplayContent(insightsResultContentDiv, requirementsText, "Key Requirements:");
                formatAndDisplayContent(insightsResultContentDiv, stakeholdersText, "Stakeholders:");
                formatAndDisplayContent(insightsResultContentDiv, risksText, "Potential Risks/Red Flags:");

                analysisResultsArea.style.display = 'block';
                const firstTabLink = document.querySelector('.tabs-container .tab-link');
                if (firstTabLink) firstTabLink.click();
                analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete! Saving results...</p>`;
                analysisStatusArea.style.display = 'flex';

                try {
                    const saveResponse = await fetch('/api/rfp-analysis', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            rfpFileName: rfpFileName, 
                            rfpSummary: summaryText, 
                            generatedQuestions: questionsText,
                            rfpDeadlines: deadlinesText,
                            rfpKeyRequirements: requirementsText,
                            rfpStakeholders: stakeholdersText,
                            rfpRisks: risksText,
                            status: 'analyzed' 
                        })
                    });
                    if (!saveResponse.ok) { const saveErrorResult = await saveResponse.json().catch(() => ({error: "Failed to save analysis and couldn't parse error."})); throw new Error(saveErrorResult.error || `Failed to save analysis. Status: ${saveResponse.status}`);}
                    const saveData = await saveResponse.json();
                    console.log("Save response:", saveData);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:green;">RFP analysis complete and results saved!</p>`;
                    await loadSavedAnalyses(); 
                } catch (saveError) {
                    console.error("Error saving RFP analysis:", saveError);
                    analysisStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">RFP analysis complete, but failed to save results: ${saveError.message}</p>`;
                }
                hideLoadingStateRFP(5000);

            } catch (error) { 
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

    window.openTab = function(evt, tabName) { 
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
        const targetTab = document.getElementById(tabName);
        if (targetTab) targetTab.style.display = "block";
        if (evt && evt.currentTarget) evt.currentTarget.className += " active";
    };
    
    const firstTabLink = document.querySelector('.tabs-container .tab-link');
    if (firstTabLink && document.getElementById('questions-tab')) {
        const activeTab = document.querySelector('.tabs-container .tab-link.active');
        if(!activeTab){
            document.getElementById('questions-tab').style.display = "block";
            if (firstTabLink) firstTabLink.className += " active"; // Check firstTabLink again
        } else {
            const activeTabName = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
            const activeTabContent = document.getElementById(activeTabName);
            if (activeTabContent) {
                activeTabContent.style.display = "block";
            }
        }
    }
    loadSavedAnalyses(); 
});
