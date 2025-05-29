const RFP_PROMPT_MAIN_INSTRUCTION = "Please analyze the following Request for Proposal (RFP) text.\nProvide the following distinct sections in your response, each clearly delimited:"; //
const RFP_PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###"; //
const RFP_PROMPT_TEXT_SUFFIX = "\n\nRFP Text (including any addendums):\n---\n{RFP_TEXT_PLACEHOLDER}\n---"; //

const PROMPT_CONFIG = { //
    summary: { defaultText: "1. A concise summary of the RFP.", delimiterKey: "SUMMARY" }, //
    questions: { defaultText: "2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.", delimiterKey: "QUESTIONS" }, //
    deadlines: { defaultText: "3. Key Deadlines.", delimiterKey: "DEADLINES" }, //
    submissionFormat: { defaultText: "4. Submission Format (Mail, Email, Portal, site address, etc.).", delimiterKey: "SUBMISSION_FORMAT" }, //
    requirements: { defaultText: "5. A list of Requirements (e.g., mandatory, highly desirable).", delimiterKey: "REQUIREMENTS" }, //
    stakeholders: { defaultText: "6. Mentioned Stakeholders or Key Contacts.", delimiterKey: "STAKEHOLDERS" }, //
    risks: { defaultText: "7. Potential Risks or Red Flags identified in the RFP.", delimiterKey: "RISKS" }, //
    registration: { defaultText: "8. Registration requirements or details for bidders.", delimiterKey: "REGISTRATION" }, //
    licenses: { defaultText: "9. Required Licenses or Certifications for bidders.", delimiterKey: "LICENSES" }, //
    budget: { defaultText: "10. Any mentioned Budget constraints or financial information.", delimiterKey: "BUDGET" } //
};

const getPromptStorageKey = (sectionKeySuffix) => `rfpPrompt_${sectionKeySuffix}`; //


function getStoredSectionPrompt(sectionKeySuffix) { //
    return localStorage.getItem(getPromptStorageKey(sectionKeySuffix)) || PROMPT_CONFIG[sectionKeySuffix]?.defaultText; //
}

// Called from rfp-ui-interactions.js, expects DOM elements to be passed
function loadSelectedSectionPromptToTextarea(promptSectionSelector, rfpIndividualPromptTextarea) { //
    if (promptSectionSelector && rfpIndividualPromptTextarea) { //
        const selectedKeySuffix = promptSectionSelector.value; //
        if (selectedKeySuffix && PROMPT_CONFIG[selectedKeySuffix]) { //
             rfpIndividualPromptTextarea.value = getStoredSectionPrompt(selectedKeySuffix); //
        }
    }
}

// Called from rfp-ui-interactions.js, expects DOM elements to be passed
function saveCurrentSectionPrompt(promptSectionSelector, rfpIndividualPromptTextarea, promptSaveStatus) { //
    if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) { //
        const selectedKeySuffix = promptSectionSelector.value; //
        const userPrompt = rfpIndividualPromptTextarea.value.trim(); //

        if (userPrompt) { //
            localStorage.setItem(getPromptStorageKey(selectedKeySuffix), userPrompt); //
            promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">Prompt for this section saved!</p>'; //
        } else {
            promptSaveStatus.innerHTML = '<p class="loading-text" style="color:red;">Section prompt cannot be empty.</p>'; //
        }
        promptSaveStatus.style.display = 'flex'; //
        setTimeout(() => { //
            promptSaveStatus.style.display = 'none'; //
            promptSaveStatus.innerHTML = ''; //
        }, 3000);
    }
}

// Called from rfp-ui-interactions.js, expects DOM elements to be passed
function resetCurrentSectionPromptToDefault(promptSectionSelector, rfpIndividualPromptTextarea, promptSaveStatus) { //
    if (promptSectionSelector && rfpIndividualPromptTextarea && promptSaveStatus) { //
        const selectedKeySuffix = promptSectionSelector.value; //
        const selectedOptionText = promptSectionSelector.options[promptSectionSelector.selectedIndex].text; //
        if (confirm(`Are you sure you want to reset the prompt for "${selectedOptionText}" to its default?`)) { //
            localStorage.removeItem(getPromptStorageKey(selectedKeySuffix)); //
            loadSelectedSectionPromptToTextarea(promptSectionSelector, rfpIndividualPromptTextarea); //
            promptSaveStatus.innerHTML = `<p class="loading-text" style="color:green;">Prompt for "${selectedOptionText}" reset to default.</p>`; //
            promptSaveStatus.style.display = 'flex'; //
            setTimeout(() => { //
                promptSaveStatus.style.display = 'none'; //
                promptSaveStatus.innerHTML = ''; //
            }, 3000);
        }
    }
}

// Called from rfp-ui-interactions.js, expects DOM elements to be passed
function resetAllPromptsToDefault(promptSaveStatus, promptSectionSelector, rfpIndividualPromptTextarea) { //
    if (promptSaveStatus && promptSectionSelector) { //
        if (confirm("Are you sure you want to reset ALL section prompts to their defaults? This action cannot be undone.")) { //
            Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
                localStorage.removeItem(getPromptStorageKey(keySuffix)); //
            });
            // Pass rfpIndividualPromptTextarea if it's needed by loadSelectedSectionPromptToTextarea
            if (rfpIndividualPromptTextarea) {
                loadSelectedSectionPromptToTextarea(promptSectionSelector, rfpIndividualPromptTextarea); //
            } else {
                 // Fallback or error if rfpIndividualPromptTextarea is not available but needed
                console.warn("rfpIndividualPromptTextarea not provided to resetAllPromptsToDefault for UI update.");
            }
            promptSaveStatus.innerHTML = '<p class="loading-text" style="color:green;">All prompts have been reset to their defaults.</p>'; //
            promptSaveStatus.style.display = 'flex'; //
            setTimeout(() => { //
                promptSaveStatus.style.display = 'none'; //
                promptSaveStatus.innerHTML = ''; //
            }, 4000);
        }
    }
}

function constructFullRfpAnalysisPrompt(rfpText) { //
    let fullPrompt = RFP_PROMPT_MAIN_INSTRUCTION; //

    Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
        const sectionInstruction = getStoredSectionPrompt(keySuffix); //
        fullPrompt += `\n${sectionInstruction}`; //
    });
    
    fullPrompt += "\n\nUse the following format strictly for each section:"; //
    Object.keys(PROMPT_CONFIG).forEach(keySuffix => { //
        const delimiterKeyUpper = PROMPT_CONFIG[keySuffix]?.delimiterKey; //
        if(delimiterKeyUpper){ //
             const delimiter = RFP_PROMPT_SECTION_DELIMITER_FORMAT //
                .replace(/{SECTION_KEY_UPPER}/g, delimiterKeyUpper); //
             fullPrompt += delimiter; //
        }
    });

    fullPrompt += RFP_PROMPT_TEXT_SUFFIX.replace('{RFP_TEXT_PLACEHOLDER}', rfpText); //
    return fullPrompt; //
}


// --- Content Formatting with Prompt Display ---
function formatAndDisplayContentWithPrompt(parentElement, sectionKeySuffix, sectionPromptText, sectionContentText) { //
    if (!parentElement) { //
        console.warn("formatAndDisplayContentWithPrompt: parentElement is null for sectionKeySuffix:", sectionKeySuffix); //
        return; //
    }
    parentElement.innerHTML = ''; //

    if (sectionPromptText) { //
        const promptDisplayDiv = document.createElement('div'); //
        promptDisplayDiv.className = 'prompt-display-box'; //
        
        const promptLabel = document.createElement('strong'); //
        promptLabel.textContent = "Instruction Used: "; //
        promptDisplayDiv.appendChild(promptLabel); //

        const promptTextNode = document.createTextNode(sectionPromptText); //
        promptDisplayDiv.appendChild(promptTextNode); //
        
        const currentDefaultPrompt = PROMPT_CONFIG[sectionKeySuffix]?.defaultText; //
        if (currentDefaultPrompt && sectionPromptText === currentDefaultPrompt) { //
            const defaultIndicator = document.createElement('em'); //
            defaultIndicator.textContent = " (Default instruction)"; //
            defaultIndicator.style.fontSize = '0.9em'; //
            defaultIndicator.style.marginLeft = '5px'; //
            promptDisplayDiv.appendChild(defaultIndicator); //
        }
        parentElement.appendChild(promptDisplayDiv); //
    }

    const contentDiv = document.createElement('div'); //
    contentDiv.className = 'ai-generated-section-content'; //
    const lines = (sectionContentText || "N/A").split('\n'); //
    let currentList = null; //
    lines.forEach(line => { //
        const trimmedLine = line.trim(); //
        if (trimmedLine) { //
            let formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); //
            const isQuestionsList = sectionKeySuffix === 'questions'; //
            const listMatch = formattedLine.match(/^(\*|-|\d+\.)\s+/); //

            if (listMatch) { //
                if (!currentList) { //
                    currentList = isQuestionsList ? document.createElement('ol') : document.createElement('ul'); //
                    if (isQuestionsList) currentList.className = 'numbered-list'; //
                    contentDiv.appendChild(currentList); //
                }
                const listItem = document.createElement('li'); //
                listItem.innerHTML = formattedLine.substring(listMatch[0].length); //
                currentList.appendChild(listItem); //
            } else {
                currentList = null; //
                const p = document.createElement('p'); //
                p.innerHTML = formattedLine; //
                contentDiv.appendChild(p); //
            }
        } else {
            currentList = null; //
        }
    });
    parentElement.appendChild(contentDiv); //
}

window.PROMPT_CONFIG = PROMPT_CONFIG;
window.getPromptStorageKey = getPromptStorageKey;
window.getStoredSectionPrompt = getStoredSectionPrompt;
window.loadSelectedSectionPromptToTextarea = loadSelectedSectionPromptToTextarea;
window.saveCurrentSectionPrompt = saveCurrentSectionPrompt;
window.resetCurrentSectionPromptToDefault = resetCurrentSectionPromptToDefault;
window.resetAllPromptsToDefault = resetAllPromptsToDefault;
window.constructFullRfpAnalysisPrompt = constructFullRfpAnalysisPrompt;
window.formatAndDisplayContentWithPrompt = formatAndDisplayContentWithPrompt;
