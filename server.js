const express = require('express');
const path = require('path');
const { Firestore, Timestamp } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Firestore({
    projectId: process.env.GCLOUD_PROJECT || 'cendien-sales-support-ai',
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


const RFP_PROMPT_DEFAULTS_FROM_CLIENT = { // You might want to manage defaults server-side too
    summary: "1. A concise summary of the RFP.",
    questions: "2. A list of 5 to 15 critical and insightful clarification questions based on the RFP.",
    deadlines: "3. Key Deadlines.",
    submissionFormat: "4. Submission Format (Mail, Email, Portal, site address, etc.).",
    requirements: "5. A list of Requirements (e.g., mandatory, highly desirable).",
    stakeholders: "6. Mentioned Stakeholders or Key Contacts.",
    risks: "7. Potential Risks or Red Flags identified in the RFP.",
    registration: "8. Registration requirements or details for bidders.",
    licenses: "9. Required Licenses or Certifications for bidders.",
    budget: "10. Any mentioned Budget constraints or financial information."
};
const PROMPT_SETTINGS_DOC_ID = 'globalRfpPrompts'; // Single document to store all prompts

// Endpoint to get RFP prompt settings
app.get('/api/rfp-prompt-settings', async (req, res) => {
    try {
        const docRef = db.collection('promptSettings').doc(PROMPT_SETTINGS_DOC_ID);
        const doc = await docRef.get();

        if (!doc.exists) {
            // If no settings found, return defaults (and optionally save them)
            // For simplicity, just returning client-known defaults if not found.
            // Or, you could save RFP_PROMPT_DEFAULTS_FROM_CLIENT here for future GETs.
            console.log('No RFP prompt settings found in Firestore, returning client-side defaults expectation.');
            res.status(200).json({ prompts: RFP_PROMPT_DEFAULTS_FROM_CLIENT, source: 'default' });
        } else {
            res.status(200).json({ prompts: doc.data(), source: 'firestore' });
        }
    } catch (error) {
        console.error('Error retrieving RFP prompt settings:', error);
        res.status(500).json({ error: 'Failed to retrieve RFP prompt settings.', details: error.message });
    }
});

// Endpoint to save/update RFP prompt settings
app.post('/api/rfp-prompt-settings', async (req, res) => {
    try {
        const { prompts } = req.body;
        if (!prompts || typeof prompts !== 'object') {
            return res.status(400).json({ error: 'Invalid prompts data. Expecting an object.' });
        }

        // Validate that all expected keys are present, or handle partial updates if desired
        const expectedKeys = Object.keys(RFP_PROMPT_DEFAULTS_FROM_CLIENT);
        for (const key of expectedKeys) {
            if (typeof prompts[key] !== 'string') {
                 return res.status(400).json({ error: `Invalid or missing prompt for section: ${key}` });
            }
        }

        const docRef = db.collection('promptSettings').doc(PROMPT_SETTINGS_DOC_ID);
        await docRef.set(prompts, { merge: true }); // Use merge: true if you want to allow partial updates, or just set() to overwrite
        
        console.log('RFP prompt settings saved with ID:', PROMPT_SETTINGS_DOC_ID);
        res.status(200).json({ message: 'RFP prompt settings saved successfully.', prompts });
    } catch (error) {
        console.error('Error saving RFP prompt settings:', error);
        res.status(500).json({ error: 'Failed to save RFP prompt settings.', details: error.message });
    }
});



// API Endpoint to communicate with Gemini
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is not set.');
        return res.status(500).json({ error: 'API key not configured on server.' });
    }
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
        console.log(`Received prompt for Gemini. Sending... (Prompt length: ${prompt.length})`);
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const responseDataText = await geminiResponse.text();
        let data;
        try {
            data = JSON.parse(responseDataText);
        } catch (e) {
            console.error('Error parsing Gemini API response as JSON. Raw response text:', responseDataText.substring(0, 500));
            return res.status(500).json({ error: 'Error parsing response from Gemini API.', details: responseDataText.substring(0, 500) });
        }
        if (!geminiResponse.ok) {
            console.error('Gemini API Error - Status:', geminiResponse.status, 'Response:', JSON.stringify(data, null, 2));
            const errorMessage = data.error?.message || `Gemini API request failed with status ${geminiResponse.status}`;
            return res.status(geminiResponse.status).json({ error: errorMessage, details: data });
        }
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            res.json({ generatedText: data.candidates[0].content.parts[0].text });
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            const blockMessage = `Prompt blocked by Gemini API. Reason: ${data.promptFeedback.blockReason}.`;
            console.warn(blockMessage, data.promptFeedback.safetyRatings);
            res.status(400).json({ error: blockMessage, details: data.promptFeedback.safetyRatings });
        } else if (data.error) {
            console.error('Gemini API returned an error structure:', JSON.stringify(data.error, null, 2));
            res.status(500).json({ error: `Error from Gemini API: ${data.error.message}`, details: data.error });
        } else {
            console.warn('Unexpected Gemini API response structure:', JSON.stringify(data, null, 2));
            res.status(500).json({ error: 'Could not parse the expected text from Gemini API response.' });
        }
    } catch (error) {
        console.error('Internal server error calling Gemini API:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// RFP Analysis Endpoints
app.post('/api/rfp-analysis', async (req, res) => {
    try {
        const {
            rfpFileName, rfpSummary, generatedQuestions, status,
            rfpDeadlines, rfpKeyRequirements, rfpStakeholders, rfpRisks,
            rfpTitle, rfpType, submittedBy,
            rfpSubmissionFormat, rfpRegistration, rfpLicenses, rfpBudget,
            analysisPrompts
        } = req.body;

        if (!rfpFileName || !rfpSummary || !generatedQuestions) {
            return res.status(400).json({ error: 'Missing required fields for basic analysis: rfpFileName, rfpSummary, generatedQuestions' });
        }

        const analysisData = {
            rfpFileName,
            rfpSummary,
            generatedQuestions,
            rfpDeadlines: rfpDeadlines || "Not specified",
            rfpKeyRequirements: rfpKeyRequirements || "Not specified",
            rfpStakeholders: rfpStakeholders || "Not specified",
            rfpRisks: rfpRisks || "Not specified",
            analysisDate: Timestamp.now(),
            status: status || 'analyzed',
            rfpTitle: rfpTitle || "",
            rfpType: rfpType || "N/A",
            submittedBy: submittedBy || "N/A",
            rfpSubmissionFormat: rfpSubmissionFormat || "Not specified",
            rfpRegistration: rfpRegistration || "Not specified",
            rfpLicenses: rfpLicenses || "Not specified",
            rfpBudget: rfpBudget || "Not specified",
            analysisPrompts: analysisPrompts || {}
        };

        const docRef = await db.collection('rfpAnalyses').add(analysisData);
        console.log('RFP Analysis saved with ID:', docRef.id);
        res.status(201).json({ id: docRef.id, message: 'RFP analysis saved successfully.', ...analysisData });
    } catch (error) {
        console.error('Error saving RFP analysis:', error);
        res.status(500).json({ error: 'Failed to save RFP analysis.', details: error.message });
    }
});

// Endpoint to update RFP status (kept for potentially quick status updates from list view if needed)
app.put('/api/rfp-analysis/:id/status', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'New status is required.' });
        }
        // *** UPDATED: Added "archived" to valid statuses ***
        const validStatuses = ['active', 'not_pursuing', 'analyzed', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
        }

        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'RFP analysis not found.' });
        }

        await docRef.update({ status: status, lastModified: Timestamp.now() });
        console.log('RFP Analysis status updated for ID:', analysisId, 'New Status:', status);
        res.status(200).json({ id: analysisId, message: 'RFP status updated successfully.', newStatus: status }); // Return newStatus
    } catch (error) {
        console.error('Error updating RFP status:', error);
        res.status(500).json({ error: 'Failed to update RFP status.', details: error.message });
    }
});

// Endpoint to update RFP title (kept for potentially quick title updates if needed)
app.put('/api/rfp-analysis/:id/title', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const { rfpTitle } = req.body;

        if (typeof rfpTitle !== 'string') {
            return res.status(400).json({ error: 'New rfpTitle is required and must be a string.' });
        }

        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'RFP analysis not found.' });
        }

        await docRef.update({ rfpTitle: rfpTitle, lastModified: Timestamp.now() });
        console.log('RFP Analysis title updated for ID:', analysisId, 'New Title:', rfpTitle);
        res.status(200).json({ id: analysisId, message: 'RFP title updated successfully.', newRfpTitle: rfpTitle }); // Return newRfpTitle
    } catch (error) {
        console.error('Error updating RFP title:', error);
        res.status(500).json({ error: 'Failed to update RFP title.', details: error.message });
    }
});

// *** NEW: Endpoint to update multiple details of an RFP analysis ***
app.put('/api/rfp-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'RFP analysis not found.' });
        }

        const updates = {};
        const allowedFieldsToUpdate = [
            'rfpTitle', 'rfpType', 'submittedBy', 'status',
            'rfpSummary', 'generatedQuestions', 'rfpDeadlines', 'rfpSubmissionFormat',
            'rfpKeyRequirements', 'rfpStakeholders', 'rfpRisks',
            'rfpRegistration', 'rfpLicenses', 'rfpBudget'
        ];
        const validStatuses = ['active', 'not_pursuing', 'analyzed', 'archived'];

        for (const field of allowedFieldsToUpdate) {
            if (req.body.hasOwnProperty(field)) {
                if (field === 'status' && !validStatuses.includes(req.body[field])) {
                    return res.status(400).json({ error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
                }
                // Add more specific validation per field if needed (e.g., type checks)
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        updates.lastModified = Timestamp.now(); // Always update lastModified timestamp

        await docRef.update(updates);
        console.log('RFP Analysis updated for ID:', analysisId, 'Data:', updates);
        const updatedDoc = await docRef.get(); // Get the updated document to return
        res.status(200).json({ id: updatedDoc.id, message: 'RFP analysis updated successfully.', ...updatedDoc.data() });

    } catch (error) {
        console.error('Error updating RFP analysis details:', error);
        res.status(500).json({ error: 'Failed to update RFP analysis details.', details: error.message });
    }
});


// Endpoint to delete an RFP analysis
app.delete('/api/rfp-analysis/:id', async (req, res) => {
    // ... (no changes from original)
    try {
        const analysisId = req.params.id;
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'RFP analysis not found.' });
        }

        await docRef.delete();
        console.log('RFP Analysis deleted with ID:', analysisId);
        res.status(200).json({ id: analysisId, message: 'RFP analysis deleted successfully.' });
    } catch (error) {
        console.error('Error deleting RFP analysis:', error);
        res.status(500).json({ error: 'Failed to delete RFP analysis.', details: error.message });
    }
});


app.get('/api/rfp-analyses', async (req, res) => {
    // ... (no changes from original)
    try {
        const analysesSnapshot = await db.collection('rfpAnalyses')
                                        .orderBy('analysisDate', 'desc')
                                        .get();
        if (analysesSnapshot.empty) {
            return res.status(200).json([]);
        }
        const analyses = [];
        analysesSnapshot.forEach(doc => {
            analyses.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(analyses);
    } catch (error) {
        console.error('Error retrieving RFP analyses:', error);
        res.status(500).json({ error: 'Failed to retrieve RFP analyses.', details: error.message });
    }
});

app.get('/api/rfp-analysis/:id', async (req, res) => {
    // ... (no changes from original)
    try {
        const analysisId = req.params.id;
        if (!analysisId) {
            return res.status(400).json({ error: 'Analysis ID is required.' });
        }
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'RFP analysis not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error retrieving specific RFP analysis:', error);
        res.status(500).json({ error: 'Failed to retrieve RFP analysis.', details: error.message });
    }
});

// Fallback for SPA
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Cendien agency website server listening on port ${PORT}.`);
    console.log(`Access it at http://localhost:${PORT}`);
});
