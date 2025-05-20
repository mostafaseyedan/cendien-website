document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-details-form');
    const generateButton = document.getElementById('generate-resume-pdf-button');
    const resumeStatusArea = document.getElementById('resume-generation-status');
    const yearSpanResume = document.getElementById('current-year-resume');

    if (yearSpanResume) {
        yearSpanResume.textContent = new Date().getFullYear();
    }

    // Make jsPDF available globally if loaded via CDN
    const { jsPDF } = window.jspdf;

    const showLoadingState = (isLoading, message = "Generating your resume PDF...") => {
        if (!resumeStatusArea) return;
        if (isLoading) {
            resumeStatusArea.style.display = 'flex'; // Use flex from .loading-container
            resumeStatusArea.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>`;
            if(generateButton) generateButton.disabled = true;
        } else {
            // Let success/error messages override or clear
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
            const userPrompt = document.getElementById('resumePrompt').value.trim();

            if (!fullName || !userPrompt) {
                alert('Please fill in both Full Name and the Resume Prompt.');
                return;
            }

            showLoadingState(true, "Generating resume content with AI...");

            const promptForResumeAI = `
Generate the complete text content for a professional resume.
The resume is for: ${fullName}.
The user's primary prompt, target role, or key details are: "${userPrompt}".

Based on this, create comprehensive resume text. Structure the response with clear section headings using ALL CAPS (e.g., SUMMARY, SKILLS, EXPERIENCE, EDUCATION, PROJECTS if applicable).
For each section:
- CONTACT INFORMATION: Include the Full Name: ${fullName}. Add placeholder professional email (e.g., ${fullName.split(' ').join('.').toLowerCase()}@email.com), phone (e.g., (555) 123-4567), and LinkedIn profile URL (e.g., linkedin.com/in/${fullName.split(' ').join('').toLowerCase()}).
- SUMMARY: A concise (3-4 sentences) impactful professional summary tailored to the prompt.
- SKILLS: A list of relevant technical and soft skills (use simple hyphens '-' or asterisks '*' for bullet points if generating a list here, with each skill on a new line).
- EXPERIENCE: For each plausible job role (infer or create 2-3 roles if not detailed in the prompt, relevant to the target role), list the company (can be generic like "Tech Solutions Inc." or "Global Corp"), role title, dates (e.g., "May 2018 - Present"), and 3-4 bullet points describing key responsibilities and quantifiable achievements (use action verbs; use simple hyphens '-' or asterisks '*' for bullet points, each on a new line).
- EDUCATION: List relevant degrees, institutions, and graduation years (can be placeholders if not specified, e.g., "Relevant University - M.S. in Relevant Field - 2016").
- PROJECTS (Optional, if relevant to the prompt, e.g., for a developer or portfolio-based role): Include 1-2 project descriptions with 2-3 bullet points for contributions, each bullet starting with '-' or '*'.

The entire output must be plain text. Use newline characters (\\n) to separate paragraphs, section headings, and bullet points.
Do NOT use any markdown like \`\`\` or HTML tags in your response. The goal is raw, structured text.
Ensure each section heading (like SUMMARY, SKILLS, EXPERIENCE, EDUCATION) is on its own line and in ALL CAPS.
Ensure each bullet point under Skills, Experience, and Projects starts on a new line.
`;

            try {
                const response = await fetch('/api/generate', { // Using your existing backend endpoint
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
                
                showLoadingState(true, "Formatting and preparing PDF...");

                // --- PDF Generation using jsPDF ---
                const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                const margin = 15;
                const usableWidth = pageWidth - 2 * margin;
                let yPosition = margin;
                const defaultLineHeight = 5; // mm for 10pt font
                const headingLineHeight = 7; // mm for 12pt bold font
                const nameLineHeight = 8; // mm for 18pt bold font
                const sectionSpacing = 4; 
                const paragraphSpacing = 2;

                // --- PDF Content Styling ---
                doc.setFont("helvetica", "normal"); // Default font

                // Full Name - Centered, Large, Bold
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                const nameText = fullName.toUpperCase();
                const nameWidth = doc.getStringUnitWidth(nameText) * doc.getFontSize() / doc.internal.scaleFactor;
                doc.text(nameText, (pageWidth - nameWidth) / 2, yPosition);
                yPosition += nameLineHeight;

                // Horizontal line after name
                doc.setLineWidth(0.2);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 5; // Space after line

                const lines = resumeText.split('\n');

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue; // Skip effectively empty lines

                    // Check for Page Break before adding any new line
                    if (yPosition > pageHeight - margin - defaultLineHeight) { 
                        doc.addPage();
                        yPosition = margin;
                    }

                    // Section Headings (ALL CAPS, < 40 chars, not a bullet)
                    if (trimmedLine.length < 40 && trimmedLine === trimmedLine.toUpperCase() && 
                        !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*') && 
                        trimmedLine.length > 2) { // Added length > 2 to avoid tiny ALL CAPS words
                        yPosition += sectionSpacing;
                        if (yPosition > pageHeight - margin - headingLineHeight) { doc.addPage(); yPosition = margin; }
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(12);
                        doc.text(trimmedLine, margin, yPosition);
                        yPosition += headingLineHeight;
                        doc.setLineWidth(0.1); // Thinner line for section underline
                        doc.line(margin, yPosition - (headingLineHeight/2) + 1, margin + usableWidth / 3, yPosition - (headingLineHeight/2) + 1);
                        yPosition += 2; // Space after underline
                    } 
                    // Bullet points
                    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        const bulletContent = trimmedLine.substring(2);
                        const splitBullet = doc.splitTextToSize(`•  ${bulletContent}`, usableWidth - 5); // Indent bullet
                        for (const itemLine of splitBullet) {
                             if (yPosition > pageHeight - margin - defaultLineHeight) { doc.addPage(); yPosition = margin; }
                             doc.text(itemLine, margin + 5, yPosition);
                             yPosition += defaultLineHeight;
                        }
                    } 
                    // Regular paragraph text
                    else { 
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        const splitText = doc.splitTextToSize(trimmedLine, usableWidth);
                        for (const itemLine of splitText) {
                            if (yPosition > pageHeight - margin - defaultLineHeight) { doc.addPage(); yPosition = margin; }
                            doc.text(itemLine, margin, yPosition);
                            yPosition += defaultLineHeight;
                        }
                        yPosition += paragraphSpacing; 
                    }
                }
                
                doc.save(`${fullName.replace(/\s+/g, '_')}_Cendien_AI_Resume.pdf`);
                showLoadingState(false); // Clear loading
                resumeStatusArea.innerHTML = `<p class="loading-text" style="color:green;">PDF generated successfully and download started!</p>`;
                hideStatusArea(5000); // Hide message after 5 seconds


            } catch (error) {
                console.error('Error generating resume PDF:', error);
                showLoadingState(true, `Error: ${error.message}. Please try again.`);
                // setTimeout(hideStatusArea, 7000); // Optional: hide error after a delay
            } finally {
                if(generateButton) generateButton.disabled = false;
            }
        });
    } else {
        console.error("One or more elements for the resume generator are missing.");
    }
});