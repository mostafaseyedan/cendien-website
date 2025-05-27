const express = require('express');
const path = require('path');
const { Firestore, Timestamp } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Firestore({
    projectId: 'temporal-grin-460413-q9', // Your Firestore Project ID
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to communicate with Gemini
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is not set.');
        return res.status(500).json({ error: 'API key not configured on server.' });
    }
    // Ensure this model name is correct for your usage
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

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
        // Destructure new fields from request body
        const { 
            rfpFileName, rfpSummary, generatedQuestions, status,
            rfpDeadlines, rfpKeyRequirements, rfpStakeholders, rfpRisks 
        } = req.body;

        if (!rfpFileName || !rfpSummary || !generatedQuestions) { // Basic validation
            return res.status(400).json({ error: 'Missing required fields: rfpFileName, rfpSummary, generatedQuestions' });
        }

        const analysisData = {
            rfpFileName,
            rfpSummary,
            generatedQuestions,
            rfpDeadlines: rfpDeadlines || "Not specified", // Provide defaults if not present
            rfpKeyRequirements: rfpKeyRequirements || "Not specified",
            rfpStakeholders: rfpStakeholders || "Not specified",
            rfpRisks: rfpRisks || "Not specified",
            analysisDate: Timestamp.now(),
            status: status || 'new',
        };

        const docRef = await db.collection('rfpAnalyses').add(analysisData);
        console.log('RFP Analysis saved with ID:', docRef.id, 'Data:', analysisData); // Log saved data
        res.status(201).json({ id: docRef.id, message: 'RFP analysis saved successfully.' });
    } catch (error) {
        console.error('Error saving RFP analysis:', error);
        res.status(500).json({ error: 'Failed to save RFP analysis.', details: error.message });
    }
});

app.get('/api/rfp-analyses', async (req, res) => { /* ... same as before ... */ 
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

app.get('/api/rfp-analysis/:id', async (req, res) => { /* ... same as before ... */ 
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


// Fallback for SPA or direct GET requests to non-API routes
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Cendien agency website server listening on port ${PORT}.`);
    console.log(`Access it at http://localhost:${PORT}`);
});
