document.addEventListener('DOMContentLoaded', () => {
    // Elements for section/service selection on homepage
    const sectionSelector = document.getElementById('section-selector');
    const aiContentParent = document.getElementById('ai-generated-content');
    const contentTitleElement = document.getElementById('content-title');
    
    const yearSpan = document.getElementById('current-year'); 
    const heroLocationCityElement = document.getElementById('hero-location-city');

    // Elements for AI Module Suggester on homepage
    const needsForm = document.getElementById('needs-form');
    const businessNeedsTextarea = document.getElementById('business-needs');
    const suggestModulesButton = document.getElementById('suggest-modules-button');
    const suggestedModulesArea = document.getElementById('suggested-modules-area');
    const modulesResultDiv = document.getElementById('modules-result');
    const charCountFeedback = document.getElementById('char-count-feedback');
    const minChars = 50;

    const initialAiContentHtml = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Please select an option from the drop-down menu to view details.</p>
        </div>`;
    const loadingAiContentHtml = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading details from our AI assistant...</p>
        </div>`;

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    async function updateUserLocationInHero() {
        if (!heroLocationCityElement) return; 
        const defaultCity = "Dallas"; 

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
                
                try {
                    const response = await fetch(nominatimUrl, {
                        headers: { 'User-Agent': 'CendienWebsite/1.5 (your-contact-email@example.com)' } // ** CUSTOMIZE User-Agent **
                    });
                    if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
                    const data = await response.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet;
                    heroLocationCityElement.textContent = city || defaultCity;
                } catch (error) {
                    console.error("Error fetching location:", error);
                    heroLocationCityElement.textContent = defaultCity;
                }
            }, (error) => {
                console.warn(`Geolocation error: ${error.message}`);
                heroLocationCityElement.textContent = defaultCity;
            }, { timeout: 7000 });
        } else {
            console.warn("Geolocation is not supported.");
            heroLocationCityElement.textContent = defaultCity;
        }
    }

    const cendienCompanyInfo = `Cendien is a premier technology consulting and staffing firm, specializing in providing senior-level consultants for ERP and HIT systems. Based in the Dallas area, we focus on understanding client objectives to deliver projects successfully, on time, and within budget. Our reputation is built on the quality of our consultants and our commitment to exceeding client expectations in today's fast-paced, results-driven culture.`;
    const managedServicesOverview = `Cendien offers comprehensive Managed IT Services designed to ensure your IT infrastructure is reliable, secure, and optimized for performance. We provide proactive monitoring, helpdesk support, cybersecurity solutions, cloud management, and strategic IT planning, allowing Dallas-area businesses to focus on their core objectives while we handle their IT.`;


    async function fetchAiContent(prompt, targetElement, titleElement, titleText) {
        if (!targetElement) { 
            console.error('Target element for AI content not found.');
            return;
        }
        if (titleElement && titleText) { 
            titleElement.textContent = titleText;
        }
        targetElement.innerHTML = loadingAiContentHtml; 

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' }));
                throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            let rawText = data.generatedText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
            const formattedText = rawText.split('\n').map(p => p.trim()).filter(p => p).map(p => `<p>${p}</p>`).join('');
            targetElement.innerHTML = formattedText || '<p>No specific details available at the moment.</p>';
        } catch (error) {
            console.error('Error fetching AI content:', error);
            targetElement.innerHTML = `<p class="loading-text" style="color:red;">Error loading content. Details: ${error.message}</p>`;
        }
    }

    function loadContentForSection(sectionValue) {
        let prompt = '';
        let title = 'Service Details'; 
        const detectedCity = heroLocationCityElement ? heroLocationCityElement.textContent : "the Dallas";

        // This check is important for when the disabled option is selected
        if (!sectionValue || sectionValue === "") { 
            if(contentTitleElement) contentTitleElement.textContent = 'Welcome to Cendien';
            if(aiContentParent) aiContentParent.innerHTML = initialAiContentHtml;
            return;
        }

        const createTechPrompt = (techName, serviceType = "Consulting", specificBaseInfo = cendienCompanyInfo) => {
            title = `${techName} ${serviceType}`;
            return `Based on Cendien's general expertise: "${specificBaseInfo}", generate 2 concise and impactful paragraphs detailing Cendien's specialized ${techName} ${serviceType} services. Highlight how Cendien leverages senior-level consultants to help businesses (especially in and around ${detectedCity} area) implement, optimize, and support their ${techName} systems effectively. Focus on typical client benefits like improved efficiency, problem resolution, and project success. Keep the tone professional and persuasive. Do not include markdown.`;
        };
        
        const createStaffingPrompt = () => {
            title = `IT Staffing Services in ${detectedCity}`;
            return `Based on Cendien's general expertise: "${cendienCompanyInfo}", generate 2 concise and impactful paragraphs detailing Cendien's IT Staffing Services (Contract, Contract-to-Hire, Permanent Placement). Highlight how Cendien helps ${detectedCity}-area businesses augment their teams with specialized, senior-level IT professionals for both short-term projects and long-term roles. Emphasize speed, quality of talent, and understanding client needs. Do not include markdown.`;
        };

        switch (sectionValue) {
            case 'home_overview': 
                title = 'Welcome to Cendien - Your Partner in IT Excellence';
                prompt = `Provide two concise and impactful introductory paragraphs about Cendien, based on: "${cendienCompanyInfo}". Focus on our commitment to providing expert IT consulting, Managed IT services, and staffing, particularly for businesses in the ${detectedCity} area. Emphasize our role as a trusted technology partner. Do not include markdown.`;
                break;
            case 'infor_consulting': prompt = createTechPrompt("Infor"); break;
            case 'lawson_consulting': prompt = createTechPrompt("Lawson"); break;
            case 'oracle_consulting': prompt = createTechPrompt("Oracle E-Business Suite / Oracle Cloud ERP"); break;
            case 'peoplesoft_consulting': prompt = createTechPrompt("PeopleSoft"); break;
            case 'sap_consulting': prompt = createTechPrompt("SAP"); break;
            // Note: The dropdown in HTML no longer has hyperion, cerner, epic, etc. these cases can be removed or kept for future use if you add them back.
            // For now, they won't be triggered by the current HTML dropdown.
            case 'managed_it_services':
                title = `Managed IT Services for ${detectedCity} Businesses`;
                prompt = `Based on this overview: "${managedServicesOverview}", generate 2 concise and impactful paragraphs about Cendien's Managed IT Services tailored for businesses in the ${detectedCity} area. Elaborate on the benefits like proactive support, cost savings, enhanced security, and business continuity. Keep a professional and reassuring tone. Do not include markdown.`;
                break;
            case 'it_staffing':
                prompt = createStaffingPrompt();
                break;
            case 'about_us':
                title = `About Cendien - Your ${detectedCity} Technology Partner`;
                prompt = `Using the following as a base: "${cendienCompanyInfo}", write 2 concise and impactful paragraphs for an "About Us" section. Highlight Cendien's mission, values (e.g., client success, quality, partnership), our ${detectedCity} area presence, and our commitment to being a trusted technology partner for businesses. Do not include markdown.`;
                break;
            // 'resume_generator_page' is handled by direct navigation, no case needed here
            default:
                // This handles the disabled "** SELECT OPTION **" if it somehow gets passed, or unknown values
                if(contentTitleElement) contentTitleElement.textContent = 'Welcome to Cendien';
                if(aiContentParent) aiContentParent.innerHTML = initialAiContentHtml;
                console.warn('Unhandled section value:', sectionValue);
                return; 
        }
        if (aiContentParent && contentTitleElement) {
             fetchAiContent(prompt, aiContentParent, contentTitleElement, title);
        } else {
            console.error("Missing elements for dropdown content display on homepage.");
        }
    }

    function updateCharCountAndButton() {
        if (!businessNeedsTextarea || !suggestModulesButton || !charCountFeedback) return;
        const currentLength = businessNeedsTextarea.value.length;
        const remaining = minChars - currentLength;
        if (currentLength < minChars) {
            charCountFeedback.textContent = `${remaining} more characters needed.`;
            charCountFeedback.style.color = '#c00';
            suggestModulesButton.disabled = true;
        } else {
            charCountFeedback.textContent = `Minimum ${minChars} characters met.`;
            charCountFeedback.style.color = '#555'; 
            suggestModulesButton.disabled = false;
        }
    }

    if (document.body.contains(businessNeedsTextarea)) { 
        updateCharCountAndButton();
        businessNeedsTextarea.addEventListener('input', updateCharCountAndButton);
    }

    if (document.body.contains(needsForm)) { 
        needsForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            if (!businessNeedsTextarea || businessNeedsTextarea.value.length < minChars || !suggestModulesButton || suggestModulesButton.disabled) {
                 alert(`Please provide at least ${minChars} characters describing your needs.`);
                return;
            }

            const userNeeds = businessNeedsTextarea.value.trim();
            suggestedModulesArea.style.display = 'block';
            modulesResultDiv.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p class="loading-text">Analyzing your needs and finding solutions...</p>
                </div>`;
            suggestModulesButton.disabled = true;

            const detectedCity = heroLocationCityElement ? heroLocationCityElement.textContent : 'Dallas';
            const promptForAI = `
A potential client in the ${detectedCity} area describes their IT challenges and operational goals as:
"${userNeeds}"

Based on these needs, provide a very concise suggestion (strictly under 200 characters, aiming for one or two short, impactful sentences) for relevant Managed IT services, specific ERP modules, or a type of IT solution/subscription that Cendien might offer.
Examples of desired output format:
- "For your described needs, Cendien's 'Proactive Managed IT Support' package with enhanced cybersecurity would be a strong fit."
- "Consider our Infor CloudSuite Essentials for core accounting, combined with tailored IT support."
- "We recommend our 'SMB Growth IT Package' which includes cloud backup, network monitoring, and helpdesk services."
Focus on brevity, a direct recommendation, and a professional tone. Do not use markdown formatting or bullet points.
            `;

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptForAI }) 
                });
                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
                    throw new Error(errorResult.error || `API error! status: ${response.status}`);
                }
                const data = await response.json();
                let rawText = data.generatedText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
                const formattedText = `<p>${rawText.trim()}</p>`;
                modulesResultDiv.innerHTML = formattedText || "<p>No specific suggestion available at this time.</p>";

            } catch (error) {
                console.error('Error fetching AI solution suggestions:', error);
                modulesResultDiv.innerHTML = `<p class="loading-text" style="color:red;">Sorry, an error occurred. Details: ${error.message}</p>`;
            } finally {
                updateCharCountAndButton(); 
            }
        });
    }
    
    // --- Initialize Homepage ---
    if (document.body.contains(sectionSelector) && document.body.contains(aiContentParent) && document.body.contains(contentTitleElement)) {
        sectionSelector.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            if (selectedValue === "resume_generator_page") {
                window.location.href = "resume-generator.html"; 
            } else if (selectedValue && selectedValue !== "") { 
                loadContentForSection(selectedValue);
            }
            // No explicit 'else' needed as the disabled option shouldn't trigger a content load,
            // and the initial load handles the default state.
        });

        // Initial content load for the homepage
        let initialSection = sectionSelector.value;
        if (initialSection === "" || !initialSection) { // If disabled option is selected by default, or no value
            sectionSelector.value = "home_overview"; // Explicitly set dropdown to default
            initialSection = "home_overview";
        }
        loadContentForSection(initialSection); // Load content for this default
        
        updateUserLocationInHero();
    }
});
