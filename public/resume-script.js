// In public/resume-script.js

document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-details-form');
    const generateButton = document.getElementById('generate-resume-pdf-button');
    const resumeStatusArea = document.getElementById('resume-generation-status');
    const yearSpanResume = document.getElementById('current-year-resume');

    if (yearSpanResume) {
        yearSpanResume.textContent = new Date().getFullYear();
    }

    const { jsPDF } = window.jspdf; // Make sure jsPDF is available

    const showLoadingState = (isLoading, message = "Generating your resume PDF...") => {
        // ... (this function remains the same)
        if (!resumeStatusArea) return;
        if (isLoading) {
            resumeStatusArea.style.display = 'flex';
            resumeStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if(generateButton) generateButton.disabled = true;
        } else {
            // Status update will be handled by success/error messages
        }
    };
    
    const hideStatusArea = (delay = 0) => {
        // ... (this function remains the same)
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
            const userPrompt = document.getElementById('resumePrompt').value.trim();

            if (!fullName || !userPrompt) {
                alert('Please fill in both Full Name and the Resume Prompt.');
                return;
            }

            showLoadingState(true, "Generating resume content with AI...");

            // The detailed promptForResumeAI asking for structured text with delimiters
            // (###SECTION_START###, ####JOB_START####, etc.) should be here.
            // This prompt is crucial for the advanced PDF parsing to work.
            const promptForResumeAI = `
Generate the complete text content for a professional resume for: ${fullName}.
The user's primary prompt, target role, or key details are: "${userPrompt}".

Please structure the output strictly as follows, using the exact headings in ALL CAPS and specific delimiters:

###CONTACT_INFO_START###
Email: [Generate a plausible professional email based on the name]
Phone: [Generate a plausible phone number, e.g., (555) 123-4567]
LinkedIn: linkedin.com/in/${fullName.toLowerCase().replace(/\s+/g, '')}
[Optional: If user prompt mentions a city, add it here. e.g., City, State]
###CONTACT_INFO_END###

###SUMMARY_START###
[Generate a concise (3-4 sentences) impactful professional summary tailored to the user's prompt and target role. Include specific, plausible company names and university names if appropriate for context, e.g., "Experienced Marketing Manager at companies like 'Innovate Corp' and 'Solutions Ltd.'..."]
###SUMMARY_END###

###SKILLS_START###
[Generate a list of 8-12 relevant technical and soft skills based on the user's prompt. Each skill should be on a new line, starting with a hyphen '-'. Example: 
- Project Management
- Agile Methodologies
- Infor M3 Expertise
- Data Analysis
- Team Leadership
]
###SKILLS_END###

###EXPERIENCE_START###
[For each job role (generate 2-3 distinct, plausible roles if not detailed in the user's prompt, relevant to the target role):]
####JOB_START####
Job Title: [e.g., Senior Marketing Manager]
Company: [e.g., Innovate Corp, or a well-known company like "Google", "Microsoft"]
Location: [e.g., Dallas, TX or a relevant major city]
Dates: [e.g., May 2020 - Present, or June 2018 - April 2020]
- [Responsibility/Achievement 1: Use action verbs and quantifiable results. Example: Led a team of 5, increasing lead generation by 25% YoY.]
- [Responsibility/Achievement 2]
####JOB_END####
[Repeat for each distinct role]
###EXPERIENCE_END###

###EDUCATION_START###
[For each degree (generate 1-2 plausible degrees):]
####DEGREE_START####
Degree: [e.g., Master of Business Administration (MBA)]
University: [e.g., University of Texas at Dallas, or a well-known institution like "Stanford University"]
Location: [e.g., Richardson, TX or relevant city]
Graduation Year: [e.g., 2016]
####DEGREE_END####
[Repeat for other degrees if applicable]
###EDUCATION_END###

[OPTIONAL: PROJECTS or CERTIFICATIONS section using ###SECTION_NAME_START### and ###SECTION_NAME_END### delimiters, with ####ITEM_START#### and ####ITEM_END#### for individual items, and hyphenated bullet points.]

Output must be plain text. Use newlines for separation. No markdown like \`\`\` or HTML.
Ensure specific company and university names are used where plausible.
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
                
                // --- Define Layout & Styles (as per the visual examples) ---
                const leftMargin = 15;
                const rightMargin = 15;
                const topMargin = 20;
                const bottomMargin = 20;
                const usableWidth = pageWidth - leftMargin - rightMargin;
                
                const sidebarX = leftMargin;
                const sidebarWidth = usableWidth * 0.33; 
                const mainColX = leftMargin + sidebarWidth + 5; 
                const mainColWidth = usableWidth - sidebarWidth - 5;

                let yPosition = topMargin;
                // let currentX = mainColX; // This can be set dynamically
                // let currentMaxWidth = mainColWidth; // This can be set dynamically

                const fontConfig = {
                    name: "helvetica", 
                    nameBold: "helvetica", 
                    titleSize: 20,
                    subtitleSize: 11,
                    headingSize: 12, 
                    subHeadingSize: 10, 
                    bodySize: 9,    
                    smallSize: 8,
                    lineHeightFactor: 1.4, 
                };

                const colors = {
                    primary: "#1A237E", 
                    secondary: "#5C6BC0", 
                    text: "#212121",    
                    lightText: "#5f6368", 
                    line: "#757575",    
                    sidebarBg: "#F5F5F5" 
                };

                function calculateLineHeight(fontSize) {
                    return fontSize * 0.352777 * fontConfig.lineHeightFactor; 
                }

                const defaultLineHeight = calculateLineHeight(fontConfig.bodySize); // Defined using the function
                const headingLineHeight = calculateLineHeight(fontConfig.headingSize);
                const nameLineHeight = calculateLineHeight(fontConfig.titleSize); // Assuming titleSize is for the name
                const sectionSpacing = 4; 
                const paragraphSpacing = 2;
                
                function addTextLines(text, x, y, options = {}) {
                    const fontSize = options.fontSize || fontConfig.bodySize;
                    const fontStyle = options.fontStyle || "normal"; // "normal", "bold", "italic", "bolditalic"
                    const color = options.color || colors.text;
                    const maxWidth = options.maxWidth || (x === sidebarX ? sidebarWidth : mainColWidth);
                    const isBullet = options.isBullet || false;
                    const bulletChar = "•"; // Or options.bulletChar || "•"
                    const bulletIndent = 4; // mm

                    doc.setFontSize(fontSize);
                    doc.setFont(fontConfig.name, fontStyle); // jsPDF handles font style string
                    doc.setTextColor(color);

                    let textToPrint = text;
                    let currentX = x;
                    let textMaxWidth = maxWidth;

                    if (isBullet) {
                        currentX = x + bulletIndent;
                        textToPrint = text.substring(text.indexOf(" ") + 1).trim(); // Remove "- " or "* "
                        textMaxWidth = maxWidth - bulletIndent;
                        // Draw bullet before text
                         if (yPosition > pageHeight - bottomMargin - calculateLineHeight(fontSize)) {
                            doc.addPage(); yPosition = topMargin;
                        }
                        doc.text(bulletChar, x, yPosition);
                    }
                    
                    const lines = doc.splitTextToSize(textToPrint, textMaxWidth);
                    lines.forEach(line => {
                        if (yPosition > pageHeight - bottomMargin - calculateLineHeight(fontSize)) {
                            doc.addPage();
                            yPosition = topMargin;
                             // If bullet, redraw bullet on new page
                            if (isBullet) doc.text(bulletChar, x, yPosition);
                        }
                        doc.text(line, currentX, yPosition);
                        yPosition += calculateLineHeight(fontSize);
                    });
                    return yPosition;
                }
                
                function addSectionHeading(title, x, y, colWidth) {
                    const lineHeight = calculateLineHeight(fontConfig.headingSize);
                    if (y > pageHeight - bottomMargin - lineHeight * 2) { // Check for space for heading and a line of text
                        doc.addPage();
                        y = topMargin;
                    }
                    doc.setFont(fontConfig.nameBold, "bold");
                    doc.setFontSize(fontConfig.headingSize);
                    doc.setTextColor(colors.primary);
                    doc.text(title.toUpperCase(), x, y);
                    y += lineHeight -1; // Position for underline
                    doc.setDrawColor(colors.line);
                    doc.setLineWidth(0.3);
                    doc.line(x, y, x + colWidth, y); // Full width line for the column
                    y += 4; // Space after line
                    return y;
                }

                // --- Parse AI Text (using the delimiters) ---
                const parsedSections = {};
                const sectionRegexGlobal = /###([A-Z_]+)_START###\n?([\s\S]*?)\n?###\1_END###/g;
                let matchGlobal;
                while ((matchGlobal = sectionRegexGlobal.exec(resumeText)) !== null) {
                    parsedSections[matchGlobal[1]] = matchGlobal[2].trim();
                }
                
                // Further parse experience and education into arrays of objects
                if (parsedSections.EXPERIENCE) {
                    const jobs = [];
                    const jobRegex = /####JOB_START####\n?([\s\S]*?)\n?####JOB_END####/g;
                    let jobMatch;
                    while ((jobMatch = jobRegex.exec(parsedSections.EXPERIENCE)) !== null) {
                        const jobDetails = {};
                        const jobLines = jobMatch[1].trim().split('\n');
                        let currentBulletList = [];
                        jobLines.forEach(line => {
                            if (line.startsWith("Job Title:")) jobDetails.title = line.substring("Job Title:".length).trim();
                            else if (line.startsWith("Company:")) jobDetails.company = line.substring("Company:".length).trim();
                            else if (line.startsWith("Location:")) jobDetails.location = line.substring("Location:".length).trim();
                            else if (line.startsWith("Dates:")) jobDetails.dates = line.substring("Dates:".length).trim();
                            else if (line.startsWith("- ") || line.startsWith("* ")) {
                                currentBulletList.push(line.trim());
                            }
                        });
                        if (currentBulletList.length > 0) jobDetails.bullets = currentBulletList;
                        jobs.push(jobDetails);
                    }
                    parsedSections.EXPERIENCE_PARSED = jobs;
                }
                // Similar parsing for EDUCATION degrees
                if (parsedSections.EDUCATION) {
                    const degrees = [];
                    const degreeRegex = /####DEGREE_START####\n?([\s\S]*?)\n?####DEGREE_END####/g;
                    let degreeMatch;
                    while ((degreeMatch = degreeRegex.exec(parsedSections.EDUCATION)) !== null) {
                        const degreeDetails = {};
                        const degreeLines = degreeMatch[1].trim().split('\n');
                         degreeLines.forEach(line => {
                            if (line.startsWith("Degree:")) degreeDetails.degree = line.substring("Degree:".length).trim();
                            else if (line.startsWith("University:")) degreeDetails.university = line.substring("University:".length).trim();
                            else if (line.startsWith("Location:")) degreeDetails.location = line.substring("Location:".length).trim();
                            else if (line.startsWith("Graduation Year:")) degreeDetails.year = line.substring("Graduation Year:".length).trim();
                            else if (line.startsWith("GPA:")) degreeDetails.gpa = line.substring("GPA:".length).trim();
                        });
                        degrees.push(degreeDetails);
                    }
                    parsedSections.EDUCATION_PARSED = degrees;
                }


                // --- RENDER PDF CONTENT ---

                // 1. Name (Large, Centered or Prominent)
                doc.setFont(fontConfig.nameBold, "bold");
                doc.setFontSize(fontConfig.titleSize);
                doc.setTextColor(colors.primary);
                const nameText = fullName.toUpperCase();
                const nameWidth = doc.getStringUnitWidth(nameText) * doc.getFontSize() / doc.internal.scaleFactor;
                doc.text(nameText, (pageWidth - nameWidth) / 2, yPosition); // Centered
                yPosition += calculateLineHeight(fontConfig.titleSize);

                // 2. Contact Info (Below name, smaller, centered or left)
                if (parsedSections.CONTACT_INFO) {
                    const contactLines = parsedSections.CONTACT_INFO.split('\n').map(l => l.trim()).filter(l => l);
                    const contactText = contactLines.join(' | '); // Join with pipes or spaces
                    doc.setFont(fontConfig.name, "normal");
                    doc.setFontSize(fontConfig.smallSize + 1); // 9pt
                    doc.setTextColor(colors.lightText);
                    const contactWidth = doc.getStringUnitWidth(contactText) * doc.getFontSize() / doc.internal.scaleFactor;
                    doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition);
                    yPosition += calculateLineHeight(fontConfig.smallSize + 1) + 2; // Extra space
                }
                
                // Horizontal Line
                doc.setDrawColor(colors.line);
                doc.setLineWidth(0.3);
                doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
                yPosition += 5; // Space after line

                // --- Start possible two-column layout ---
                let yMain = yPosition;
                let ySidebar = yPosition;

                // Main Column Content (Summary, Experience, Projects)
                if (parsedSections.SUMMARY) {
                    yMain = addSectionHeading("SUMMARY", mainColX, yMain, mainColWidth);
                    yMain = addTextLines(parsedSections.SUMMARY, mainColX, yMain, { maxWidth: mainColWidth });
                    yMain += paragraphSpacing;
                }

                if (parsedSections.EXPERIENCE_PARSED) {
                    yMain = addSectionHeading("EXPERIENCE", mainColX, yMain, mainColWidth);
                    parsedSections.EXPERIENCE_PARSED.forEach(job => {
                        const jobTitleLineHeight = calculateLineHeight(fontConfig.subHeadingSize);
                        const dateLineHeight = calculateLineHeight(fontConfig.smallSize);
                        const bulletLineHeight = calculateLineHeight(fontConfig.bodySize);
                        const estimatedJobHeight = jobTitleLineHeight + dateLineHeight + 
                                                 (job.bullets ? job.bullets.length * bulletLineHeight : 0) + 
                                                 paragraphSpacing;

                        if (yMain + estimatedJobHeight > pageHeight - bottomMargin) {
                            doc.addPage(); yMain = topMargin;
                            yMain = addSectionHeading("EXPERIENCE (Continued)", mainColX, yMain, mainColWidth);
                        }

                        yMain = addTextLines(job.title || "Job Title", mainColX, yMain, { fontSize: fontConfig.subHeadingSize, fontStyle: "bold", color: colors.text, maxWidth: mainColWidth });
                        
                        let companyDateLine = (job.company || "Company") + (job.dates ? ` (${job.dates})` : '');
                        yMain = addTextLines(companyDateLine, mainColX, yMain, { fontSize: fontConfig.smallSize, fontStyle: "italic", color: colors.lightText, maxWidth: mainColWidth });
                         if (job.location) {
                           yMain = addTextLines(job.location, mainColX, yMain - (calculateLineHeight(fontConfig.smallSize)/2) , { fontSize: fontConfig.smallSize, fontStyle: "italic", color: colors.lightText, maxWidth: mainColWidth }); // Add location
                        }
                        yMain += 1; // Little space before bullets

                        if (job.bullets) {
                            job.bullets.forEach(bullet => {
                                yMain = addTextLines(bullet, mainColX, yMain, { isBullet: true, maxWidth: mainColWidth });
                            });
                        }
                        yMain += paragraphSpacing + 2; // Extra space after job entry
                    });
                }
                
                if (parsedSections.PROJECTS) {
                    yMain = addSectionHeading("PROJECTS", mainColX, yMain, mainColWidth);
                    const projectItems = parsedSections.PROJECTS.split("####ITEM_START####").map(s => s.replace(/####ITEM_END####/g, '').trim()).filter(s => s);
                     projectItems.forEach(item => {
                        const lines = item.split('\n');
                        lines.forEach((line, idx) => {
                            // Logic to detect title vs bullet
                            let isBulletItem = (idx > 0 && (line.startsWith("- ") || line.startsWith("* ")));
                            let itemFontStyle = (idx === 0 && !isBulletItem) ? "bold" : "normal";
                            let itemFontSize = (idx === 0 && !isBulletItem) ? fontConfig.subHeadingSize : fontConfig.bodySize;
                           yMain = addTextLines(line, mainColX, yMain, {fontSize: itemFontSize, fontStyle: itemFontStyle, isBullet: isBulletItem, maxWidth: mainColWidth});
                        });
                        yMain += paragraphSpacing;
                    });
                }


                // Sidebar Content (Education, Skills) - Place it now, checking ySidebar against yMain to try and balance
                // This is a simplified alignment. True parallel columns are harder.
                // We draw the sidebar on potentially new pages if the main content flowed long.
                
                if (yMain > pageHeight - bottomMargin - 50 && (parsedSections.EDUCATION_PARSED || parsedSections.SKILLS)) { // If main content is near end, force sidebar to new page
                    doc.addPage();
                    ySidebar = topMargin;
                     yMain = topMargin; // Also reset yMain conceptually for this new page, though it's done.
                } else if (yMain < ySidebar && (parsedSections.EDUCATION_PARSED || parsedSections.SKILLS)) {
                    // If main content was short, but sidebar is long, sidebar might need new page
                    // This heuristic is tricky. For now, let's just draw it.
                }


                if (parsedSections.EDUCATION_PARSED) {
                    ySidebar = addSectionHeading("EDUCATION", sidebarX, ySidebar, sidebarWidth);
                    parsedSections.EDUCATION_PARSED.forEach(edu => {
                        ySidebar = addTextLines(edu.degree || "Degree", sidebarX, ySidebar, { fontSize: fontConfig.subHeadingSize, fontStyle: "bold", maxWidth: sidebarWidth });
                        ySidebar = addTextLines(edu.university || "University", sidebarX, ySidebar, { fontSize: fontConfig.bodySize, maxWidth: sidebarWidth });
                        if (edu.location) ySidebar = addTextLines(edu.location, sidebarX, ySidebar, { fontSize: fontConfig.smallSize, color: colors.lightText, maxWidth: sidebarWidth });
                        if (edu.year) ySidebar = addTextLines(edu.year, sidebarX, ySidebar, { fontSize: fontConfig.smallSize, color: colors.lightText, maxWidth: sidebarWidth });
                        if (edu.gpa) ySidebar = addTextLines(`GPA: ${edu.gpa}`, sidebarX, ySidebar, { fontSize: fontConfig.smallSize, color: colors.lightText, maxWidth: sidebarWidth });
                        ySidebar += paragraphSpacing;
                    });
                }

                if (parsedSections.SKILLS) {
                    ySidebar = addSectionHeading("SKILLS", sidebarX, ySidebar, sidebarWidth);
                    const skillsList = parsedSections.SKILLS.split('\n').map(s => s.trim()).filter(s => s);
                    skillsList.forEach(skill => {
                        ySidebar = addTextLines(skill, sidebarX, ySidebar, { isBullet: (skill.startsWith("- ") || skill.startsWith("* ")), maxWidth: sidebarWidth });
                    });
                }
                

                doc.save(`${fullName.replace(/\s+/g, '_')}_Cendien_AI_Resume.pdf`);
                showLoadingState(false); // Clear loading spinner
                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">PDF generated successfully and download started!</p>`;
                hideStatusArea(5000); // Hide message after 5 seconds

            } catch (error) {
                console.error('Error generating resume PDF:', error);
                showLoadingState(true, `Error: ${error.message}. Please try again.`);
                // setTimeout(hideStatusArea, 7000); // Optional to hide error
            } finally {
                if(generateButton) generateButton.disabled = false;
            }
        });
    } else {
        console.error("One or more elements for the resume generator are missing.");
    }
});
