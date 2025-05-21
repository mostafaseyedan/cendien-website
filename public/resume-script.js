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

// --- Define Layout & Styles ---
const leftMargin = 15;
const rightMargin = 15;
const topMargin = 15; // Start a bit lower for the name
const bottomMargin = 20;
const usableWidth = pageWidth - leftMargin - rightMargin;

// For a single-column layout initially to fix overlapping, then we can re-introduce columns carefully.
// Let's simplify to a single column first to ensure text flow is correct.
const currentX = leftMargin;
const currentMaxWidth = usableWidth;

let yPosition = topMargin;

const fontConfig = {
    name: "helvetica",
    nameBold: "helvetica", // jsPDF uses "helvetica-bold"
    titleSize: 18,
    subtitleSize: 11,
    headingSize: 12,
    subHeadingSize: 10,
    bodySize: 9.5, // Slightly larger body for better readability
    smallSize: 8.5,
    lineHeightFactor: 1.45, // Increased for more space
};

const colors = {
    primary: "#102E4A", // Darker Professional Blue
    text: "#333333",
    lightText: "#5f6368",
    line: "#cccccc", // Lighter line
};

function calculateLineHeight(fontSize) {
    return fontSize * 0.352777 * fontConfig.lineHeightFactor;
}

function checkAndAddPage(neededHeight) {
    if (yPosition + neededHeight > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = topMargin;
        return true; // Page was added
    }
    return false; // No page added
}

function addWrappedText(text, x, maxWidth, options = {}) {
    const fontSize = options.fontSize || fontConfig.bodySize;
    const fontStyle = options.fontStyle || "normal";
    const color = options.color || colors.text;
    const isBullet = options.isBullet || false;
    const bulletChar = "•";
    const bulletIndent = 4; // Indent for text part of bullet

    doc.setFontSize(fontSize);
    doc.setFont(fontConfig.name, fontStyle);
    doc.setTextColor(color);

    let textToPrint = text;
    let printX = x;
    let textMaxWidth = maxWidth;
    const singleLineHeight = calculateLineHeight(fontSize);

    if (isBullet) {
        printX = x + bulletIndent;
        textToPrint = text.startsWith('- ') ? text.substring(2) : (text.startsWith('* ') ? text.substring(2) : text);
        textMaxWidth = maxWidth - bulletIndent;
        checkAndAddPage(singleLineHeight);
        doc.text(bulletChar, x, yPosition); // Draw bullet at current y
    }

    const lines = doc.splitTextToSize(textToPrint, textMaxWidth);
    lines.forEach((line, index) => {
        if (index > 0 || !isBullet) { // For subsequent lines of a bullet, or non-bullet lines
             checkAndAddPage(singleLineHeight);
        }
        doc.text(line, printX, yPosition);
        yPosition += singleLineHeight;
    });
}

function addSectionHeading(title) {
    const headingLineHeight = calculateLineHeight(fontConfig.headingSize);
    yPosition += 3; // Space before section heading
    checkAndAddPage(headingLineHeight * 2); // Space for heading and underline
    
    doc.setFont(fontConfig.nameBold, "bold");
    doc.setFontSize(fontConfig.headingSize);
    doc.setTextColor(colors.primary);
    doc.text(title.toUpperCase(), currentX, yPosition);
    yPosition += headingLineHeight -1; // Adjust for underline position
    
    doc.setDrawColor(colors.line);
    doc.setLineWidth(0.2);
    doc.line(currentX, yPosition, currentX + currentMaxWidth, yPosition); // Full width line
    yPosition += 5; // Space after heading and line
}

// --- Parse AI Text (from previous script) ---
const parsedSections = {};
const sectionRegexGlobal = /###([A-Z_]+)_START###\n?([\s\S]*?)\n?###\1_END###/g;
let matchGlobal;
while ((matchGlobal = sectionRegexGlobal.exec(resumeText)) !== null) {
    parsedSections[matchGlobal[1]] = matchGlobal[2].trim();
}

if (parsedSections.EXPERIENCE) {
    const jobs = [];
    const jobRegex = /####JOB_START####\n?([\s\S]*?)\n?####JOB_END####/g;
    let jobMatch;
    while ((jobMatch = jobRegex.exec(parsedSections.EXPERIENCE)) !== null) {
        const jobDetails = { title: '', company: '', location: '', dates: '', bullets: [] };
        const jobLines = jobMatch[1].trim().split('\n');
        jobLines.forEach(line => {
            if (line.startsWith("Job Title:")) jobDetails.title = line.substring("Job Title:".length).trim();
            else if (line.startsWith("Company:")) jobDetails.company = line.substring("Company:".length).trim();
            else if (line.startsWith("Location:")) jobDetails.location = line.substring("Location:".length).trim();
            else if (line.startsWith("Dates:")) jobDetails.dates = line.substring("Dates:".length).trim();
            else if (line.startsWith("- ") || line.startsWith("* ")) {
                jobDetails.bullets.push(line.trim());
            } else if (line.trim()) { // Capture other lines as part of description if not bullets
                 jobDetails.bullets.push(line.trim()); // Treat as a descriptive line
            }
        });
        jobs.push(jobDetails);
    }
    parsedSections.EXPERIENCE_PARSED = jobs;
}
if (parsedSections.EDUCATION) {
    const degrees = [];
    const degreeRegex = /####DEGREE_START####\n?([\s\S]*?)\n?####DEGREE_END####/g;
    let degreeMatch;
    while ((degreeMatch = degreeRegex.exec(parsedSections.EDUCATION)) !== null) {
        const degreeDetails = { degree: '', university: '', location: '', year: '', gpa: '' };
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


// --- RENDER PDF CONTENT (Simplified Single Column for now) ---

// 1. Name (Large, Centered)
doc.setFont(fontConfig.nameBold, "bold");
doc.setFontSize(fontConfig.titleSize);
doc.setTextColor(colors.primary);
const nameText = fullName.toUpperCase();
const nameWidth = doc.getStringUnitWidth(nameText) * doc.getFontSize() / doc.internal.scaleFactor;
doc.text(nameText, (pageWidth - nameWidth) / 2, yPosition);
yPosition += calculateLineHeight(fontConfig.titleSize);

// 2. Contact Info (Centered or Full Width Line)
if (parsedSections.CONTACT_INFO) {
    const contactLines = parsedSections.CONTACT_INFO.split('\n').map(l => l.trim()).filter(l => l);
    const contactText = contactLines.join(' | ');
    doc.setFont(fontConfig.name, "normal");
    doc.setFontSize(fontConfig.subtitleSize -1); // Slightly smaller for contact
    doc.setTextColor(colors.lightText);
    const contactWidth = doc.getStringUnitWidth(contactText) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition);
    yPosition += calculateLineHeight(fontConfig.subtitleSize -1) + 2;
}

// Horizontal Line
doc.setDrawColor(colors.line);
doc.setLineWidth(0.3);
doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
yPosition += 5;

// Render sections in desired order
const renderOrder = ["SUMMARY", "SKILLS", "EXPERIENCE", "EDUCATION", "PROJECTS"]; // Add more if AI generates them

renderOrder.forEach(sectionKey => {
    if (sectionKey === "EXPERIENCE" && parsedSections.EXPERIENCE_PARSED) {
        addSectionHeading("EXPERIENCE");
        parsedSections.EXPERIENCE_PARSED.forEach(job => {
            checkAndAddPage(calculateLineHeight(fontConfig.subHeadingSize) * 2); // Space for title & company
            addWrappedText(job.title || "Job Title", currentX, currentMaxWidth, { fontSize: fontConfig.subHeadingSize, fontStyle: "bold" });
            
            let companyDateLine = (job.company || "Company Name");
            if (job.location) companyDateLine += `, ${job.location}`;
            if (job.dates) companyDateLine += ` (${job.dates})`;
            addWrappedText(companyDateLine, currentX, currentMaxWidth, { fontSize: fontConfig.smallSize, fontStyle: "italic", color: colors.lightText });
            yPosition += 1; // Small space

            if (job.bullets) {
                job.bullets.forEach(bullet => {
                    addWrappedText(bullet, currentX, currentMaxWidth, { isBullet: true, fontSize: fontConfig.bodySize });
                });
            }
            yPosition += calculateLineHeight(fontConfig.bodySize) * 0.5; // Space after job entry
        });
    } else if (sectionKey === "EDUCATION" && parsedSections.EDUCATION_PARSED) {
        addSectionHeading("EDUCATION");
        parsedSections.EDUCATION_PARSED.forEach(edu => {
            checkAndAddPage(calculateLineHeight(fontConfig.subHeadingSize) * 2);
            addWrappedText(edu.degree || "Degree", currentX, currentMaxWidth, { fontSize: fontConfig.subHeadingSize, fontStyle: "bold" });
            addWrappedText(edu.university || "University Name", currentX, currentMaxWidth, { fontSize: fontConfig.bodySize });
            if(edu.location) addWrappedText(edu.location, currentX, currentMaxWidth, { fontSize: fontConfig.smallSize, color: colors.lightText });
            if(edu.year) addWrappedText(edu.year, currentX, currentMaxWidth, { fontSize: fontConfig.smallSize, color: colors.lightText });
            if(edu.gpa) addWrappedText(`GPA: ${edu.gpa}`, currentX, currentMaxWidth, { fontSize: fontConfig.smallSize, color: colors.lightText });
            yPosition += calculateLineHeight(fontConfig.bodySize) * 0.5;
        });
    } else if (sectionKey === "SKILLS" && parsedSections.SKILLS) {
        addSectionHeading("SKILLS");
        const skillsList = parsedSections.SKILLS.split('\n').map(s => s.trim()).filter(s => s);
        // Try a more compact skill listing, perhaps in two pseudo-columns if short
        // For now, simple list:
        skillsList.forEach(skill => {
            addWrappedText(skill, currentX, currentMaxWidth, { isBullet: (skill.startsWith("- ") || skill.startsWith("* ")), fontSize: fontConfig.bodySize });
        });
         yPosition += calculateLineHeight(fontConfig.bodySize) * 0.5;
    } else if (parsedSections[sectionKey]) { // For SUMMARY, PROJECTS, etc.
        addSectionHeading(sectionKey);
        // Assuming these are paragraph style from AI
        const contentParas = parsedSections[sectionKey].split('\n').map(s => s.trim()).filter(s => s);
        contentParas.forEach(para => {
            addWrappedText(para, currentX, currentMaxWidth, { fontSize: fontConfig.bodySize });
             yPosition += calculateLineHeight(fontConfig.bodySize) * 0.25; // Small space between paragraphs in a section
        });
         yPosition += calculateLineHeight(fontConfig.bodySize) * 0.5; // Space after section
    }
});
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
