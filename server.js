const express = require('express');
const path = require('path');
const { Firestore, Timestamp } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Firestore({
    // Ensure your Google Cloud project ID is set correctly,
    // either here or via environment variables (GCLOUD_PROJECT)
    projectId: process.env.GCLOUD_PROJECT || 'cendien-sales-support-ai',
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- RFP Prompt Settings ---
const RFP_PROMPT_SETTINGS_DOC_ID = 'globalRfpPrompts';

app.get('/api/rfp-prompt-settings', async (req, res) => {
    try {
        const docRef = db.collection('promptSettings').doc(RFP_PROMPT_SETTINGS_DOC_ID);
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log('No RFP prompt settings found in Firestore. Client should use local defaults.');
            res.status(200).json({ prompts: {}, source: 'no_settings_in_db' });
        } else {
            res.status(200).json({ prompts: doc.data(), source: 'firestore' });
        }
    } catch (error) {
        console.error('Error retrieving RFP prompt settings:', error);
        res.status(500).json({ error: 'Failed to retrieve RFP prompt settings.', details: error.message });
    }
});

app.post('/api/rfp-prompt-settings', async (req, res) => {
    try {
        const { prompts } = req.body;
        if (!prompts || typeof prompts !== 'object') {
            return res.status(400).json({ error: 'Invalid prompts data. Expecting an object.' });
        }
        const EXPECTED_RFP_PROMPT_KEYS = [
            'summary', 'questions', 'deadlines', 'submissionFormat',
            'requirements', 'stakeholders', 'risks', 'registration',
            'licenses', 'budget'
        ];
        for (const key of EXPECTED_RFP_PROMPT_KEYS) {
            if (!prompts.hasOwnProperty(key) || typeof prompts[key] !== 'string') {
                 return res.status(400).json({ error: `Invalid or missing RFP prompt for section: ${key}.` });
            }
        }
        const docRef = db.collection('promptSettings').doc(RFP_PROMPT_SETTINGS_DOC_ID);
        await docRef.set(prompts, { merge: true });
        console.log('RFP prompt settings saved with ID:', RFP_PROMPT_SETTINGS_DOC_ID);
        res.status(200).json({ message: 'RFP prompt settings saved successfully.', prompts });
    } catch (error) {
        console.error('Error saving RFP prompt settings:', error);
        res.status(500).json({ error: 'Failed to save RFP prompt settings.', details: error.message });
    }
});

// --- FOIA Prompt Settings ---
const FOIA_PROMPT_SETTINGS_DOC_ID = 'globalFoiaPrompts'; // Distinct ID for FOIA prompts

app.get('/api/foia-prompt-settings', async (req, res) => {
    try {
        const docRef = db.collection('promptSettings').doc(FOIA_PROMPT_SETTINGS_DOC_ID); // Using same collection, different doc
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log('No FOIA prompt settings found in Firestore. Client should use local defaults.');
            res.status(200).json({ prompts: {}, source: 'no_settings_in_db' });
        } else {
            res.status(200).json({ prompts: doc.data(), source: 'firestore' });
        }
    } catch (error) {
        console.error('Error retrieving FOIA prompt settings:', error);
        res.status(500).json({ error: 'Failed to retrieve FOIA prompt settings.', details: error.message });
    }
});

app.post('/api/foia-prompt-settings', async (req, res) => {
    try {
        const { prompts } = req.body;
        if (!prompts || typeof prompts !== 'object') {
            return res.status(400).json({ error: 'Invalid FOIA prompts data. Expecting an object.' });
        }
        // Define expected keys based on PROMPT_CONFIG_FOIA from foia-script.js
        const EXPECTED_FOIA_PROMPT_KEYS = [
            'summary', 'questions', 'deadlines', 'submissionFormat',
            'requirements', 'stakeholders', 'risks'
            // Add/remove keys here if PROMPT_CONFIG_FOIA changes
        ];
        for (const key of EXPECTED_FOIA_PROMPT_KEYS) {
            if (!prompts.hasOwnProperty(key) || typeof prompts[key] !== 'string') {
                 return res.status(400).json({ error: `Invalid or missing FOIA prompt for section: ${key}.` });
            }
        }
        const docRef = db.collection('promptSettings').doc(FOIA_PROMPT_SETTINGS_DOC_ID);
        await docRef.set(prompts, { merge: true });
        console.log('FOIA prompt settings saved with ID:', FOIA_PROMPT_SETTINGS_DOC_ID);
        res.status(200).json({ message: 'FOIA prompt settings saved successfully.', prompts });
    } catch (error) {
        console.error('Error saving FOIA prompt settings:', error);
        res.status(500).json({ error: 'Failed to save FOIA prompt settings.', details: error.message });
    }
});


// --- Gemini API Endpoint (Shared) ---
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is not set.');
        return res.status(500).json({ error: 'API key not configured on server.' });
    }
    // Consider making the model name configurable if you plan to use different Gemini models
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
        console.log(`Received prompt for Gemini. Sending... (Prompt length: ${prompt.length})`);
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const responseDataText = await geminiResponse.text(); // Get text first for robust parsing
        let data;
        try {
            data = JSON.parse(responseDataText);
        } catch (e) {
            console.error('Error parsing Gemini API response as JSON. Raw response text (first 500 chars):', responseDataText.substring(0, 500));
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
            console.warn(blockMessage, 'Safety Ratings:', data.promptFeedback.safetyRatings);
            res.status(400).json({ error: blockMessage, details: data.promptFeedback.safetyRatings });
        } else if (data.error) { // Handle explicit error structure from Gemini
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

// --- RFP Analysis Endpoints ---
app.post('/api/rfp-analysis', async (req, res) => {
    try {
        const {
            rfpFileName, rfpSummary, generatedQuestions, status,
            rfpDeadlines, rfpKeyRequirements, rfpStakeholders, rfpRisks,
            rfpTitle, rfpType, submittedBy,
            rfpSubmissionFormat, rfpRegistration, rfpLicenses, rfpBudget,
            analysisPrompts // Prompts used for this specific analysis
        } = req.body;

        if (!rfpFileName || !rfpSummary || !generatedQuestions) {
            return res.status(400).json({ error: 'Missing required fields for RFP analysis.' });
        }
        const analysisData = {
            rfpFileName, rfpSummary, generatedQuestions,
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
            analysisPrompts: analysisPrompts || {} // Store the prompts
        };
        const docRef = await db.collection('rfpAnalyses').add(analysisData);
        console.log('RFP Analysis saved with ID:', docRef.id);
        res.status(201).json({ id: docRef.id, message: 'RFP analysis saved successfully.', ...analysisData });
    } catch (error) {
        console.error('Error saving RFP analysis:', error);
        res.status(500).json({ error: 'Failed to save RFP analysis.', details: error.message });
    }
});

app.put('/api/rfp-analysis/:id/status', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'New status is required.' });
        const validStatuses = ['active', 'not_pursuing', 'analyzed', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'RFP analysis not found.' });
        await docRef.update({ status: status, lastModified: Timestamp.now() });
        res.status(200).json({ id: analysisId, message: 'RFP status updated.', newStatus: status });
    } catch (error) {
        console.error('Error updating RFP status:', error);
        res.status(500).json({ error: 'Failed to update RFP status.', details: error.message });
    }
});

app.put('/api/rfp-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'RFP analysis not found.' });

        const updates = {};
        const allowedRFPFields = [
            'rfpTitle', 'rfpType', 'submittedBy', 'status',
            'rfpSummary', 'generatedQuestions', 'rfpDeadlines', 'rfpSubmissionFormat',
            'rfpKeyRequirements', 'rfpStakeholders', 'rfpRisks',
            'rfpRegistration', 'rfpLicenses', 'rfpBudget'
            // 'analysisPrompts' could be updatable if needed, but usually set at creation.
        ];
        const validStatuses = ['active', 'not_pursuing', 'analyzed', 'archived'];
        for (const field of allowedRFPFields) {
            if (req.body.hasOwnProperty(field)) {
                if (field === 'status' && !validStatuses.includes(req.body[field])) {
                    return res.status(400).json({ error: `Invalid status value.` });
                }
                updates[field] = req.body[field];
            }
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for RFP update.' });
        }
        updates.lastModified = Timestamp.now();
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        res.status(200).json({ id: updatedDoc.id, message: 'RFP analysis updated.', ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating RFP analysis details:', error);
        res.status(500).json({ error: 'Failed to update RFP analysis details.', details: error.message });
    }
});

app.delete('/api/rfp-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'RFP analysis not found.' });
        await docRef.delete();
        res.status(200).json({ id: analysisId, message: 'RFP analysis deleted.' });
    } catch (error) {
        console.error('Error deleting RFP analysis:', error);
        res.status(500).json({ error: 'Failed to delete RFP analysis.', details: error.message });
    }
});

app.get('/api/rfp-analyses', async (req, res) => {
    try {
        const analysesSnapshot = await db.collection('rfpAnalyses').orderBy('analysisDate', 'desc').get();
        const analyses = [];
        analysesSnapshot.forEach(doc => analyses.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(analyses);
    } catch (error) {
        console.error('Error retrieving RFP analyses:', error);
        res.status(500).json({ error: 'Failed to retrieve RFP analyses.', details: error.message });
    }
});

app.get('/api/rfp-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        if (!analysisId) return res.status(400).json({ error: 'RFP Analysis ID is required.' });
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'RFP analysis not found.' });
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error retrieving specific RFP analysis:', error);
        res.status(500).json({ error: 'Failed to retrieve RFP analysis.', details: error.message });
    }
});


// --- FOIA Analysis Endpoints ---
const FOIA_COLLECTION_NAME = 'foiaAnalyses'; // New collection for FOIA

app.post('/api/foia-analysis', async (req, res) => {
    try {
        // Destructure expected fields for FOIA analysis
        const {
            foiaFileNames, // Array of filenames
            foiaSummary,
            generatedQuestionsFoia, // FOIA specific field name for questions
            status,
            foiaDeadlines,         // For dates
            foiaSubmissionFormat,  // For format/channel
            foiaKeyRequirements,   // Key info
            foiaStakeholders,      // Entities/contacts
            foiaRisks,             // Exemptions/redactions
            foiaTitle,
            foiaType,
            submittedBy,
            analysisPrompts        // Prompts used for this specific FOIA analysis
        } = req.body;

        // Basic validation for essential fields
        if (!foiaFileNames || !Array.isArray(foiaFileNames) || foiaFileNames.length === 0 || !foiaSummary || !generatedQuestionsFoia) {
            return res.status(400).json({ error: 'Missing required fields for FOIA analysis: foiaFileNames (array), foiaSummary, generatedQuestionsFoia.' });
        }

        const foiaAnalysisData = {
            foiaFileNames,
            foiaSummary,
            generatedQuestionsFoia,
            foiaDeadlines: foiaDeadlines || "Not specified",
            foiaSubmissionFormat: foiaSubmissionFormat || "Not specified",
            foiaKeyRequirements: foiaKeyRequirements || "Not specified",
            foiaStakeholders: foiaStakeholders || "Not specified",
            foiaRisks: foiaRisks || "Not specified",
            analysisDate: Timestamp.now(),
            status: status || 'analyzed', // Default status
            foiaTitle: foiaTitle || "",   // Optional title
            foiaType: foiaType || "N/A", // Type of FOIA document
            submittedBy: submittedBy || "N/A",
            analysisPrompts: analysisPrompts || {} // Store the prompts used for this analysis
        };

        const docRef = await db.collection(FOIA_COLLECTION_NAME).add(foiaAnalysisData);
        console.log('FOIA Analysis saved with ID:', docRef.id);
        res.status(201).json({ id: docRef.id, message: 'FOIA analysis saved successfully.', ...foiaAnalysisData });
    } catch (error) {
        console.error('Error saving FOIA analysis:', error);
        res.status(500).json({ error: 'Failed to save FOIA analysis.', details: error.message });
    }
});

app.get('/api/foia-analyses', async (req, res) => {
    try {
        const analysesSnapshot = await db.collection(FOIA_COLLECTION_NAME)
                                        .orderBy('analysisDate', 'desc')
                                        .get();
        const analyses = [];
        analysesSnapshot.forEach(doc => {
            analyses.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(analyses);
    } catch (error) {
        console.error('Error retrieving FOIA analyses:', error);
        res.status(500).json({ error: 'Failed to retrieve FOIA analyses.', details: error.message });
    }
});

app.get('/api/foia-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        if (!analysisId) {
            return res.status(400).json({ error: 'FOIA Analysis ID is required.' });
        }
        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'FOIA analysis not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error retrieving specific FOIA analysis:', error);
        res.status(500).json({ error: 'Failed to retrieve FOIA analysis.', details: error.message });
    }
});

app.put('/api/foia-analysis/:id/status', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'New status for FOIA analysis is required.' });
        
        const validStatuses = ['active', 'not_pursuing', 'analyzed', 'archived']; // Consistent statuses
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'FOIA analysis not found.' });

        await docRef.update({ status: status, lastModified: Timestamp.now() });
        res.status(200).json({ id: analysisId, message: 'FOIA analysis status updated.', newStatus: status });
    } catch (error) {
        console.error('Error updating FOIA analysis status:', error);
        res.status(500).json({ error: 'Failed to update FOIA analysis status.', details: error.message });
    }
});

app.put('/api/foia-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'FOIA analysis not found.' });

        const updates = {};
        // Define fields that can be updated for a FOIA analysis
        const allowedFoiaFields = [
            'foiaTitle', 'foiaType', 'submittedBy', 'status',
            'foiaSummary', 'generatedQuestionsFoia', 'foiaDeadlines', 'foiaSubmissionFormat',
            'foiaKeyRequirements', 'foiaStakeholders', 'foiaRisks'
            // 'foiaFileNames' are generally not updated post-creation this way
            // 'analysisPrompts' could be updatable if a re-analysis feature is added.
        ];
        const validStatuses = ['active', 'not_pursuing', 'analyzed', 'archived'];

        for (const field of allowedFoiaFields) {
            if (req.body.hasOwnProperty(field)) {
                 if (field === 'status' && !validStatuses.includes(req.body[field])) {
                    return res.status(400).json({ error: `Invalid status value for FOIA analysis.` });
                }
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for FOIA analysis update.' });
        }
        updates.lastModified = Timestamp.now(); // Update last modified timestamp

        await docRef.update(updates);
        const updatedDoc = await docRef.get(); // Get the updated document to return
        res.status(200).json({ id: updatedDoc.id, message: 'FOIA analysis updated successfully.', ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating FOIA analysis details:', error);
        res.status(500).json({ error: 'Failed to update FOIA analysis details.', details: error.message });
    }
});

app.delete('/api/foia-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'FOIA analysis not found.' });

        await docRef.delete();
        res.status(200).json({ id: analysisId, message: 'FOIA analysis deleted successfully.' });
    } catch (error) {
        console.error('Error deleting FOIA analysis:', error);
        res.status(500).json({ error: 'Failed to delete FOIA analysis.', details: error.message });
    }
});


// Fallback for SPA - Serves index.html for any unmatched GET routes
// This should ideally be specific to avoid interfering with API routes if one is mistyped.
// For example, serve index.html for non-API routes.
app.get(/^\/(?!api).*/, (req, res) => { // Regex to serve index.html for routes NOT starting with /api
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Cendien agency website server listening on port ${PORT}.`);
    console.log(`Access it at http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn('Warning: GEMINI_API_KEY environment variable is not set. AI features will not work.');
    }
     if (!process.env.GCLOUD_PROJECT) {
        console.warn('Warning: GCLOUD_PROJECT environment variable is not set. Firestore connection might rely on default project or fail.');
    }
});
