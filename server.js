const express = require('express');
const path = require('path');
// Import the Firestore library
const { Firestore, Timestamp } = require('@google-cloud/firestore'); // Added Timestamp

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firestore
// This will automatically use the Cloud Run service account's credentials
// when running on Google Cloud. For local development, you might need to
// set up authentication (e.g., gcloud auth application-default login).
const db = new Firestore({
    projectId: 'temporal-grin-460413-q9', // Replace with the actual Project ID
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); 


app.use(express.static(path.join(__dirname, 'public')));
// --- END OF CORRECTED MIDDLEWARE SECTION ---

// API Endpoint to communicate with Gemini (existing)
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is not set.');
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`; // Using the corrected model

    try {
        console.log(`Received prompt for Gemini. Sending...`);
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // generationConfig: { ... } // Optional
            }),
        });

        const responseDataText = await geminiResponse.text();
        let data;
        try {
            data = JSON.parse(responseDataText);
        } catch (e) {
            console.error('Error parsing Gemini API response as JSON:', responseDataText);
            return res.status(500).json({ error: 'Error parsing response from Gemini API.', details: responseDataText });
        }

        if (!geminiResponse.ok) {
            console.error('Gemini API Error - Status:', geminiResponse.status, 'Response:', data);
            const errorMessage = data.error?.message || `Gemini API request failed with status ${geminiResponse.status}`;
            return res.status(geminiResponse.status).json({ error: errorMessage, details: data });
        }
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            res.json({ generatedText: data.candidates[0].content.parts[0].text });
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            const blockMessage = `Prompt blocked by Gemini API. Reason: ${data.promptFeedback.blockReason}.`;
            console.warn(blockMessage, data.promptFeedback.safetyRatings);
            res.status(400).json({ error: blockMessage, details: data.promptFeedback.safetyRatings });
        }  else if (data.error) {
            console.error('Gemini API returned an error structure:', data.error.message);
            res.status(500).json({ error: `Error from Gemini API: ${data.error.message}`, details: data.error });
        } else {
            console.warn('Unexpected Gemini API response structure:', data);
            res.status(500).json({ error: 'Could not parse the expected text from Gemini API response.' });
        }

    } catch (error) {
        console.error('Internal server error calling Gemini API:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// --- New API Endpoints for RFP Analysis ---

// POST: Save a new RFP analysis
app.post('/api/rfp-analysis', async (req, res) => {
    try {
        const { rfpFileName, rfpSummary, generatedQuestions, status } = req.body;

        if (!rfpFileName || !rfpSummary || !generatedQuestions) {
            return res.status(400).json({ error: 'Missing required fields: rfpFileName, rfpSummary, generatedQuestions' });
        }

        const analysisData = {
            rfpFileName,
            rfpSummary,
            generatedQuestions,
            analysisDate: Timestamp.now(), // Use Firestore Timestamp
            status: status || 'new', // Default status if not provided
        };

        // Add a new document with a generated ID to the 'rfpAnalyses' collection
        const docRef = await db.collection('rfpAnalyses').add(analysisData);
        console.log('RFP Analysis saved with ID:', docRef.id);
        res.status(201).json({ id: docRef.id, message: 'RFP analysis saved successfully.' });

    } catch (error) {
        console.error('Error saving RFP analysis:', error);
        res.status(500).json({ error: 'Failed to save RFP analysis.', details: error.message });
    }
});

// GET: Retrieve all RFP analyses (or a paginated list)
app.get('/api/rfp-analyses', async (req, res) => {
    try {
        const analysesSnapshot = await db.collection('rfpAnalyses')
                                        .orderBy('analysisDate', 'desc') // Order by date, newest first
                                        .get();
        
        if (analysesSnapshot.empty) {
            return res.status(200).json([]); // Return empty array if no documents
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

// GET: Retrieve a specific RFP analysis by ID (Optional, but good for viewing details)
app.get('/api/rfp-analysis/:id', async (req, res) => {
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
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Now points to the RFP analyzer
});

app.listen(PORT, () => {
    console.log(`Cendien agency website server listening on port ${PORT}.`);
    console.log(`Access it at http://localhost:${PORT}`);
});
