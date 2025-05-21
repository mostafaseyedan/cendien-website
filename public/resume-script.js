document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-details-form');
    const generateButton = document.getElementById('generate-resume-pdf-button');
    const resumeStatusArea = document.getElementById('resume-generation-status');
    const yearSpanResume = document.getElementById('current-year-resume');

    if (yearSpanResume) {
        yearSpanResume.textContent = new Date().getFullYear();
    }

    const { jsPDF } = window.jspdf;

    const showLoadingState = (isLoading, message = "Generating your resume PDF...") => {
        if (!resumeStatusArea) return;
        if (isLoading) {
            resumeStatusArea.style.display = 'flex';
            resumeStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if(generateButton) generateButton.disabled = true;
        } else {
            // Status updates handled explicitly
        }
    };
    
    const hideStatusArea = (delay = 0) => {
        setTimeout(() => {
            if (resumeStatusArea) {
                resumeStatusArea.style.display = 'none';
                resumeStatusArea.innerHTML = '';
            }
        }, delay);
    };

    if (resumeForm && generateButton && resumeStatusArea) {
        resumeForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const fullName = document.getElementById('fullNameResume').value.trim();
            const userPromptText = document.getElementById('resumePrompt').value.trim(); // Renamed to avoid conflict

            if (!fullName || !userPromptText) {
                alert('Please fill in both Full Name and the Resume Prompt.');
                return;
            }

            showLoadingState(true, "Generating resume content with AI...");

            const promptForResumeAI = `
Generate the complete text content for a professional resume for: ${fullName}.
The user's primary prompt, target role, or key details are: "${userPromptText}".

Please structure the output strictly as follows, using the exact headings in ALL CAPS and specific delimiters:

###CONTACT_INFO_START###
Email: [Generate a plausible professional email based on the name, e.g., ${fullName.split(' ').join('.').toLowerCase()}@email.com]
Phone: [Generate a plausible phone number, e.g., (555) 123-4567]
LinkedIn: linkedin.com/in/${fullName.toLowerCase().replace(/\s+/g, '')}
Location: [If user prompt mentions a city, use it. Otherwise, generate a plausible major US city, e.g., Dallas, TX or San Francisco, CA]
###CONTACT_INFO_END###

###SUMMARY_START###
[Generate a very concise (2-3 short sentences) impactful professional summary tailored to the user's prompt and target role. Include specific, plausible company names like "Innovate Corp", "Solutions Ltd.", "Tech Solutions Inc.", "Global Corp", "Accenture", "Deloitte" and university names like "University of Texas at Austin", "Stanford University", "MIT" if appropriate for context and to make the resume feel realistic.]
###SUMMARY_END###

###SKILLS_START###
[Generate a list of 8-12 relevant technical and soft skills based on the user's prompt. Each skill should be on a new line, starting with a hyphen '-'. Examples:
- Project Management
- Agile Methodologies
- Infor M3 Expertise
- Cloud Computing (AWS, Azure)
- Data Analysis
- Team Leadership
- Strategic Planning
- Software Development (Java, Python)
- Stakeholder Communication]
###SKILLS_END###

###EXPERIENCE_START###
[For each job role (generate 2-3 distinct, plausible roles if not detailed in the user's prompt, relevant to the target role):]
####JOB_START####
Job Title: [e.g., Senior Marketing Manager, Lead Software Engineer]
Company: [e.g., Innovate Corp, or a well-known company like "Google", "Microsoft", "Salesforce"]
Location: [e.g., Dallas, TX or a relevant major city]
Dates: [e.g., May 2020 - Present, or June 2018 - April 2020]
- [Responsibility/Achievement 1: Use action verbs and quantifiable results. Example: Led a team of 5 in developing and executing multi-channel marketing strategies, increasing lead generation by 25% YoY.]
- [Responsibility/Achievement 2]
- [Responsibility/Achievement 3, if applicable]
####JOB_END####
[Repeat for each distinct role]
###EXPERIENCE_END###

###EDUCATION_START###
[For each degree (generate 1-2 plausible degrees):]
####DEGREE_START####
Degree: [e.g., Master of Business Administration (MBA) or Bachelor of Science in Computer Science]
University: [e.g., University of Texas at Dallas, or "Stanford University", "Georgia Tech"]
Location: [e.g., Richardson, TX or relevant city for the university]
Graduation Year: [e.g., 2016]
[Optional: GPA: X.X/4.0 or relevant honors, if AI can generate plausibly]
####DEGREE_END####
[Repeat for other degrees if applicable]
###EDUCATION_END###

[OPTIONAL: If highly relevant to the prompt, include a PROJECTS or CERTIFICATIONS section using ###SECTION_NAME_START### and ###SECTION_NAME_END### delimiters, with ####ITEM_START#### and ####ITEM_END#### for individual items, and hyphenated bullet points within.]

The entire output must be plain text. Use newline characters (\\n) to separate paragraphs, section headings, and bullet points.
Do NOT use any markdown like \`\`\` or HTML tags in your response.
Ensure each section heading (like SUMMARY, SKILLS, EXPERIENCE, EDUCATION) is on its own line and in ALL CAPS.
Ensure each bullet point under Skills, Experience, and Projects starts on a new line.
`;

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptForResumeAI })
                });

                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
                    throw new Error(errorResult.error || `API error! status: ${response.status}`);
                }

                const data = await response.json();
                let resumeText = data.generatedText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
                
                showLoadingState(true, "Formatting PDF with professional design...");

                const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                
                const topMargin = 15; // This will be effectively replaced by newNameHeaderHeight for content start
                const bottomMargin = 15;
                const leftMargin = 15;
                const rightMargin = 15;
                const usableWidth = pageWidth - leftMargin - rightMargin;

                const sidebarWidth = usableWidth * 0.32;
                const mainColWidth = usableWidth * 0.64; 
                const gutter = usableWidth - sidebarWidth - mainColWidth; 
                const mainColX = leftMargin + sidebarWidth + gutter;

                const newNameHeaderHeight = 30; // Increased header height in mm

                const fontSizes = {
                    name: 22, // Slightly increased for new header
                    jobTitle: 10, 
                    sectionTitle: 12,
                    itemTitle: 10, 
                    body: 9.5,
                    small: 8.5,
                    contact: 9,
                };
                const lineHeights = {
                    name: 9, // Adjusted for new font size
                    jobTitle: 5,
                    sectionTitle: 7,
                    itemTitle: 5,
                    body: 4.5,
                    small: 4,
                    contact: 4,
                };
                const colors = { 
                    primary: "#2c3e50", 
                    text: "#333333", 
                    lightText: "#5f6368", // For subtitle
                    accent: "#3498db", 
                    line: "#cccccc",
                    nameBackground: "#e8e3dc" // Beige like color from template
                };
                
                function drawPageDecorations(contentStartingY) {
                    doc.setDrawColor(colors.line);
                    doc.setLineWidth(0.2);
                    const lineX = leftMargin + sidebarWidth + (gutter / 2);
                    // Line starts from below the header down to page bottom margin
                    doc.line(lineX, contentStartingY , lineX, pageHeight - bottomMargin + 5);
                }

                function addText(text, x, currentY, options = {}) {
                    const fs = options.fontSize || fontSizes.body;
                    const lh = options.lineHeight || lineHeights.body;
                    const style = options.fontStyle || "normal";
                    const color = options.color || colors.text;
                    const maxWidth = options.maxWidth || (x === leftMargin ? sidebarWidth : mainColWidth);
                    const isBullet = options.isBullet || false;
                    const bulletChar = "•";
                    const bulletIndent = 4;

                    doc.setFontSize(fs);
                    doc.setFont("helvetica", style);
                    doc.setTextColor(color);

                    let printX = x;
                    let textToPrint = text;
                    let effectiveMaxWidth = maxWidth;

                    if (isBullet) {
                        printX = x + bulletIndent;
                        textToPrint = text.startsWith("- ") ? text.substring(2).trim() : (text.startsWith("* ") ? text.substring(2).trim() : text.trim());
                        effectiveMaxWidth = maxWidth - bulletIndent;
                        if (currentY + lh > pageHeight - bottomMargin) { 
                            doc.addPage(); 
                            drawPageDecorations(topMargin); // Use standard topMargin for subsequent pages
                            currentY = topMargin; 
                        }
                        doc.text(bulletChar, x, currentY); 
                    }
                    
                    const lines = doc.splitTextToSize(textToPrint, effectiveMaxWidth);
                    for (const line of lines) {
                        if (currentY + lh > pageHeight - bottomMargin) {
                            doc.addPage();
                            drawPageDecorations(topMargin); // Use standard topMargin for subsequent pages
                            currentY = topMargin;
                            if (isBullet) doc.text(bulletChar, x, currentY); 
                        }
                        doc.text(line, printX, currentY);
                        currentY += lh;
                    }
                    return currentY;
                }

                function addSectionTitle(title, x, currentY, colWidth) {
                    currentY += 2; 
                    const titleLh = lineHeights.sectionTitle;
                    if (currentY + titleLh > pageHeight - bottomMargin) { 
                        doc.addPage(); 
                        drawPageDecorations(topMargin); // Use standard topMargin for subsequent pages
                        currentY = topMargin; 
                    }
                    
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(fontSizes.sectionTitle);
                    doc.setTextColor(colors.primary);
                    doc.text(title.toUpperCase(), x, currentY);
                    currentY += titleLh - 2; 
                    doc.setDrawColor(colors.accent);
                    doc.setLineWidth(0.4);
                    doc.line(x, currentY, x + colWidth, currentY); 
                    currentY += 4; 
                    return currentY;
                }

                // --- Parse AI Text --- (Parsing logic remains the same)
                const parsedSections = {};
                const sectionRegexGlobal = /###([A-Z_]+)_START###\n?([\s\S]*?)\n?###\1_END###/g;
                let matchGlobal;
                while ((matchGlobal = sectionRegexGlobal.exec(resumeText)) !== null) {
                    parsedSections[matchGlobal[1]] = matchGlobal[2].trim();
                }
                
                if (parsedSections.EXPERIENCE) {
                    parsedSections.EXPERIENCE_PARSED = [];
                    const jobBlocks = parsedSections.EXPERIENCE.split(/####JOB_START####|####JOB_END####/);
                    jobBlocks.forEach(block => {
                        const trimmedBlock = block.trim();
                        if (trimmedBlock) {
                            const job = { bullets: [] };
                            const lines = trimmedBlock.split('\n').map(line => line.trim());
                            lines.forEach(line => {
                                if (line.startsWith("Job Title:")) job.title = line.substring("Job Title:".length).trim();
                                else if (line.startsWith("Company:")) job.company = line.substring("Company:".length).trim();
                                else if (line.startsWith("Location:")) job.location = line.substring("Location:".length).trim();
                                else if (line.startsWith("Dates:")) job.dates = line.substring("Dates:".length).trim();
                                else if (line.startsWith("-")) job.bullets.push(line.substring(1).trim());
                            });
                            if (Object.keys(job).length > 1 || job.bullets.length > 0) {
                                parsedSections.EXPERIENCE_PARSED.push(job);
                            }
                        }
                    });
                }

                if (parsedSections.EDUCATION) {
                    parsedSections.EDUCATION_PARSED = [];
                    const degreeBlocks = parsedSections.EDUCATION.split(/####DEGREE_START####|####DEGREE_END####/);
                    degreeBlocks.forEach(block => {
                        const trimmedBlock = block.trim();
                        if (trimmedBlock) {
                            const edu = {};
                            const lines = trimmedBlock.split('\n').map(line => line.trim());
                            lines.forEach(line => {
                                if (line.startsWith("Degree:")) edu.degree = line.substring("Degree:".length).trim();
                                else if (line.startsWith("University:")) edu.university = line.substring("University:".length).trim();
                                else if (line.startsWith("Location:")) edu.location = line.substring("Location:".length).trim();
                                else if (line.startsWith("Graduation Year:")) edu.year = line.substring("Graduation Year:".length).trim();
                                else if (line.startsWith("GPA:")) edu.gpa = line.substring("GPA:".length).trim();
                            });
                            if (Object.keys(edu).length > 0) {
                                parsedSections.EDUCATION_PARSED.push(edu);
                            }
                        }
                    });
                }

                // --- Render PDF ---
                // 1. Name Header with Background (Seamless to top)
                doc.setFillColor(colors.nameBackground);
                doc.rect(0, 0, pageWidth, newNameHeaderHeight, 'F'); // x=0, y=0, full page width

                let yInHeader = newNameHeaderHeight / 2 - (lineHeights.name / 2); // Initial Y for vertical centering
                const targetJobTitleUser = userPromptText.split('\n')[0].trim(); // Get first line of prompt as title

                if (targetJobTitleUser && fullName.toLowerCase() !== targetJobTitleUser.toLowerCase()) { // Check if subtitle is meaningful
                    yInHeader -= lineHeights.jobTitle / 2; // Adjust for two lines
                }

                doc.setFontSize(fontSizes.name);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(colors.primary);
                doc.text(fullName.toUpperCase(), pageWidth / 2, yInHeader, { align: 'center' });
                
                if (targetJobTitleUser && fullName.toLowerCase() !== targetJobTitleUser.toLowerCase()) {
                    yInHeader += lineHeights.name;
                    doc.setFontSize(fontSizes.jobTitle);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(colors.lightText); // Using lightText for subtitle
                    doc.text(targetJobTitleUser.toUpperCase(), pageWidth / 2, yInHeader, { align: 'center' });
                }
                
                let contentStartY = newNameHeaderHeight + 5; // Start content below the header + padding

                drawPageDecorations(contentStartY);


                let ySidebar = contentStartY;
                let yMain = contentStartY; 

                // Sidebar Content (uses original topMargin for subsequent pages if content flows)
                if (parsedSections.CONTACT_INFO) {
                    ySidebar = addSectionTitle("CONTACT", leftMargin, ySidebar, sidebarWidth);
                    const contactItems = parsedSections.CONTACT_INFO.split('\n').map(s => s.trim()).filter(s => s);
                    contactItems.forEach(item => {
                        ySidebar = addText(item, leftMargin, ySidebar, { fontSize: fontSizes.small, maxWidth: sidebarWidth, color: colors.text });
                    });
                     ySidebar += lineHeights.body; 
                }

                if (parsedSections.EDUCATION_PARSED && parsedSections.EDUCATION_PARSED.length > 0) { 
                    ySidebar = addSectionTitle("EDUCATION", leftMargin, ySidebar, sidebarWidth);
                    parsedSections.EDUCATION_PARSED.forEach(edu => {
                        ySidebar = addText(edu.degree || "Degree", leftMargin, ySidebar, { fontSize: fontSizes.itemTitle, fontStyle: "bold", maxWidth: sidebarWidth });
                        ySidebar = addText(edu.university || "University", leftMargin, ySidebar, { fontSize: fontSizes.body, maxWidth: sidebarWidth });
                        if (edu.location) ySidebar = addText(edu.location, leftMargin, ySidebar, { fontSize: fontSizes.small, color: colors.lightText, maxWidth: sidebarWidth });
                        if (edu.year) ySidebar = addText(edu.year, leftMargin, ySidebar, { fontSize: fontSizes.small, color: colors.lightText, maxWidth: sidebarWidth });
                        if (edu.gpa) ySidebar = addText(`GPA: ${edu.gpa}`, leftMargin, ySidebar, { fontSize: fontSizes.small, color: colors.lightText, maxWidth: sidebarWidth });
                        ySidebar += lineHeights.small; 
                    });
                    ySidebar += lineHeights.body;
                }

                if (parsedSections.SKILLS) {
                    ySidebar = addSectionTitle("SKILLS", leftMargin, ySidebar, sidebarWidth);
                    const skillsList = parsedSections.SKILLS.split('\n').map(s => s.trim()).filter(s => s);
                    skillsList.forEach(skill => {
                        ySidebar = addText(skill, leftMargin, ySidebar, { isBullet: true, fontSize: fontSizes.body, maxWidth: sidebarWidth });
                    });
                    ySidebar += lineHeights.body;
                }

                // Main Column Content
                if (parsedSections.SUMMARY) {
                    yMain = addSectionTitle("SUMMARY", mainColX, yMain, mainColWidth);
                    yMain = addText(parsedSections.SUMMARY, mainColX, yMain, { fontSize: fontSizes.body, maxWidth: mainColWidth });
                    yMain += lineHeights.body;
                }

                if (parsedSections.EXPERIENCE_PARSED && parsedSections.EXPERIENCE_PARSED.length > 0) {
                    yMain = addSectionTitle("EXPERIENCE", mainColX, yMain, mainColWidth);
                    parsedSections.EXPERIENCE_PARSED.forEach(job => {
                        const estHeight = lineHeights.itemTitle + lineHeights.small + (job.bullets && job.bullets.length > 0 ? lineHeights.body : 0) + 5;
                        // Check if adding this job would exceed page, considering if it's the very first item after header
                        const isFirstContentElement = (doc.internal.getCurrentPageInfo().pageNumber === 1 && yMain === contentStartY);
                        if (yMain + estHeight > pageHeight - bottomMargin && !isFirstContentElement) { 
                           doc.addPage(); 
                           drawPageDecorations(topMargin); // Subsequent pages use standard topMargin
                           yMain = topMargin; 
                           yMain = addSectionTitle("EXPERIENCE (Continued)", mainColX, yMain, mainColWidth); 
                        }

                        yMain = addText(job.title || "Job Title", mainColX, yMain, { fontSize: fontSizes.itemTitle, fontStyle: "bold", maxWidth: mainColWidth });
                        
                        let companyLine = job.company || "Company Name";
                        if (job.location) companyLine += ` - ${job.location}`;
                        const yForDate = yMain;
                        yMain = addText(companyLine, mainColX, yMain, { fontSize: fontSizes.small, fontStyle: "italic", color: colors.lightText, maxWidth: mainColWidth });
                        
                        if (job.dates) {
                            const currentSize = doc.getFontSize();
                            const currentStyle = doc.getFont().fontStyle;
                            const currentTextColor = doc.getTextColor();
                            doc.setFontSize(fontSizes.small);
                            doc.setFont("helvetica", "italic"); 
                            doc.setTextColor(colors.lightText);
                            doc.text(job.dates, mainColX + mainColWidth, yForDate , { align: 'right' });
                            doc.setFontSize(currentSize);
                            doc.setFont("helvetica", currentStyle); 
                            doc.setTextColor(currentTextColor);
                        }
                        yMain += 2; 

                        if (job.bullets && job.bullets.length > 0) {
                            job.bullets.forEach(bullet => {
                                yMain = addText(bullet, mainColX, yMain, { isBullet: true, fontSize: fontSizes.body, maxWidth: mainColWidth });
                            });
                        }
                        yMain += lineHeights.body; 
                    });
                }

                if (parsedSections.PROJECTS) { 
                    yMain = addSectionTitle("PROJECTS", mainColX, yMain, mainColWidth);
                    const projectItems = parsedSections.PROJECTS.split(/####ITEM_START####|####ITEM_END####/).map(s => s.trim()).filter(s => s);
                     projectItems.forEach(item => {
                        const lines = item.split('\n');
                        lines.forEach((line, idx) => {
                            let isBulletItem = (idx > 0 && (line.startsWith("- ") || line.startsWith("* ")));
                            let itemFontStyle = (idx === 0 && !isBulletItem) ? "bold" : "normal";
                            let itemFontSize = (idx === 0 && !isBulletItem) ? fontSizes.itemTitle : fontSizes.body;
                           yMain = addText(line, mainColX, yMain, {fontSize: itemFontSize, fontStyle: itemFontStyle, isBullet: isBulletItem, maxWidth: mainColWidth});
                        });
                        yMain += lineHeights.body; 
                    });
                }

                doc.save(`${fullName.replace(/\s+/g, '_')}_CN_AI_Resume.pdf`);
                showLoadingState(false); 
                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">PDF generated successfully and download started!</p>`;
                hideStatusArea(5000);

            } catch (error) {
                console.error('Error generating resume PDF:', error);
                showLoadingState(true, `Error: ${error.message}. Please try again.`);
            } finally {
                if(generateButton) generateButton.disabled = false;
            }
        });
    } else {
        console.error("One or more elements for the resume generator are missing.");
    }
});
