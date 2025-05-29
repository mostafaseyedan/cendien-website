import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const newRfpModal = document.getElementById('new-rfp-modal');
    const openNewRfpModalButton = document.getElementById('open-new-rfp-modal-button');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalFormTitle = document.getElementById('modal-title');

    const rfpForm = document.getElementById('rfp-details-form');
    const rfpFileUpload = document.getElementById('rfpFileUpload');
    const rfpAddendumUpload = document.getElementById('rfpAddendumUpload');
    const generateAnalysisButton = document.getElementById('generate-analysis-button');
    const modalAnalysisStatusArea = document.getElementById('modal-analysis-status-area');
    const modalAnalysisResultsArea = document.getElementById('modal-analysis-results-area');

    const modalTabContentMap = {
        summary: document.getElementById('modal-summary-result-content'),
        questions: document.getElementById('modal-questions-result-content'),
        deadlines: document.getElementById('modal-deadlines-only-content'),
        submissionFormat: document.getElementById('modal-submission-format-content'),
        requirements: document.getElementById('modal-requirements-result-content'),
        stakeholders: document.getElementById('modal-stakeholders-result-content'),
        risks: document.getElementById('modal-risks-result-content'),
        registration: document.getElementById('modal-registration-result-content'),
        licenses: document.getElementById('modal-licenses-result-content'),
        budget: document.getElementById('modal-budget-result-content')
    };
    const modalDeadlinesTabContentDiv = document.getElementById('modal-deadlines-tab');

    const viewSavedRfpDetailsSection = document.getElementById('view-saved-rfp-details-section');
    const viewRfpMainTitleHeading = document.getElementById('view-rfp-main-title-heading');
    const closeViewRfpDetailsButton = document.getElementById('close-view-rfp-details-button');
    const viewRfpStatusArea = document.getElementById('view-rfp-status-area');
    const viewAnalysisResultsArea = document.getElementById('view-analysis-results-area');
    
    const viewTabContentMap = {
        summary: document.getElementById('view-summary-result-content'),
        questions: document.getElementById('view-questions-result-content'),
        deadlines: document.getElementById('view-deadlines-only-content'),
        submissionFormat: document.getElementById('view-submission-format-content'),
        requirements: document.getElementById('view-requirements-result-content'),
        stakeholders: document.getElementById('view-stakeholders-result-content'),
        risks: document.getElementById('view-risks-result-content'),
        registration: document.getElementById('view-registration-result-content'),
        licenses: document.getElementById('view-licenses-result-content'),
        budget: document.getElementById('view-budget-result-content')
    };
    const viewDeadlinesTabContentDiv = document.getElementById('view-deadlines-tab');

    const editRfpModal = document.getElementById('edit-rfp-modal');
    const editRfpModalCloseButton = document.getElementById('edit-rfp-modal-close-button');
    const editRfpModalTitle = document.getElementById('edit-rfp-modal-title');
    const editRfpForm = document.getElementById('edit-rfp-details-form');
    const editRfpId = document.getElementById('editRfpId');
    const editRfpTitleInput = document.getElementById('editRfpTitle');
    const editRfpFileNameInput = document.getElementById('editRfpFileName');
    const editRfpTypeSelect = document.getElementById('editRfpType');
    const editSubmittedBySelect = document.getElementById('editSubmittedBy');
    const editRfpStatusSelect = document.getElementById('editRfpStatus');
    const editRfpSummaryTextarea = document.getElementById('editRfpSummary');
    const editGeneratedQuestionsTextarea = document.getElementById('editGeneratedQuestions');
    const editRfpDeadlinesTextarea = document.getElementById('editRfpDeadlines');
    const editRfpSubmissionFormatTextarea = document.getElementById('editRfpSubmissionFormat');
    const editRfpKeyRequirementsTextarea = document.getElementById('editRfpKeyRequirements');
    const editRfpStakeholdersTextarea = document.getElementById('editRfpStakeholders');
    const editRfpRisksTextarea = document.getElementById('editRfpRisks');
    const editRfpRegistrationTextarea = document.getElementById('editRfpRegistration');
    const editRfpLicensesTextarea = document.getElementById('editRfpLicenses');
    const editRfpBudgetTextarea = document.getElementById('editRfpBudget');
    const saveEditedRfpButton = document.getElementById('save-edited-rfp-button');
    const cancelEditRfpButton = document.getElementById('cancel-edit-rfp-button');
    const editRfpStatusArea = document.getElementById('edit-rfp-status-area');

    const savedAnalysesListDiv = document.getElementById('saved-analyses-list');
    const noSavedAnalysesP = document.getElementById('no-saved-analyses');
    const rfpListTabsContainer = document.querySelector('.rfp-list-tabs');
    const rfpListStatusArea = document.getElementById('rfp-list-status-area');
    const yearSpanRFP = document.getElementById('current-year-rfp');

    const promptSettingsModal = document.getElementById('prompt-settings-modal');
    const openPromptSettingsButton = document.getElementById('open-prompt-settings-modal-button');
    const promptModalCloseButton = document.getElementById('prompt-modal-close-button');
    const promptSectionSelector = document.getElementById('promptSectionSelector');
    const rfpIndividualPromptTextarea = document.getElementById('rfpIndividualPromptTextarea');
    const saveCurrentPromptButton = document.getElementById('save-current-prompt-button');
    const resetCurrentPromptButton = document.getElementById('reset-current-prompt-button');
    const resetAllPromptsButton = document.getElementById('reset-all-prompts-button');
    const promptSaveStatus = document.getElementById('prompt-save-status');

    let allFetchedAnalyses = [];
    let currentSortKey = 'analysisDate';
    let currentSortOrder = 'desc';
    let currentStatusFilter = 'all_statuses'; 

    const RFP_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:";
    const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
    const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---";

    const PROMPT_CONFIG = {
        summary: { defaultText: "1. A concise summary of the RFP.", delimiterKey: "SUMMARY" },
        questions: { defaultText: "2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.", delimiterKey: "QUESTIONS" },
        deadlines: { defaultText: "3. Key Deadlines.", delimiterKey: "DEADLINES" },
        submissionFormat: { defaultText: "4. Submission Format (Mail, Email, Portal, site address, etc.).", delimiterKey: "SUBMISSION_FORMAT" },
        requirements: { defaultText: "5. A list of Requirements (e.g., mandatory, highly desirable).", delimiterKey: "REQUIREMENTS" },
        stakeholders: { defaultText: "6. Mentioned Stakeholders or Key Contacts.", delimiterKey: "STAKEHOLDERS" },
        risks: { defaultText: "7. Potential Risks or Red Flags identified in the RFP.", delimiterKey: "RISKS" },
        registration: { defaultText: "8. Registration requirements or details for bidders.", delimiterKey: "REGISTRATION" },
        licenses: { defaultText: "9. Required Licenses or Certifications for bidders.", delimiterKey: "LICENSES" },
        budget: { defaultText: "10. Any mentioned Budget constraints or financial information.", delimiterKey: "BUDGET" }
    };

    const getPromptStorageKey = (sectionKeySuffix) => `rfpPrompt_${sectionKeySuffix}`;

    if (yearSpanRFP && !yearSpanRFP.textContent) {
        yearSpanRFP.textContent = new Date().getFullYear();
    }

    function getStoredSectionPrompt(sectionKeySuffix) {
        return localStorage.getItem(getPromptStorageKey(sectionKeySuffix)) || PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
    }

    function loadSelectedSectionPromptToTextarea() {
        if (promptSectionSelector && rfpIndividualPromptTextarea) {
            const selectedKeySuffix = promptSectionSelector.value; 
            if (selectedKeySuffix && PROMPT_CONFIG[selectedKeySuffix]) {
                 rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix);
            }
        }
    }

    function saveCurrentSectionPrompt() {
        if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
            const selectedKeySuffix = promptSectionSelector.value;
            const userPrompt = rfpIndividualPromptTextarea.value.trim();
            if (userPrompt) {
                localStorage.setItem(getPromptStorageKey(selectedKeySuffix), userPrompt);
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">Prompt for this section saved!</p>';
            } else {
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:red;">Section prompt cannot be empty.</p>';
            }
            promptSaveStatus.style.display = 'flex';
            setTimeout(() => {
                promptSaveStatus.style.display = 'none';
                promptSaveStatus.innerHTML = '';
            }, 3000);
        }
    }

    function resetCurrentSectionPromptToDefault() {
        if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) {
            const selectedKeySuffix = promptSectionSelector.value;
            const selectedOptionText = promptSectionSelector.options[promptSectionSelector.selectedIndex].text;
            if (confirm(`Are you sure you want to reset the prompt for "${selectedOptionText}" to its default?`)) {
                localStorage.removeItem(getPromptStorageKey(selectedKeySuffix));
                loadSelectedSectionPromptToTextarea();
                promptSaveStatus.innerHTML = `<p class="loading-text" style="color:green;">Prompt for "${selectedOptionText}" reset to default.</p>`;
                promptSaveStatus.style.display = 'flex';
                setTimeout(() => {
                    promptSaveStatus.style.display = 'none';
                    promptSaveStatus.innerHTML = '';
                }, 3000);
            }
        }
    }

    function resetAllPromptsToDefault() {
        if (promptSaveStatus && promptSectionSelector) {
            if (confirm("Are you sure you want to reset ALL section prompts to their defaults? This action cannot be undone.")) {
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    localStorage.removeItem(getPromptStorageKey(keySuffix));
                });
                loadSelectedSectionPromptToTextarea(); 
                promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">All prompts have been reset to their defaults.</p>';
                promptSaveStatus.style.display = 'flex';
                setTimeout(() => {
                    promptSaveStatus.style.display = 'none';
                    promptSaveStatus.innerHTML = '';
                }, 4000);
            }
        }
    }

    function constructFullRfpAnalysisPrompt(rfpText) {
        let fullPrompt = RFP_PROMPT_MAIN_INSTRUCTION;
        Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
            const sectionInstruction = getStoredSectionPrompt(keySuffix);
            fullPrompt += `\n${sectionInstruction}`;
        });
        fullPrompt += "\n\nUse the following format strictly for each section:";
        Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
            const delimiterKeyUpper = PROMPT_CONFIG[keySuffix]?.delimiterKey;
            if (delimiterKeyUpper) {
                const delimiter = RFP_PROMPT_SECTION_DELIMITER_FORMAT.replace(/{SECTION_KEY_UPPER}/g, delimiterKeyUpper);
                fullPrompt += delimiter;
            }
        });
        fullPrompt += RFP_PROMPT_TEXT_SUFFIX.replace('{RFP_TEXT_PLACEHOLDER}', rfpText);
        return fullPrompt;
    }

    function openModal(modalElement) {
        if (modalElement) {
            [newRfpModal, editRfpModal, viewSavedRfpDetailsSection, promptSettingsModal].forEach(m => {
                if (m && m !== modalElement) {
                    m.style.display = 'none';
                    if (m.classList.contains('modal-active')) m.classList.remove('modal-active');
                }
            });
            modalElement.style.display = 'block';
            if (modalElement.id === 'view-saved-rfp-details-section') {
                modalElement.classList.add('modal-active');
            }
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'none';
            if (modalElement.id === 'view-saved-rfp-details-section') {
                modalElement.classList.remove('modal-active');
            }
            document.body.style.overflow = '';
        }
    }
    
    if (openNewRfpModalButton) {
        openNewRfpModalButton.addEventListener('click', () => {
            if (rfpForm) rfpForm.reset();
            if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
            if (modalAnalysisStatusArea) modalAnalysisStatusArea.style.display = 'none';
            clearModalAnalysisResultTabs();
            if (modalFormTitle) modalFormTitle.textContent = "Analyze New RFP";
            openModal(newRfpModal);
        });
    }
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', () => closeModal(newRfpModal));
    }
    if (newRfpModal) {
        newRfpModal.addEventListener('click', (event) => {
            if (event.target === newRfpModal) closeModal(newRfpModal);
        });
    }

    if (openPromptSettingsButton) {
        openPromptSettingsButton.addEventListener('click', () => {
            loadSelectedSectionPromptToTextarea();
            openModal(promptSettingsModal);
        });
    }
    if (promptModalCloseButton) {
        promptModalCloseButton.addEventListener('click', () => closeModal(promptSettingsModal));
    }
    if (promptSettingsModal) {
        promptSettingsModal.addEventListener('click', (event) => {
            if (event.target === promptSettingsModal) closeModal(promptSettingsModal);
        });
    }
    
    if (promptSectionSelector) {
        promptSectionSelector.addEventListener('change', loadSelectedSectionPromptToTextarea);
    }
    if (saveCurrentPromptButton) {
        saveCurrentPromptButton.addEventListener('click', saveCurrentSectionPrompt);
    }
    if (resetCurrentPromptButton) {
        resetCurrentPromptButton.addEventListener('click', resetCurrentSectionPromptToDefault);
    }
    if (resetAllPromptsButton) {
        resetAllPromptsButton.addEventListener('click', resetAllPromptsToDefault);
    }

    if (closeViewRfpDetailsButton) {
        closeViewRfpDetailsButton.addEventListener('click', () => closeModal(viewSavedRfpDetailsSection));
    }
    if (viewSavedRfpDetailsSection) {
        viewSavedRfpDetailsSection.addEventListener('click', (event) => {
            if (event.target === viewSavedRfpDetailsSection) closeModal(viewSavedRfpDetailsSection);
        });
    }

    if (editRfpModalCloseButton) {
        editRfpModalCloseButton.addEventListener('click', () => closeModal(editRfpModal));
    }
    if (cancelEditRfpButton) {
        cancelEditRfpButton.addEventListener('click', () => closeModal(editRfpModal));
    }
    if (editRfpModal) {
        editRfpModal.addEventListener('click', (event) => {
            if (event.target === editRfpModal) closeModal(editRfpModal);
        });
    }
    
    function clearTabContent(tabContentMap, isModalView) {
        Object.keys(tabContentMap).forEach(key => {
            const div = tabContentMap[key];
            if (div) div.innerHTML = '';
        });
        let deadlinesTabParent, deadlinesDivId, submissionDivId;
        if (isModalView && modalDeadlinesTabContentDiv) {
            deadlinesTabParent = modalDeadlinesTabContentDiv;
            deadlinesDivId = 'modal-deadlines-only-content';
            submissionDivId = 'modal-submission-format-content';
            deadlinesTabParent.innerHTML = `<h4>Deadlines:</h4><div id="${deadlinesDivId}"></div><h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionDivId}"></div>`;
            modalTabContentMap.deadlines = document.getElementById(deadlinesDivId);
            modalTabContentMap.submissionFormat = document.getElementById(submissionDivId);
        } else if (!isModalView && viewDeadlinesTabContentDiv) {
            const resultContainer = viewDeadlinesTabContentDiv.querySelector('#view-deadlines-result-content');
            deadlinesDivId = 'view-deadlines-only-content';
            submissionDivId = 'view-submission-format-content';
            if (resultContainer) {
                 resultContainer.innerHTML = `<h4>Deadlines:</h4><div id="${deadlinesDivId}"></div><h4 style="margin-top: 1rem;">Submission Format:</h4><div id="${submissionDivId}"></div>`;
                viewTabContentMap.deadlines = document.getElementById(deadlinesDivId);
                viewTabContentMap.submissionFormat = document.getElementById(submissionDivId);
            } else { 
                if(viewDeadlinesTabContentDiv) viewDeadlinesTabContentDiv.innerHTML = ''; 
            }
        }
    }
    function clearModalAnalysisResultTabs() { clearTabContent(modalTabContentMap, true); }
    function clearViewAnalysisResultTabs() { clearTabContent(viewTabContentMap, false); }

    function showLoadingMessage(areaElement, message = "Processing...", showSpinner = true) {
        if (!areaElement) return;
        areaElement.style.display = 'flex';
        areaElement.innerHTML = `${showSpinner ? '<div class="spinner"></div>' : ''}<p class="loading-text">${message}</p>`;
        if ((areaElement === modalAnalysisStatusArea && generateAnalysisButton) || (areaElement === editRfpStatusArea && saveEditedRfpButton)) {
            if(generateAnalysisButton && areaElement === modalAnalysisStatusArea && showSpinner) generateAnalysisButton.disabled = true;
            if(saveEditedRfpButton && areaElement === editRfpStatusArea && showSpinner) saveEditedRfpButton.disabled = true;
        }
    }
    function hideLoadingMessage(areaElement, delay = 0) {
        setTimeout(() => {
            if (areaElement && (areaElement.innerHTML.includes('loading-text') || areaElement.innerHTML.includes('spinner'))) {
                areaElement.style.display = 'none';
                areaElement.innerHTML = '';
            }
            if (generateAnalysisButton && areaElement === modalAnalysisStatusArea) generateAnalysisButton.disabled = false;
            if (saveEditedRfpButton && areaElement === editRfpStatusArea) saveEditedRfpButton.disabled = false;
        }, delay);
    }

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
                    reject(new Error(`Failed to extract text from PDF '${file.name}': ${err.message}`));
                }
            };
            reader.onerror = (err) => reject(new Error(`FileReader error for '${file.name}': ${err.message}`));
            reader.readAsArrayBuffer(file);
        });
    }

    function formatAndDisplayContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText) {
        if (!parentElement) {
            console.warn("formatAndDisplayContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix);
            return;
        }
        parentElement.innerHTML = '';

        if (sectionPromptText) {
            const promptDisplayDiv = document.createElement('div');
            promptDisplayDiv.className = 'prompt-display-box';
            const promptLabel = document.createElement('strong');
            promptLabel.textContent = "Prompt: ";
            promptDisplayDiv.appendChild(promptLabel);
            const promptTextNode = document.createTextNode(sectionPromptText);
            promptDisplayDiv.appendChild(promptTextNode);
            const currentDefaultPrompt = PROMPT_CONFIG[sectionKeySuffix]?.defaultText;
            if (currentDefaultPrompt && sectionPromptText === currentDefaultPrompt) {
                const defaultIndicator = document.createElement('em');
                defaultIndicator.textContent = " (This is the default default prompt)";
                defaultIndicator.style.fontSize = '0.9em';
                defaultIndicator.style.marginLeft = '5px';
                promptDisplayDiv.appendChild(defaultIndicator);
            }
            parentElement.appendChild(promptDisplayDiv);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-generated-section-content';
        const lines = (sectionContentText || "N/A").split('\n');
        let currentList = null;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                const isQuestionsList = sectionKeySuffix === 'questions';
                const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/);
                if (listMatch) {
                    if (!currentList) {
                        currentList = isQuestionsList ? document.createElement('ol') : document.createElement('ul');
                        if (isQuestionsList) currentList.className = 'numbered-list';
                        contentDiv.appendChild(currentList);
                    }
                    const listItem = document.createElement('li');
                    listItem.innerHTML = formattedLine.substring(listMatch[0].length);
                    currentList.appendChild(listItem);
                } else {
                    currentList = null;
                    const p = document.createElement('p');
                    p.innerHTML = formattedLine;
                    contentDiv.appendChild(p);
                }
            } else {
                currentList = null;
            }
        });
        parentElement.appendChild(contentDiv);
    }
async function updateRfpStatus(rfpId, newStatus) {
        const rfpToUpdate = allFetchedAnalyses.find(a => a.id === rfpId);
        const rfpTitleForMessage = rfpToUpdate ? (rfpToUpdate.rfpTitle || rfpToUpdate.rfpFileName || 'this RFP') : 'this RFP';
        showLoadingMessage(rfpListStatusArea, `Updating "${rfpTitleForMessage}" to ${newStatus}...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update status.');
            const result = await response.json(); // Get result to update status locally accurately
            const updatedAnalysis = allFetchedAnalyses.find(a => a.id === rfpId);
            if (updatedAnalysis) updatedAnalysis.status = result.newStatus || newStatus; // Use status from response if available
            renderAnalysesList();
            showLoadingMessage(rfpListStatusArea, `"${rfpTitleForMessage}" status updated to ${result.newStatus || newStatus}!`, false);
        } catch (error) { 
            showLoadingMessage(rfpListStatusArea, `Error updating status: ${error.message}`, false);
        } finally { 
            hideLoadingMessage(rfpListStatusArea, 3000); 
        }
    }

    async function deleteRfp(rfpId, rfpTitleForConfirm) {
        if (!window.confirm(`Are you sure you want to delete RFP: "${rfpTitleForConfirm}"? This action cannot be undone.`)) return;
        showLoadingMessage(rfpListStatusArea, `Deleting "${rfpTitleForConfirm}"...`);
        try {
            const response = await fetch(`/api/rfp-analysis/${rfpId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error || `Failed to delete ${rfpTitleForConfirm}.`);
            allFetchedAnalyses = allFetchedAnalyses.filter(a => a.id !== rfpId);
            renderAnalysesList();
            if (viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active') && 
                viewSavedRfpDetailsSection.dataset.currentViewingId === rfpId) {
                closeModal(viewSavedRfpDetailsSection);
            }
            showLoadingMessage(rfpListStatusArea, `"${rfpTitleForConfirm}" deleted successfully!`, false);
        } catch (error) { 
            showLoadingMessage(rfpListStatusArea, `Error deleting: ${error.message}`, false);
        } finally { 
            hideLoadingMessage(rfpListStatusArea, 3000); 
        }
    }

    async function openEditRfpModal(analysisFullDetails) {
        if (!editRfpModal || !editRfpForm) return;
        let analysis = analysisFullDetails;
        if (!analysis.rfpSummary && !analysis.generatedQuestions && !analysis.rfpDeadlines) { // Check more fields
            showLoadingMessage(editRfpStatusArea, 'Loading full RFP details...');
            try {
                const response = await fetch(`/api/rfp-analysis/${analysisFullDetails.id}`);
                if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch full RFP details.');
                analysis = await response.json();
            } catch (error) {
                console.error("Error fetching full RFP details:", error);
                showLoadingMessage(editRfpStatusArea, `Error: ${error.message}`, false);
                hideLoadingMessage(editRfpStatusArea, 3000);
                return;
            } finally {
                 if (editRfpStatusArea.innerHTML.includes('Loading full RFP details...')) {
                    hideLoadingMessage(editRfpStatusArea);
                }
            }
        }

        if (editRfpId) editRfpId.value = analysis.id;
        if (editRfpTitleInput) editRfpTitleInput.value = analysis.rfpTitle || '';
        if (editRfpFileNameInput) editRfpFileNameInput.value = analysis.rfpFileName || 'N/A';
        if (editRfpTypeSelect) editRfpTypeSelect.value = analysis.rfpType || 'Other';
        if (editSubmittedBySelect) editSubmittedBySelect.value = analysis.submittedBy || 'Other';
        if (editRfpStatusSelect) editRfpStatusSelect.value = analysis.status || 'analyzed';
        if (editRfpSummaryTextarea) editRfpSummaryTextarea.value = analysis.rfpSummary || '';
        if (editGeneratedQuestionsTextarea) editGeneratedQuestionsTextarea.value = analysis.generatedQuestions || '';
        if (editRfpDeadlinesTextarea) editRfpDeadlinesTextarea.value = analysis.rfpDeadlines || '';
        if (editRfpSubmissionFormatTextarea) editRfpSubmissionFormatTextarea.value = analysis.rfpSubmissionFormat || '';
        if (editRfpKeyRequirementsTextarea) editRfpKeyRequirementsTextarea.value = analysis.rfpKeyRequirements || '';
        if (editRfpStakeholdersTextarea) editRfpStakeholdersTextarea.value = analysis.rfpStakeholders || '';
        if (editRfpRisksTextarea) editRfpRisksTextarea.value = analysis.rfpRisks || '';
        if (editRfpRegistrationTextarea) editRfpRegistrationTextarea.value = analysis.rfpRegistration || '';
        if (editRfpLicensesTextarea) editRfpLicensesTextarea.value = analysis.rfpLicenses || '';
        if (editRfpBudgetTextarea) editRfpBudgetTextarea.value = analysis.rfpBudget || '';
        if (editRfpModalTitle) editRfpModalTitle.textContent = `Edit RFP: ${analysis.rfpTitle || analysis.rfpFileName}`;
        
        openModal(editRfpModal);
    }
    
    if (editRfpForm) {
        editRfpForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!saveEditedRfpButton) return;
            const rfpIdToUpdate = editRfpId.value;
            if (!rfpIdToUpdate) {
                showLoadingMessage(editRfpStatusArea, 'Error: RFP ID is missing.', false);
                hideLoadingMessage(editRfpStatusArea, 3000); return;
            }
            const updatedData = {
                rfpTitle: editRfpTitleInput.value.trim(),
                rfpType: editRfpTypeSelect.value,
                submittedBy: editSubmittedBySelect.value,
                status: editRfpStatusSelect.value,
                rfpSummary: editRfpSummaryTextarea.value.trim(),
                generatedQuestions: editGeneratedQuestionsTextarea.value.trim(),
                rfpDeadlines: editRfpDeadlinesTextarea.value.trim(),
                rfpSubmissionFormat: editRfpSubmissionFormatTextarea.value.trim(),
                rfpKeyRequirements: editRfpKeyRequirementsTextarea.value.trim(),
                rfpStakeholders: editRfpStakeholdersTextarea.value.trim(),
                rfpRisks: editRfpRisksTextarea.value.trim(),
                rfpRegistration: editRfpRegistrationTextarea.value.trim(),
                rfpLicenses: editRfpLicensesTextarea.value.trim(),
                rfpBudget: editRfpBudgetTextarea.value.trim()
            };
            showLoadingMessage(editRfpStatusArea, 'Saving changes...');
            try {
                const response = await fetch(`/api/rfp-analysis/${rfpIdToUpdate}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ error: 'Failed to save changes. Server error.' }));
                    throw new Error(errorResult.error || `HTTP error! Status: ${response.status}`);
                }
                const result = await response.json();
                showLoadingMessage(editRfpStatusArea, result.message || 'Changes saved successfully!', false);
                await loadSavedAnalysesInitial();
                setTimeout(() => closeModal(editRfpModal), 2000);
            } catch (error) {
                console.error('Error saving RFP details:', error);
                showLoadingMessage(editRfpStatusArea, `Error: ${error.message}`, false);
                hideLoadingMessage(editRfpStatusArea, 5000);
            }
        });
    }

    function renderAnalysesList() {
        if (!savedAnalysesListDiv || !noSavedAnalysesP) return;
        savedAnalysesListDiv.innerHTML = '';
        let filteredAnalyses = [...allFetchedAnalyses];

        if (currentStatusFilter === 'active' || currentStatusFilter === 'not_pursuing' || currentStatusFilter === 'archived') {
            filteredAnalyses = filteredAnalyses.filter(a => a.status === currentStatusFilter);
        } else if (currentStatusFilter === 'all_statuses') {
        }

        filteredAnalyses.sort((a, b) => {
            let valA = a[currentSortKey];
            let valB = b[currentSortKey];
            if (currentSortKey === 'analysisDate') {
                valA = a.analysisDate && a.analysisDate._seconds ? Number(a.analysisDate._seconds) : 0;
                valB = b.analysisDate && b.analysisDate._seconds ? Number(b.analysisDate._seconds) : 0;
            } else {
                valA = (typeof valA === 'string' ? valA.toLowerCase() : (valA || '')).toString();
                valB = (typeof valB === 'string' ? valB.toLowerCase() : (valB || '')).toString();
            }
            if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        if (filteredAnalyses.length === 0) {
            noSavedAnalysesP.style.display = 'block';
            if (currentStatusFilter === 'all_statuses') {
                noSavedAnalysesP.textContent = `No analyses found.`;
            } else {
                noSavedAnalysesP.textContent = `No analyses found for "${currentStatusFilter}" category.`;
            }
        } else {
            noSavedAnalysesP.style.display = 'none';
            filteredAnalyses.forEach(analysis => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'analyzed-rfp-item';
                const displayTitle = analysis.rfpTitle || analysis.rfpFileName || 'N/A';
                let formattedDateTime = 'N/A';
                if (analysis.analysisDate && typeof analysis.analysisDate._seconds === 'number') {
                    const date = new Date(analysis.analysisDate._seconds * 1000);
                    if (!isNaN(date.valueOf())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}`;
                    }
                }
                const statusDotClass = analysis.status === 'active' ? 'green' :
                                   analysis.status === 'not_pursuing' ? 'red' :
                                   analysis.status === 'archived' ? 'grey' :
                                   'orange';
                itemDiv.innerHTML = `
                    <span class="rfp-col-title" title="${displayTitle}">${displayTitle}</span>
                    <span class="rfp-col-type">${analysis.rfpType || 'N/A'}</span>
                    <span class="rfp-col-owner">${analysis.submittedBy || 'N/A'}</span>
                    <span class="rfp-col-date">${formattedDateTime}</span>
                    <span class="rfp-col-status"><span class="rfp-status-dot ${statusDotClass}" title="${analysis.status || 'analyzed'}"></span></span>
                    <span class="rfp-col-actions"></span>`;
                const actionsSpan = itemDiv.querySelector('.rfp-col-actions');
                const viewLink = document.createElement('a');
                viewLink.href = '#';
                viewLink.className = 'rfp-view-details action-icon';
                viewLink.dataset.id = analysis.id;
                viewLink.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i>';
                viewLink.title = "View Analysis Details";
                viewLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const analysisId = e.currentTarget.dataset.id;
                    const rfpItemDiv = e.currentTarget.closest('.analyzed-rfp-item');
                    const titleElement = rfpItemDiv ? rfpItemDiv.querySelector('.rfp-col-title') : null;
                    const loadingMessageTitle = titleElement ? titleElement.textContent : 'Selected RFP';
                    openModal(viewSavedRfpDetailsSection);
                    if (viewSavedRfpDetailsSection) viewSavedRfpDetailsSection.dataset.currentViewingId = analysisId;
                    if (viewRfpMainTitleHeading) viewRfpMainTitleHeading.textContent = `Details for: ${loadingMessageTitle}`;
                    showLoadingMessage(viewRfpStatusArea, `Loading analysis for ${loadingMessageTitle}...`);
                    if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'none';
                    clearViewAnalysisResultTabs();
                    let loadErrorOccurred = false;
                    try {
                        const detailResponse = await fetch(`/api/rfp-analysis/${analysisId}`);
                        if (!detailResponse.ok) throw new Error((await detailResponse.json()).error || 'Failed to fetch details.');
                        const detailedAnalysis = await detailResponse.json();
                        const savedPrompts = detailedAnalysis.analysisPrompts || {};
                        Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                            const contentDiv = viewTabContentMap[keySuffix];
                            const sectionDataField = keySuffix === 'questions' ? 'generatedQuestions' :
                                                    keySuffix === 'summary' ? 'rfpSummary' :
                                                    `rfp${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1)}`;
                            const sectionContent = detailedAnalysis[sectionDataField] || "N/A";
                            const promptText = savedPrompts[keySuffix] || PROMPT_CONFIG[keySuffix]?.defaultText;
                            if (contentDiv) {
                                formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent);
                            }
                        });
                        if (viewAnalysisResultsArea) viewAnalysisResultsArea.style.display = 'block';
                        const firstViewTabLink = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link');
                        if (firstViewTabLink) {
                            document.querySelectorAll('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                            firstViewTabLink.classList.add('active');
                            const tabNameToOpen = firstViewTabLink.getAttribute('onclick').match(/'([^']*)'/)[1];
                            if (window.openViewTab) window.openViewTab(null, tabNameToOpen);
                        }
                        const titleForStatus = detailedAnalysis.rfpTitle || detailedAnalysis.rfpFileName || 'N/A';
                        showLoadingMessage(viewRfpStatusArea, `Displaying: ${titleForStatus}`, false);
                    } catch (loadError) {
                         loadErrorOccurred = true;
                         showLoadingMessage(viewRfpStatusArea, `Error: ${loadError.message}`, false);
                    } finally {
                        setTimeout(() => hideLoadingMessage(viewRfpStatusArea), loadErrorOccurred ? 5000 : 2000);
                    }
                });
                actionsSpan.appendChild(viewLink);

                const dropdownContainer = document.createElement('div');
                dropdownContainer.className = 'actions-dropdown-container';
                const dropdownTrigger = document.createElement('button');
                dropdownTrigger.className = 'actions-dropdown-trigger action-icon';
                dropdownTrigger.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
                dropdownTrigger.title = "More actions";
                const dropdownMenu = document.createElement('div');
                dropdownMenu.className = 'actions-dropdown-menu';
                dropdownTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
                        if (menu !== dropdownMenu) menu.style.display = 'none';
                    });
                    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
                });
                function addDropdownItem(iconClass, text, clickHandler) {
                    const item = document.createElement('button');
                    item.className = 'dropdown-item';
                    item.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        clickHandler();
                        dropdownMenu.style.display = 'none';
                    });
                    dropdownMenu.appendChild(item);
                }
                addDropdownItem('fa-edit', 'Edit Details', () => openEditRfpModal(analysis));
                dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                if (analysis.status === 'analyzed') {
                    addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                    addDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                    addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                } else if (analysis.status === 'active') {
                    addDropdownItem('fa-times-circle', 'Move to Not Pursuing', () => updateRfpStatus(analysis.id, 'not_pursuing'));
                    addDropdownItem('fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                    addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                } else if (analysis.status === 'not_pursuing') {
                    addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                    addDropdownItem('fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                    addDropdownItem('fa-archive', 'Archive', () => updateRfpStatus(analysis.id, 'archived'));
                } else if (analysis.status === 'archived') {
                    addDropdownItem('fa-box-open', 'Unarchive (to Analyzed)', () => updateRfpStatus(analysis.id, 'analyzed'));
                    addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                } else {
                    addDropdownItem('fa-check-circle', 'Move to Active', () => updateRfpStatus(analysis.id, 'active'));
                    addDropdownItem('fa-inbox', 'Move to Analyzed', () => updateRfpStatus(analysis.id, 'analyzed'));
                }
                dropdownMenu.appendChild(document.createElement('div')).className = 'dropdown-divider';
                addDropdownItem('fa-trash-alt', 'Delete RFP', () => deleteRfp(analysis.id, displayTitle));
                dropdownContainer.appendChild(dropdownTrigger);
                dropdownContainer.appendChild(dropdownMenu);
                actionsSpan.appendChild(dropdownContainer);
                savedAnalysesListDiv.appendChild(itemDiv);
            });
        }
    }

    if (rfpListTabsContainer) {
        rfpListTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rfp-list-tab-button')) {
                rfpListTabsContainer.querySelectorAll('.rfp-list-tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentStatusFilter = e.target.dataset.statusFilter;
                renderAnalysesList();
            }
        });
    }
    document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            if (currentSortKey === sortKey) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortOrder = 'asc';
            }
            document.querySelectorAll('#saved-analyses-header .sortable-header').forEach(h => {
                let text = h.textContent.replace(/ [⇅↑↓]$/, '');
                if (h.dataset.sortKey === currentSortKey) {
                    text += currentSortOrder === 'asc' ? ' ↑' : ' ↓';
                } else {
                    text += ' ⇅';
                }
                h.textContent = text;
            });
            renderAnalysesList();
        });
    });

    if (rfpForm) {
        rfpForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const rfpTitleValue = document.getElementById('rfpTitle').value.trim();
            const rfpTypeValue = document.getElementById('rfpType').value;
            const submittedByValue = document.getElementById('submittedBy').value;
            const mainRfpFile = rfpFileUpload.files[0];
            const addendumFiles = rfpAddendumUpload.files;
            showLoadingMessage(modalAnalysisStatusArea, "Starting analysis...");
            if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'none';
            if (!mainRfpFile) {
                showLoadingMessage(modalAnalysisStatusArea, "Please upload the main RFP document.", false);
                hideLoadingMessage(modalAnalysisStatusArea, 3000); return;
            }
            const rfpFileNameValue = mainRfpFile.name;
            if (mainRfpFile.type !== "application/pdf") {
                showLoadingMessage(modalAnalysisStatusArea, "Invalid main RFP file type. Please upload a PDF.", false);
                hideLoadingMessage(modalAnalysisStatusArea, 3000); return;
            }
            let combinedRfpText = "";
            let filesToProcess = [mainRfpFile];
            for (let i = 0; i < addendumFiles.length; i++) {
                if (addendumFiles[i].type === "application/pdf") {
                    filesToProcess.push(addendumFiles[i]);
                } else {
                    console.warn(`Skipping non-PDF addendum: '${addendumFiles[i].name}'.`);
                }
            }
            try {
                for (let i = 0; i < filesToProcess.length; i++) {
                    const file = filesToProcess[i];
                    showLoadingMessage(modalAnalysisStatusArea, `Extracting text from ${file.name} (${i + 1}/${filesToProcess.length})...`);
                    const text = await extractTextFromPdf(file);
                    combinedRfpText += text + "\n\n";
                    if (!text || text.trim().length < 10) {
                        console.warn(`Minimal text extracted from ${file.name}.`);
                    }
                }
                if (combinedRfpText.trim().length < 50) {
                    throw new Error("Insufficient total text extracted from PDF(s) for analysis.");
                }
            } catch (error) {
                showLoadingMessage(modalAnalysisStatusArea, `PDF Error: ${error.message}`, false);
                hideLoadingMessage(modalAnalysisStatusArea, 5000); return;
            }
            const aiPrompt = constructFullRfpAnalysisPrompt(combinedRfpText);
            console.log("Constructed AI Prompt for Submission:\n", aiPrompt);
            const currentAnalysisPrompts = {};
            Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                currentAnalysisPrompts[keySuffix] = getStoredSectionPrompt(keySuffix);
            });
            let parsedAISections = {};
            try {
                showLoadingMessage(modalAnalysisStatusArea, "AI is analyzing and generating content...");
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt })
                });
                if (!response.ok) throw new Error((await response.json()).error || 'AI API error.');
                const data = await response.json();
                let rawAiOutput = data.generatedText.replace(/^```[a-z]*\s*/im, '').replace(/\s*```$/m, '');
                console.log("Raw AI Output from Gemini (New RFP):\n", rawAiOutput);
                const parseSection = (output, delimiterKey) => {
                    const regex = new RegExp(`###${delimiterKey}_START###([\\s\\S]*?)###${delimiterKey}_END###`);
                    const match = output.match(regex);
                    return match && match[1] ? match[1].trim() : `${delimiterKey.replace(/_/g, ' ')} not found in AI response.`;
                };
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    parsedAISections[keySuffix] = parseSection(rawAiOutput, PROMPT_CONFIG[keySuffix].delimiterKey);
                });
                clearModalAnalysisResultTabs();
                Object.keys(PROMPT_CONFIG).forEach(keySuffix => {
                    const contentDiv = modalTabContentMap[keySuffix];
                    const promptText = currentAnalysisPrompts[keySuffix];
                    const sectionContent = parsedAISections[keySuffix];
                    if (contentDiv) {
                         formatAndDisplayContentWithPrompt(contentDiv, keySuffix, promptText, sectionContent);
                    } else {
                        console.warn(`Modal Tab Content Div not found for key: ${keySuffix}`);
                    }
                });
                if (modalAnalysisResultsArea) modalAnalysisResultsArea.style.display = 'block';
                const activeModalResultTab = document.querySelector('#new-rfp-modal .tabs-container .tab-link');
                if (activeModalResultTab) {
                    document.querySelectorAll('#new-rfp-modal .tabs-container .tab-link').forEach(tl => tl.classList.remove('active'));
                    activeModalResultTab.classList.add('active');
                    const tabNameToOpen = activeModalResultTab.getAttribute('onclick').match(/'([^']*)'/)[1];
                    if (window.openModalTab) window.openModalTab(null, tabNameToOpen);
                }
                showLoadingMessage(modalAnalysisStatusArea, "RFP analysis complete! Saving results...", false);
                try {
                    const savePayload = {
                        rfpTitle: rfpTitleValue || "", rfpType: rfpTypeValue, submittedBy: submittedByValue,
                        rfpFileName: rfpFileNameValue,
                        rfpSummary: parsedAISections.summary,
                        generatedQuestions: parsedAISections.questions,
                        rfpDeadlines: parsedAISections.deadlines,
                        rfpSubmissionFormat: parsedAISections.submissionFormat,
                        rfpKeyRequirements: parsedAISections.requirements,
                        rfpStakeholders: parsedAISections.stakeholders,
                        rfpRisks: parsedAISections.risks,
                        rfpRegistration: parsedAISections.registration,
                        rfpLicenses: parsedAISections.licenses,
                        rfpBudget: parsedAISections.budget,
                        status: 'analyzed',
                        analysisPrompts: currentAnalysisPrompts
                    };
                    const saveResponse = await fetch('/api/rfp-analysis', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savePayload)
                    });
                    if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save analysis.');
                    showLoadingMessage(modalAnalysisStatusArea, "Analysis complete and results saved!", false);
                    await loadSavedAnalysesInitial();
                } catch (saveError) {
                    showLoadingMessage(modalAnalysisStatusArea, `Analysis complete, but failed to save: ${saveError.message}`, false);
                }
            } catch (error) {
                showLoadingMessage(modalAnalysisStatusArea, `Processing Error: ${error.message}`, false);
            } finally {
                hideLoadingMessage(modalAnalysisStatusArea, 7000);
                if (generateAnalysisButton) generateAnalysisButton.disabled = false;
            }
        });
    }

    async function loadSavedAnalysesInitial() {
        showLoadingMessage(rfpListStatusArea, "Loading saved analyses...", true);
        try {
            const response = await fetch('/api/rfp-analyses');
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch analyses.');
            allFetchedAnalyses = await response.json();
            renderAnalysesList();
        } catch (error) {
            if(savedAnalysesListDiv) savedAnalysesListDiv.innerHTML = `<p class="loading-text" style="color:red; text-align:center;">Failed to load: ${error.message}</p>`;
            if(noSavedAnalysesP) noSavedAnalysesP.style.display = 'block';
            if(noSavedAnalysesP) noSavedAnalysesP.textContent = `Failed to load analyses.`;
        } finally {
            hideLoadingMessage(rfpListStatusArea);
        }
    }
    
    const firstActiveViewTab = document.querySelector('#view-saved-rfp-details-section.modal-active .tabs-container .tab-link');
    if (firstActiveViewTab && viewSavedRfpDetailsSection && viewSavedRfpDetailsSection.classList.contains('modal-active')) {
        const tabNameToOpen = firstActiveViewTab.getAttribute('onclick').match(/'([^']*)'/)[1];
        const tabElement = document.getElementById(tabNameToOpen);
        if (window.openViewTab && tabElement && tabElement.style.display !== 'block') {
            window.openViewTab(null, tabNameToOpen);
        }
    }

    loadSavedAnalysesInitial();
    if (promptSectionSelector) {
        loadSelectedSectionPromptToTextarea();
    }

    document.addEventListener('click', (e) => {
        const openDropdowns = document.querySelectorAll('.actions-dropdown-menu');
        let clickedInsideADropdownOrTrigger = false;
        const triggerElement = e.target.closest('.actions-dropdown-trigger');

        openDropdowns.forEach(menu => {
            if (menu.contains(e.target) || (triggerElement && menu.previousElementSibling === triggerElement) ) {
                clickedInsideADropdownOrTrigger = true;
            }
        });
        if (!clickedInsideADropdownOrTrigger) {
            openDropdowns.forEach(menu => menu.style.display = 'none');
        }
    });
});
