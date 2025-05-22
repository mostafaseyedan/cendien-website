import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const generateQuestionsButton = document.getElementById('generate-questions-button');
    const questionStatusArea = document.getElementById('question-generation-status');
    const generatedQuestionsArea = document.getElementById('generated-questions-area');
    const questionsResultDiv = document.getElementById('questions-result');
    const yearSpanRFP = document.getElementById('current-year-rfp'); 

    if (yearSpanRFP && !yearSpanRFP.textContent) { 
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    const showLoadingStateRFP = (isLoading, message = "Processing...") => {
        if (!questionStatusArea) return;
        if (isLoading) {
            questionStatusArea.style.display = 'flex'; 
            questionStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if (generateQuestionsButton) generateQuestionsButton.disabled = true;
            generatedQuestionsArea.style.display = 'none'; 
            questionsResultDiv.innerHTML = ''; 
        } else {
            // Button re-enabling and hiding of status will be handled after processing
        }
    };

    const hideLoadingStateRFP = (delay = 0) => {
        setTimeout(() => {
            if (questionStatusArea) {
                // Keep the status message if it's a success/error, or clear if it was just loading
                if (!questionStatusArea.textContent.includes("Error") && !questionStatusArea.textContent.includes("successfully")) {
                    questionStatusArea.style.display = 'none';
                    questionStatusArea.innerHTML = '';
                }
            }
            if (generateQuestionsButton) generateQuestionsButton.disabled = false;
        }, delay);
    };


    if (rfpForm) {
        rfpForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            showLoadingStateRFP(true, "Analyzing RFP and generating questions...");

            const file = rfpFileUpload.files[0];

            if (!file) {
                questionStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Please select an RFP PDF file.</p>`;
                questionStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000); // Hide error after 5s, re-enable button
                generateQuestionsButton.disabled = false; // Explicitly re-enable
                return;
            }

            if (file.type !== "application/pdf") {
                questionStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Invalid file type. Please upload a PDF.</p>`;
                questionStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                generateQuestionsButton.disabled = false; // Explicitly re-enable
                return;
            }

            // Placeholder for PDF text extraction
            let rfpText = "";
            try {
                showLoadingStateRFP(true, "Extracting text from PDF...");

                rfpText = `Simulated RFP text from ${file.name}. This RFP is for a new enterprise software solution. Key requirements include cloud compatibility, robust security features, and scalability for up to 10,000 users. The proposal should detail the implementation timeline, training plan, and post-launch support structure. We are also interested in understanding data migration strategies from our current legacy system.`;
                console.log("Extracted (Simulated) RFP Text:", rfpText.substring(0, 200) + "..."); // Log snippet

                if (!rfpText || rfpText.trim().length < 50) { // Basic check for content
                    throw new Error("Could not extract sufficient text from the PDF, or PDF is empty/corrupted.");
                }

            } catch (error) {
                console.error("Error extracting PDF text:", error);
                questionStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error extracting text from PDF: ${error.message}</p>`;
                questionStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
                generateQuestionsButton.disabled = false; // Explicitly re-enable
                return;
            }

            // Prepare prompt for AI
            //const aiPrompt = `Based on the following Request for Proposal (RFP) text, please generate a list of 5 to 10 critical and insightful clarification questions that should be asked to the client. These questions should help in better understanding their specific needs, scope, constraints, and expectations to prepare a comprehensive and effective proposal. Focus on questions that uncover ambiguities or unstated assumptions.
            const aiPrompt = `Generate questions for this RFP.'

${rfpText}


Generated Questions:`;

            try {
                showLoadingStateRFP(true, "AI is generating questions...");
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
                let generatedQuestions = data.generatedText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');

                // Display generated questions
                questionsResultDiv.innerHTML = ''; // Clear previous results
                // Simple formatting: assuming questions are newline separated, or numbered by AI
                generatedQuestions.split('\n').forEach(q => {
                    if (q.trim()) {
                        const p = document.createElement('p');
                        p.textContent = q.trim();
                        questionsResultDiv.appendChild(p);
                    }
                });

                generatedQuestionsArea.style.display = 'block';
                questionStatusArea.innerHTML = `<p class="loading-text" style="color:green;">Questions generated successfully!</p>`;
                questionStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000); // Hide success message after 5 seconds

            } catch (error) {
                console.error("Error generating questions with AI:", error);
                questionStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error generating questions: ${error.message}</p>`;
                questionStatusArea.style.display = 'flex';
                hideLoadingStateRFP(5000);
            } finally {
                generateQuestionsButton.disabled = false; // Ensure button is re-enabled
            }
        });
    } else {
        console.error("RFP form (#rfp-details-form) not found.");
    }
});
