document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-details-form');
    // const generatePdfButton = document.getElementById('generate-resume-pdf-button'); // Old button, can be removed
    // const generateDocxButton = document.getElementById('generate-resume-docx-button'); // Old button, can be removed
    const resumeStatusArea = document.getElementById('resume-generation-status');
    const yearSpanResume = document.getElementById('current-year-resume');

    // The new single button from HTML (though we attach listener to form submit)
    const generateButton = document.getElementById('generate-resume-button');


    if (yearSpanResume) {
        yearSpanResume.textContent = new Date().getFullYear();
    }

    const showLoadingState = (isLoading, message = "Generating your resume...") => {
        if (!resumeStatusArea) return;
        if (isLoading) {
            resumeStatusArea.style.display = 'flex';
            resumeStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            // Disable the new single button
            if (generateButton) generateButton.disabled = true;
        } else {
            // Status updates handled explicitly by caller
        }
    };
    
    const hideStatusArea = (delay = 0) => {
        setTimeout(() => {
            if (resumeStatusArea) {
                resumeStatusArea.style.display = 'none';
                resumeStatusArea.innerHTML = '';
            }
             // Enable the new single button
            if (generateButton) generateButton.disabled = false;
        }, delay);
    };

    async function getResumeData() {
        const fullName = document.getElementById('fullNameResume').value.trim();
        const userPromptText = document.getElementById('resumePrompt').value.trim();

        if (!fullName || !userPromptText) {
            alert('Please fill in both Full Name and the Resume Prompt.');
            return null;
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
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptForResumeAI })
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' }));
            throw new Error(errorResult.error || `API error! status: ${response.status}`);
        }
        const data = await response.json();
        let resumeText = data.generatedText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
        
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
        return { fullName, userPromptText, parsedSections };
    }
    
    async function generatePdfResume(resumeData) {
        const { jsPDF } = window.jspdf;
        const { fullName, userPromptText, parsedSections } = resumeData;

        // Note: showLoadingState(true, "Generating PDF...") will be called by the main event handler
        
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        const topMarginForContent = 15; 
        const bottomMargin = 15;
        const leftMargin = 15;
        const rightMargin = 15;
        const usableWidth = pageWidth - leftMargin - rightMargin;

        const sidebarWidth = usableWidth * 0.32;
        const mainColWidth = usableWidth * 0.64; 
        const gutter = usableWidth - sidebarWidth - mainColWidth; 
        const mainColX = leftMargin + sidebarWidth + gutter;

        const newNameHeaderHeight = 30; 

        const fontSizes = { name: 22, jobTitle: 10, sectionTitle: 12, itemTitle: 10, body: 9.5, small: 8.5, contact: 9 };
        const lineHeights = { name: 9, jobTitle: 5.5, sectionTitle: 7.5, itemTitle: 6, body: 5.0, small: 4.8, contact: 5.0 };
        const colors = { primary: "#2c3e50", text: "#333333", lightText: "#5f6368", accent: "#3498db", line: "#cccccc", nameBackground: "#f0f0f0" };
        
        function drawPageDecorations(contentStartingYValue) {
            doc.setDrawColor(colors.line);
            doc.setLineWidth(0.2);
            const lineX = leftMargin + sidebarWidth + (gutter / 2);
            doc.line(lineX, contentStartingYValue , lineX, pageHeight - bottomMargin + 5);
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
            let textToPrint = String(text || ''); 
            let effectiveMaxWidth = maxWidth;

            if (isBullet) {
                printX = x + bulletIndent;
                textToPrint = textToPrint.startsWith("- ") ? textToPrint.substring(2).trim() : (textToPrint.startsWith("* ") ? textToPrint.substring(2).trim() : textToPrint.trim());
                effectiveMaxWidth = maxWidth - bulletIndent;
                if (currentY + lh > pageHeight - bottomMargin) { 
                    doc.addPage(); 
                    drawPageDecorations(topMarginForContent); 
                    currentY = topMarginForContent; 
                }
                doc.text(bulletChar, x, currentY); 
            }
            
            const lines = doc.splitTextToSize(textToPrint, effectiveMaxWidth);
            for (const line of lines) {
                if (currentY + lh > pageHeight - bottomMargin) {
                    doc.addPage();
                    drawPageDecorations(topMarginForContent); 
                    currentY = topMarginForContent;
                    if (isBullet) doc.text(bulletChar, x, currentY); 
                }
                doc.text(line, printX, currentY);
                currentY += lh;
            }
            return currentY;
        }

        function addSectionTitle(title, x, currentY, colWidth) {
            currentY += lineHeights.sectionTitle * 0.5; 
            const titleLh = lineHeights.sectionTitle;
            if (currentY + titleLh > pageHeight - bottomMargin) { 
                doc.addPage(); 
                drawPageDecorations(topMarginForContent); 
                currentY = topMarginForContent; 
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(fontSizes.sectionTitle);
            doc.setTextColor(colors.primary);
            doc.text(title.toUpperCase(), x, currentY);
            currentY += titleLh - 2; 
            doc.setDrawColor(colors.accent);
            doc.setLineWidth(0.4);
            doc.line(x, currentY, x + colWidth, currentY); 
            currentY += lineHeights.sectionTitle * 0.8; 
            return currentY;
        }

        doc.setFillColor(colors.nameBackground);
        doc.rect(0, 0, pageWidth, newNameHeaderHeight, 'F');

        let yInHeader = newNameHeaderHeight / 2 - (lineHeights.name / 2); 
        const targetJobTitleUser = userPromptText.split('\n')[0].trim(); 

        if (targetJobTitleUser && fullName.toLowerCase() !== targetJobTitleUser.toLowerCase()) { 
            yInHeader -= lineHeights.jobTitle / 2; 
        }

        doc.setFontSize(fontSizes.name);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.primary);
        doc.text(fullName.toUpperCase(), pageWidth / 2, yInHeader, { align: 'center' });
        
        if (targetJobTitleUser && fullName.toLowerCase() !== targetJobTitleUser.toLowerCase()) {
            yInHeader += lineHeights.name; 
            doc.setFontSize(fontSizes.jobTitle);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(colors.lightText); 
            doc.text(targetJobTitleUser.toUpperCase(), pageWidth / 2, yInHeader, { align: 'center' });
        }
        
        let contentStartY = newNameHeaderHeight + 8; 
        drawPageDecorations(contentStartY);
        let ySidebar = contentStartY;
        let yMain = contentStartY; 

        if (parsedSections.CONTACT_INFO) {
            ySidebar = addSectionTitle("CONTACT", leftMargin, ySidebar, sidebarWidth);
            const contactItems = parsedSections.CONTACT_INFO.split('\n').map(s => s.trim()).filter(s => s);
            contactItems.forEach(item => {
                ySidebar = addText(item, leftMargin, ySidebar, { fontSize: fontSizes.small, maxWidth: sidebarWidth, color: colors.text });
            });
             ySidebar += lineHeights.body * 0.5; 
        }

        if (parsedSections.EDUCATION_PARSED && parsedSections.EDUCATION_PARSED.length > 0) { 
            ySidebar = addSectionTitle("EDUCATION", leftMargin, ySidebar, sidebarWidth);
            parsedSections.EDUCATION_PARSED.forEach(edu => {
                ySidebar = addText(edu.degree || "Degree", leftMargin, ySidebar, { fontSize: fontSizes.itemTitle, fontStyle: "bold", maxWidth: sidebarWidth });
                ySidebar = addText(edu.university || "University", leftMargin, ySidebar, { fontSize: fontSizes.body, maxWidth: sidebarWidth });
                if (edu.location) ySidebar = addText(edu.location, leftMargin, ySidebar, { fontSize: fontSizes.small, color: colors.lightText, maxWidth: sidebarWidth });
                if (edu.year) ySidebar = addText(edu.year, leftMargin, ySidebar, { fontSize: fontSizes.small, color: colors.lightText, maxWidth: sidebarWidth });
                if (edu.gpa) ySidebar = addText(`GPA: ${edu.gpa}`, leftMargin, ySidebar, { fontSize: fontSizes.small, color: colors.lightText, maxWidth: sidebarWidth });
                ySidebar += lineHeights.small * 1.2; 
            });
        }

        if (parsedSections.SKILLS) {
            ySidebar = addSectionTitle("SKILLS", leftMargin, ySidebar, sidebarWidth);
            const skillsList = parsedSections.SKILLS.split('\n').map(s => s.trim()).filter(s => s && s.startsWith("-"));
            skillsList.forEach(skill => {
                ySidebar = addText(skill, leftMargin, ySidebar, { isBullet: true, fontSize: fontSizes.body, maxWidth: sidebarWidth });
            });
        }

        if (parsedSections.SUMMARY) {
            yMain = addSectionTitle("SUMMARY", mainColX, yMain, mainColWidth);
            yMain = addText(parsedSections.SUMMARY, mainColX, yMain, { fontSize: fontSizes.body, maxWidth: mainColWidth });
            yMain += lineHeights.body * 0.5; 
        }

        if (parsedSections.EXPERIENCE_PARSED && parsedSections.EXPERIENCE_PARSED.length > 0) {
            yMain = addSectionTitle("EXPERIENCE", mainColX, yMain, mainColWidth);
            parsedSections.EXPERIENCE_PARSED.forEach(job => {
                const estHeight = lineHeights.itemTitle + lineHeights.small + (job.bullets && job.bullets.length > 0 ? lineHeights.body : 0) + 5;
                const isFirstContentElement = (doc.internal.getCurrentPageInfo().pageNumber === 1 && yMain === contentStartY);
                if (yMain + estHeight > pageHeight - bottomMargin && !isFirstContentElement) { 
                   doc.addPage(); 
                   drawPageDecorations(topMarginForContent); 
                   yMain = topMarginForContent; 
                   yMain = addSectionTitle("EXPERIENCE (Continued)", mainColX, yMain, mainColWidth); 
                }
                yMain = addText(job.title || "Job Title", mainColX, yMain, { fontSize: fontSizes.itemTitle, fontStyle: "bold", maxWidth: mainColWidth });
                let companyLine = job.company || "Company Name";
                if (job.location) companyLine += ` - ${job.location}`;
                const yForDate = yMain;
                yMain = addText(companyLine, mainColX, yMain, { fontSize: fontSizes.small, fontStyle: "italic", color: colors.lightText, maxWidth: mainColWidth });
                if (job.dates) {
                    const currentSize = doc.getFontSize(); const currentStyle = doc.getFont().fontStyle; const currentTextColor = doc.getTextColor();
                    doc.setFontSize(fontSizes.small); doc.setFont("helvetica", "italic"); doc.setTextColor(colors.lightText);
                    doc.text(job.dates, mainColX + mainColWidth, yForDate , { align: 'right' });
                    doc.setFontSize(currentSize); doc.setFont("helvetica", currentStyle); doc.setTextColor(currentTextColor);
                }
                yMain += 2.5; 
                if (job.bullets && job.bullets.length > 0) {
                    job.bullets.forEach(bullet => {
                        yMain = addText(bullet, mainColX, yMain, { isBullet: true, fontSize: fontSizes.body, maxWidth: mainColWidth });
                    });
                }
                yMain += lineHeights.body * 1.2; 
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
                yMain += lineHeights.body * 1.2; 
            });
        }
        doc.save(`${fullName.replace(/\s+/g, '_')}_CN_AI_Resume.pdf`);
    }

    async function generateDocxResume(resumeData) {
        const { fullName, userPromptText, parsedSections } = resumeData;
        const targetJobTitleUser = userPromptText.split('\n')[0].trim();

        // Note: showLoadingState(true, "Generating DOCX...") will be called by the main event handler
        const newNameHeaderHeight = 30; // Value for conceptual spacing, not direct drawing height here

        try {
            const { Document, Packer, Paragraph, TextRun, AlignmentType, ShadingType, Table, TableCell, TableRow, WidthType, BorderStyle, VerticalAlign, TabStopType, TabStopPosition, convertInchesToTwip } = docx;

            const docChildren = []; 

            const headerContentParagraphs = [];
            headerContentParagraphs.push(new Paragraph({
                children: [new TextRun({ text: fullName.toUpperCase(), bold: true, size: 44, font: "Helvetica" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 } 
            }));
            if (targetJobTitleUser && fullName.toLowerCase() !== targetJobTitleUser.toLowerCase()) {
                headerContentParagraphs.push(new Paragraph({
                    children: [new TextRun({ text: targetJobTitleUser.toUpperCase(), size: 20, color: "5f6368", font: "Helvetica" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }));
            }

            const headerTable = new Table({
                rows: [ new TableRow({
                        children: [ new TableCell({
                                children: headerContentParagraphs,
                                shading: { type: ShadingType.SOLID, color: "f0f0f0", fill: "f0f0f0" },
                                margins: { top: convertInchesToTwip(0.3), bottom: convertInchesToTwip(0.3) },
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                }
                            }),
                        ],
                    }),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
            });
            docChildren.push(headerTable);
            docChildren.push(new Paragraph({ spacing: { after: convertInchesToTwip(0.2) } }));


            const addDocxSectionTitle = (titleText) => { 
                const titleElements = [];
                titleElements.push(new Paragraph({
                    children: [new TextRun({ text: titleText.toUpperCase(), bold: true, size: 24, color: "2c3e50", font: "Helvetica" })],
                    spacing: { before: 300, after: 100 } 
                }));
                titleElements.push(new Paragraph({ 
                    border: { bottom: { color: "3498db", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                    spacing: { after: 250 }
                }));
                return titleElements;
            };
            
            const sidebarChildren = [];
            if (parsedSections.CONTACT_INFO) { 
                sidebarChildren.push(...addDocxSectionTitle("CONTACT"));
                parsedSections.CONTACT_INFO.split('\n').map(s => s.trim()).filter(s => s).forEach(item => {
                    sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: item, size: 18, font: "Helvetica" })], spacing: {after: 100} }));
                });
            }
            if (parsedSections.EDUCATION_PARSED && parsedSections.EDUCATION_PARSED.length > 0) { 
                sidebarChildren.push(...addDocxSectionTitle("EDUCATION"));
                parsedSections.EDUCATION_PARSED.forEach(edu => {
                    if(edu.degree) sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true, size: 20, font: "Helvetica" })], spacing: {after: 70} }));
                    if(edu.university) sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: edu.university, size: 19, font: "Helvetica" })], spacing: {after: 70} }));
                    if (edu.location) sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: edu.location, size: 18, color: "5f6368", font: "Helvetica" })], spacing: {after: 70} }));
                    if (edu.year) sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: edu.year, size: 18, color: "5f6368", font: "Helvetica" })], spacing: {after: 70} }));
                    if (edu.gpa) sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: `GPA: ${edu.gpa}`, size: 18, color: "5f6368", font: "Helvetica" })], spacing: {after: 70} }));
                    sidebarChildren.push(new Paragraph({ spacing: { after: 150 } }));
                });
            }
            if (parsedSections.SKILLS) { 
                sidebarChildren.push(...addDocxSectionTitle("SKILLS"));
                parsedSections.SKILLS.split('\n').map(s => s.trim()).filter(s => s && s.startsWith("-")).forEach(skill => {
                    sidebarChildren.push(new Paragraph({ children: [new TextRun({ text: skill.substring(1).trim(), size: 19, font: "Helvetica" })], bullet: { level: 0 }, spacing: {after: 100} }));
                });
            }

            const mainContentChildren = [];
            if (parsedSections.SUMMARY) { 
                mainContentChildren.push(...addDocxSectionTitle("SUMMARY"));
                mainContentChildren.push(new Paragraph({ children: [new TextRun({ text: parsedSections.SUMMARY, size: 19, font: "Helvetica" })], spacing: {after: 150} }));
            }
            if (parsedSections.EXPERIENCE_PARSED && parsedSections.EXPERIENCE_PARSED.length > 0) { 
                mainContentChildren.push(...addDocxSectionTitle("EXPERIENCE"));
                parsedSections.EXPERIENCE_PARSED.forEach(job => {
                    if(job.title) mainContentChildren.push(new Paragraph({ children: [new TextRun({ text: job.title, bold: true, size: 20, font: "Helvetica" })], spacing: {after: 70} }));
                    const companyLineText = `${job.company || "Company Name"}${job.location ? ` - ${job.location}` : ''}`;
                    const companyDateChildren = [new TextRun({ text: companyLineText, size: 18, color: "5f6368", italics: true, font: "Helvetica" })];
                    if (job.dates) {
                        companyDateChildren.push(new TextRun({children: [new docx.Tab()]})); 
                        companyDateChildren.push(new TextRun({ text: job.dates, size: 18, color: "5f6368", italics: true, font: "Helvetica" }));
                    }
                    mainContentChildren.push(new Paragraph({ 
                        children: companyDateChildren,
                        tabStops: job.dates ? [{type: TabStopType.RIGHT, position: TabStopPosition.MAX }] : [],
                        spacing: {after: 100}
                    }));
                    if (job.bullets && job.bullets.length > 0) {
                        job.bullets.forEach(bullet => {
                            mainContentChildren.push(new Paragraph({ children: [new TextRun({ text: bullet, size: 19, font: "Helvetica" })], bullet: { level: 0 }, spacing: {after: 100} }));
                        });
                    }
                    mainContentChildren.push(new Paragraph({ spacing: { after: 150 } }));
                });
            }
            if (parsedSections.PROJECTS) { 
                mainContentChildren.push(...addDocxSectionTitle("PROJECTS"));
                const projectItems = parsedSections.PROJECTS.split(/####ITEM_START####|####ITEM_END####/).map(s => s.trim()).filter(s => s);
                 projectItems.forEach(item => {
                    const lines = item.split('\n');
                    lines.forEach((line, idx) => {
                        const isBulletItem = (idx > 0 && (line.startsWith("- ") || line.startsWith("* ")));
                        const textRunOptions = { text: isBulletItem ? line.substring(1).trim() : line, size: (idx === 0 && !isBulletItem) ? 20 : 19, bold: (idx === 0 && !isBulletItem), font: "Helvetica"};
                        mainContentChildren.push(new Paragraph({ children: [new TextRun(textRunOptions)], bullet: isBulletItem ? { level: 0 } : undefined, spacing: {after: 100} }));
                    });
                    mainContentChildren.push(new Paragraph({ spacing: { after: 150 } }));
                });
            }

            const contentTable = new Table({
                columnWidths: [35, 65], 
                rows: [ new TableRow({
                        children: [
                            new TableCell({ children: sidebarChildren, verticalAlign: VerticalAlign.TOP, borders: { right: {style: BorderStyle.SINGLE, size: 4, color: "cccccc"} } }),
                            new TableCell({ children: mainContentChildren, verticalAlign: VerticalAlign.TOP, margins: {left: convertInchesToTwip(0.15)} })
                        ],
                    }),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
            });
            docChildren.push(contentTable);

            const doc = new Document({
                creator: "Cendien AI Resume Generator",
                title: `${fullName} Resume`,
                styles: { default: { document: { run: { font: "Helvetica", size: 22 } } } },
                sections: [{
                    properties: {
                        page: { margin: { top: convertInchesToTwip(0.5), right: convertInchesToTwip(0.75), bottom: convertInchesToTwip(0.75), left: convertInchesToTwip(0.75) } },
                    },
                    children: docChildren 
                }],
            });

            console.log("DOCX document object created, attempting to pack...");
            Packer.toBlob(doc).then(blob => {
                console.log("Blob created successfully, attempting to save...");
                saveAs(blob, `${fullName.replace(/\s+/g, '_')}_CN_AI_Resume.docx`);
                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">DOCX generated successfully!</p>`;
            }).catch(err => {
                console.error("Error packing or saving DOCX:", err);
                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error creating DOCX: ${err.message}</p>`;
                throw err; 
            });

        } catch (error) {
            console.error("Error preparing DOCX data:", error);
            resumeStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error preparing DOCX: ${error.message}</p>`;
            throw error; 
        }
    }

    // Updated Event Listener for the single "Generate & Download" button
    if (resumeForm) {
        resumeForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Crucial: Prevent default form submission

            const outputFormat = document.getElementById('outputFormat').value;
            let resumeData;
            let pdfSuccess = false;
            let docxSuccess = false;
            let mainError = null;

            try {
                resumeData = await getResumeData(); // Handles its own "Generating content..." message

                if (resumeData) {
                    if (outputFormat === 'pdf' || outputFormat === 'both') {
                        showLoadingState(true, "Generating PDF...");
                        try {
                            await generatePdfResume(resumeData);
                            pdfSuccess = true;
                        } catch (pdfError) {
                            console.error('Error generating PDF:', pdfError);
                            mainError = pdfError; // Store the error
                            resumeStatusArea.innerHTML = `<p class="loading-text" style="color:red;">Error generating PDF: ${pdfError.message}</p>`;
                        }
                    }
                    if (outputFormat === 'docx' || outputFormat === 'both') {
                        // If PDF failed and we only wanted PDF, or if PDF succeeded and we also want DOCX
                        if (!mainError || outputFormat === 'both' || outputFormat === 'docx') {
                             showLoadingState(true, "Generating DOCX...");
                            try {
                                await generateDocxResume(resumeData); // This now sets its own success/error for DOCX
                                docxSuccess = true;
                            } catch (docxError) {
                                console.error('Error generating DOCX:', docxError);
                                mainError = docxError; // Store or update the error
                                // generateDocxResume already updates resumeStatusArea for its specific error
                            }
                        }
                    }

                    // Final status message based on outcomes
                    if (!mainError) {
                        if (outputFormat === 'pdf' && pdfSuccess) {
                            resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">PDF generated successfully!</p>`;
                        } else if (outputFormat === 'docx' && docxSuccess) {
                            // DOCX success message is handled within generateDocxResume, avoid double message
                            if (!resumeStatusArea.textContent.includes("DOCX generated successfully")) {
                                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">DOCX generated successfully!</p>`;
                            }
                        } else if (outputFormat === 'both' && pdfSuccess && docxSuccess) {
                            resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">PDF and DOCX generated successfully!</p>`;
                        } else if (outputFormat === 'both' && (pdfSuccess || docxSuccess)) {
                            // Handle partial success if one failed but was reported by its function
                            if (!resumeStatusArea.textContent.includes("Error")) { // If no error was specifically set by a failing part
                                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:orange;">Partial success. Check downloads.</p>`;
                            }
                        }
                    } else {
                        // An error occurred, message should already be set by the failing function or the outer catch
                        if (!resumeStatusArea.textContent.includes("Error")) { // Fallback
                             resumeStatusArea.innerHTML = `<p class="loading-text" style="color:red;">An error occurred: ${mainError.message}</p>`;
                        }
                    }
                }
            } catch (error) { // Catch errors from getResumeData or unexpected errors
                console.error('Error processing resume generation:', error);
                if (!resumeStatusArea.textContent.includes("Error")) {
                     resumeStatusArea.innerHTML = `<p class="loading-text" style="color:red;">An error occurred: ${error.message}</p>`;
                }
            } finally {
                showLoadingState(false); // Re-enable button, hide generic spinner
                if (resumeData || resumeStatusArea.textContent) { 
                    hideStatusArea(5000); 
                } else {
                    hideStatusArea(0); 
                }
            }
        });
    } else {
        console.error("Resume form (#resume-details-form) not found. Event listener not attached.");
    }
});
