// mostafaseyedan/cendien-website/cendien-website-Dev/server.jsconst express = require('express');
const path = require('path');
const { Firestore, Timestamp } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 3000;


const db = new Firestore({
    projectId: process.env.GCLOUD_PROJECT || 'cendien-sales-support-ai', // Allow project ID to be set by env var
});


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve original static files from the 'public' directory (e.g., for images, other static assets not part of the React build)
// This means if you have public/images/my-image.png, it's accessible via yoursite.com/images/my-image.png
app.use(express.static(path.join(__dirname, 'public')));


// === API Endpoints (Your existing API logic) ===

// API Endpoint to communicate with Gemini
app.post('/api/generate', async (req, res) => { //
    const { prompt } = req.body; //
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' }); //

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; //
    if (!GEMINI_API_KEY) { //
        console.error('Error: GEMINI_API_KEY environment variable is not set.'); //
        return res.status(500).json({ error: 'API key not configured on server.' }); //
    }
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`; //
    
    try {
        console.log(`Received prompt for Gemini. Sending... (Prompt length: ${prompt.length})`); //
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, { // Using global fetch if Node.js v18+ //
            method: 'POST', //
            headers: { 'Content-Type': 'application/json' }, //
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), //
        });
        const responseDataText = await geminiResponse.text(); //
        let data; //
        try {
            data = JSON.parse(responseDataText); //
        } catch (e) {
            console.error('Error parsing Gemini API response as JSON. Raw response text:', responseDataText.substring(0, 500)); //
            return res.status(500).json({ error: 'Error parsing response from Gemini API.', details: responseDataText.substring(0, 500) }); //
        }
        if (!geminiResponse.ok) { //
            console.error('Gemini API Error - Status:', geminiResponse.status, 'Response:', JSON.stringify(data, null, 2)); //
            const errorMessage = data.error?.message || `Gemini API request failed with status ${geminiResponse.status}`; //
            return res.status(geminiResponse.status).json({ error: errorMessage, details: data }); //
        }
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) { //
            res.json({ generatedText: data.candidates[0].content.parts[0].text }); //
        } else if (data.promptFeedback && data.promptFeedback.blockReason) { //
            const blockMessage = `Prompt blocked by Gemini API. Reason: ${data.promptFeedback.blockReason}.`; //
            console.warn(blockMessage, data.promptFeedback.safetyRatings); //
            res.status(400).json({ error: blockMessage, details: data.promptFeedback.safetyRatings }); //
        } else if (data.error) { //
            console.error('Gemini API returned an error structure:', JSON.stringify(data.error, null, 2)); //
            res.status(500).json({ error: `Error from Gemini API: ${data.error.message}`, details: data.error }); //
        } else {
            console.warn('Unexpected Gemini API response structure:', JSON.stringify(data, null, 2)); //
            res.status(500).json({ error: 'Could not parse the expected text from Gemini API response.' }); //
        }
    } catch (error) {
        console.error('Internal server error calling Gemini API:', error); //
        res.status(500).json({ error: `Internal server error: ${error.message}` }); //
    }
});

// RFP Analysis Endpoints
app.post('/api/rfp-analysis', async (req, res) => { //
    try {
        const {
            rfpFileName, rfpSummary, generatedQuestions, status,
            rfpDeadlines, rfpKeyRequirements, rfpStakeholders, rfpRisks,
            rfpTitle, rfpType, submittedBy,
            rfpSubmissionFormat,
            rfpRegistration,
            rfpLicenses,
            rfpBudget,
            analysisPrompts
        } = req.body; //

        if (!rfpFileName || !rfpSummary || !generatedQuestions) { //
            return res.status(400).json({ error: 'Missing required fields for basic analysis: rfpFileName, rfpSummary, generatedQuestions' }); //
        }

        const analysisData = { //
            rfpFileName,
            rfpSummary,
            generatedQuestions,
            rfpDeadlines: rfpDeadlines || "Not specified",
            rfpKeyRequirements: rfpKeyRequirements || "Not specified",
            rfpStakeholders: rfpStakeholders || "Not specified",
            rfpRisks: rfpRisks || "Not specified",
            analysisDate: Timestamp.now(), //
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

        const docRef = await db.collection('rfpAnalyses').add(analysisData); //
        console.log('RFP Analysis saved with ID:', docRef.id); //
        res.status(201).json({ id: docRef.id, message: 'RFP analysis saved successfully.', ...analysisData }); //
    } catch (error) {
        console.error('Error saving RFP analysis:', error); //
        res.status(500).json({ error: 'Failed to save RFP analysis.', details: error.message }); //
    }
});

app.put('/api/rfp-analysis/:id/status', async (req, res) => { //
    try {
        const analysisId = req.params.id; //
        const { status } = req.body; //

        if (!status) { //
            return res.status(400).json({ error: 'New status is required.' }); //
        }
        if (!['active', 'not_pursuing', 'analyzed'].includes(status)) { //
            return res.status(400).json({ error: 'Invalid status value.' }); //
        }

        const docRef = db.collection('rfpAnalyses').doc(analysisId); //
        const doc = await docRef.get(); //

        if (!doc.exists) { //
            return res.status(404).json({ error: 'RFP analysis not found.' }); //
        }

        await docRef.update({ status: status, lastModified: Timestamp.now() }); //
        console.log('RFP Analysis status updated for ID:', analysisId, 'New Status:', status); //
        res.status(200).json({ id: analysisId, message: 'RFP status updated successfully.', status: status }); //
    } catch (error) {
        console.error('Error updating RFP status:', error); //
        res.status(500).json({ error: 'Failed to update RFP status.', details: error.message }); //
    }
});

app.put('/api/rfp-analysis/:id/title', async (req, res) => { //
    try {
        const analysisId = req.params.id; //
        const { rfpTitle } = req.body; //

        if (typeof rfpTitle !== 'string') { //
            return res.status(400).json({ error: 'New rfpTitle is required and must be a string.' }); //
        }

        const docRef = db.collection('rfpAnalyses').doc(analysisId); //
        const doc = await docRef.get(); //

        if (!doc.exists) { //
            return res.status(404).json({ error: 'RFP analysis not found.' }); //
        }

        await docRef.update({ rfpTitle: rfpTitle, lastModified: Timestamp.now() }); //
        console.log('RFP Analysis title updated for ID:', analysisId, 'New Title:', rfpTitle); //
        res.status(200).json({ id: analysisId, message: 'RFP title updated successfully.', rfpTitle: rfpTitle }); //
    } catch (error) {
        console.error('Error updating RFP title:', error); //
        res.status(500).json({ error: 'Failed to update RFP title.', details: error.message }); //
    }
});

app.delete('/api/rfp-analysis/:id', async (req, res) => { //
    try {
        const analysisId = req.params.id; //
        const docRef = db.collection('rfpAnalyses').doc(analysisId); //
        const doc = await docRef.get(); //

        if (!doc.exists) { //
            return res.status(404).json({ error: 'RFP analysis not found.' }); //
        }

        await docRef.delete(); //
        console.log('RFP Analysis deleted with ID:', analysisId); //
        res.status(200).json({ id: analysisId, message: 'RFP analysis deleted successfully.' }); //
    } catch (error) {
        console.error('Error deleting RFP analysis:', error); //
        res.status(500).json({ error: 'Failed to delete RFP analysis.', details: error.message }); //
    }
});

app.get('/api/rfp-analyses', async (req, res) => { //
    try {
        const analysesSnapshot = await db.collection('rfpAnalyses') //
                                        .orderBy('analysisDate', 'desc') //
                                        .get(); //
        if (analysesSnapshot.empty) { //
            return res.status(200).json([]); //
        }
        const analyses = []; //
        analysesSnapshot.forEach(doc => { //
            analyses.push({ id: doc.id, ...doc.data() }); //
        });
        res.status(200).json(analyses); //
    } catch (error) {
        console.error('Error retrieving RFP analyses:', error); //
        res.status(500).json({ error: 'Failed to retrieve RFP analyses.', details: error.message }); //
    }
});

app.get('/api/rfp-analysis/:id', async (req, res) => { //
    try {
        const analysisId = req.params.id; //
        if (!analysisId) { //
            return res.status(400).json({ error: 'Analysis ID is required.' }); //
        }
        const docRef = db.collection('rfpAnalyses').doc(analysisId); //
        const doc = await docRef.get(); //
        if (!doc.exists) { //
            return res.status(404).json({ error: 'RFP analysis not found.' }); //
        }
        res.status(200).json({ id: doc.id, ...doc.data() }); //
    } catch (error) {
        console.error('Error retrieving specific RFP analysis:', error); //
        res.status(500).json({ error: 'Failed to retrieve RFP analysis.', details: error.message }); //
    }
});


// === Serve React App (RFP Analyzer) ===
// This assumes your Vite build output directory is 'dist' at the project root.
// Your root vite.config.js should be configured as: build: { outDir: 'dist' }
const reactAppBuildPath = path.join(__dirname, 'dist'); // MODIFIED HERE

// Serve static files from the React build directory ('dist') under the /rfp-analyzer path
app.use('/rfp-analyzer', express.static(reactAppBuildPath));

// Handle client-side routing for the React app under /rfp-analyzer
// Any GET request to /rfp-analyzer/* that isn't a static file will serve the React app's index.html
app.get('/rfp-analyzer/*', (req, res) => {
    res.sendFile(path.join(reactAppBuildPath, 'index.html'));
});


// Fallback for any other GET requests not handled by previous routes
// This was your original fallback. It will serve index.html from the 'public' folder
// for routes like '/' or any other non-API, non-/rfp-analyzer path.
// If your React app's index.html is now at the root and should be the default,
// you might want to change this to serve that file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); //
});


// Start the server
app.listen(PORT, () => { //
    console.log(`Cendien agency website server listening on port ${PORT}.`); //
    console.log(`Access it at http://localhost:${PORT}`); //
    console.log(`React RFP Analyzer (if built) should be at http://localhost:${PORT}/rfp-analyzer`);
});
