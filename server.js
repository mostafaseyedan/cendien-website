// server.js with comprehensive logging and SPA fallback
console.log('--- server.js execution started ---');

try {
    const express = require('express');
    console.log('Express required successfully.');
    const path = require('path');
    console.log('Path required successfully.');
    const { Firestore, Timestamp } = require('@google-cloud/firestore');
    console.log('Firestore and Timestamp required successfully.');

    const app = express();
    console.log('Express app initialized.');
    const PORT = process.env.PORT || 3000;
    console.log(`PORT is set to: ${PORT}`);

    console.log('Attempting to initialize Firestore...');
    const db = new Firestore({
        projectId: process.env.GCLOUD_PROJECT || 'cendien-sales-support-ai',
    });
    console.log('Firestore initialized successfully.');

    console.log('Setting up middlewares...');
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    console.log('Middlewares set up.');

    // Serve static files from the 'public' directory first.
    // Useful for favicon.ico, robots.txt, or other specific root-level static files.
    // If a file is not found here, it will proceed to other routes.
    console.log('Setting up static middleware for /public (for specific static assets)...');
    app.use(express.static(path.join(__dirname, 'public')));
    console.log('Static middleware for /public set up.');

    // === API Endpoints ===
    console.log('Defining API endpoints...');
    // API Endpoint to communicate with Gemini
    app.post('/api/generate', async (req, res) => {
        console.log('POST /api/generate called.');
        const { prompt } = req.body;
        if (!prompt) {
            console.error('POST /api/generate - Error: Prompt is required.');
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error('POST /api/generate - Error: GEMINI_API_KEY environment variable is not set.');
            return res.status(500).json({ error: 'API key not configured on server.' });
        }
        const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
        
        try {
            console.log(`POST /api/generate - Received prompt for Gemini. Sending... (Prompt length: ${prompt.length})`);
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
                console.error('POST /api/generate - Error parsing Gemini API response as JSON. Raw response text:', responseDataText.substring(0, 500), 'Error object:', e);
                return res.status(500).json({ error: 'Error parsing response from Gemini API.', details: responseDataText.substring(0, 500) });
            }
            if (!geminiResponse.ok) {
                console.error('POST /api/generate - Gemini API Error - Status:', geminiResponse.status, 'Response:', JSON.stringify(data, null, 2));
                const errorMessage = data.error?.message || `Gemini API request failed with status ${geminiResponse.status}`;
                return res.status(geminiResponse.status).json({ error: errorMessage, details: data });
            }
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                console.log('POST /api/generate - Successfully received text from Gemini.');
                res.json({ generatedText: data.candidates[0].content.parts[0].text });
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                const blockMessage = `POST /api/generate - Prompt blocked by Gemini API. Reason: ${data.promptFeedback.blockReason}.`;
                console.warn(blockMessage, data.promptFeedback.safetyRatings);
                res.status(400).json({ error: blockMessage, details: data.promptFeedback.safetyRatings });
            } else if (data.error) {
                console.error('POST /api/generate - Gemini API returned an error structure:', JSON.stringify(data.error, null, 2));
                res.status(500).json({ error: `Error from Gemini API: ${data.error.message}`, details: data.error });
            } else {
                console.warn('POST /api/generate - Unexpected Gemini API response structure:', JSON.stringify(data, null, 2));
                res.status(500).json({ error: 'Could not parse the expected text from Gemini API response.' });
            }
        } catch (error) {
            console.error('POST /api/generate - Internal server error calling Gemini API:', error);
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    // RFP Analysis Endpoints
    app.post('/api/rfp-analysis', async (req, res) => {
        console.log('POST /api/rfp-analysis called.');
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
            } = req.body;

            if (!rfpFileName || !rfpSummary || !generatedQuestions) {
                console.error('POST /api/rfp-analysis - Error: Missing required fields.');
                return res.status(400).json({ error: 'Missing required fields for basic analysis: rfpFileName, rfpSummary, generatedQuestions' });
            }

            const analysisData = {
                rfpFileName, rfpSummary, generatedQuestions,
                rfpDeadlines: rfpDeadlines || "Not specified",
                rfpKeyRequirements: rfpKeyRequirements || "Not specified",
                rfpStakeholders: rfpStakeholders || "Not specified",
                rfpRisks: rfpRisks || "Not specified",
                analysisDate: Timestamp.now(), status: status || 'analyzed',
                rfpTitle: rfpTitle || "", rfpType: rfpType || "N/A",
                submittedBy: submittedBy || "N/A",
                rfpSubmissionFormat: rfpSubmissionFormat || "Not specified",
                rfpRegistration: rfpRegistration || "Not specified",
                rfpLicenses: rfpLicenses || "Not specified",
                rfpBudget: rfpBudget || "Not specified",
                analysisPrompts: analysisPrompts || {}
            };

            const docRef = await db.collection('rfpAnalyses').add(analysisData);
            console.log('POST /api/rfp-analysis - RFP Analysis saved with ID:', docRef.id);
            res.status(201).json({ id: docRef.id, message: 'RFP analysis saved successfully.', ...analysisData });
        } catch (error) {
            console.error('POST /api/rfp-analysis - Error saving RFP analysis:', error);
            res.status(500).json({ error: 'Failed to save RFP analysis.', details: error.message });
        }
    });

    app.put('/api/rfp-analysis/:id/status', async (req, res) => {
        console.log(`PUT /api/rfp-analysis/${req.params.id}/status called.`);
        try {
            const analysisId = req.params.id; const { status } = req.body;
            if (!status) {
                console.error(`PUT /api/rfp-analysis/${analysisId}/status - Error: New status is required.`);
                return res.status(400).json({ error: 'New status is required.' });
            }
            if (!['active', 'not_pursuing', 'analyzed'].includes(status)) {
                console.error(`PUT /api/rfp-analysis/${analysisId}/status - Error: Invalid status value: ${status}.`);
                return res.status(400).json({ error: 'Invalid status value.' });
            }
            const docRef = db.collection('rfpAnalyses').doc(analysisId); const doc = await docRef.get();
            if (!doc.exists) {
                console.error(`PUT /api/rfp-analysis/${analysisId}/status - Error: RFP analysis not found.`);
                return res.status(404).json({ error: 'RFP analysis not found.' });
            }
            await docRef.update({ status: status, lastModified: Timestamp.now() });
            console.log(`PUT /api/rfp-analysis/${analysisId}/status - RFP Analysis status updated. New Status: ${status}`);
            res.status(200).json({ id: analysisId, message: 'RFP status updated successfully.', status: status });
        } catch (error) {
            console.error(`PUT /api/rfp-analysis/${req.params.id}/status - Error updating RFP status:`, error);
            res.status(500).json({ error: 'Failed to update RFP status.', details: error.message });
        }
    });

    app.put('/api/rfp-analysis/:id/title', async (req, res) => {
        console.log(`PUT /api/rfp-analysis/${req.params.id}/title called.`);
        try {
            const analysisId = req.params.id; const { rfpTitle } = req.body;
            if (typeof rfpTitle !== 'string') {
                console.error(`PUT /api/rfp-analysis/${analysisId}/title - Error: New rfpTitle is required and must be a string.`);
                return res.status(400).json({ error: 'New rfpTitle is required and must be a string.' });
            }
            const docRef = db.collection('rfpAnalyses').doc(analysisId); const doc = await docRef.get();
            if (!doc.exists) {
                console.error(`PUT /api/rfp-analysis/${analysisId}/title - Error: RFP analysis not found.`);
                return res.status(404).json({ error: 'RFP analysis not found.' });
            }
            await docRef.update({ rfpTitle: rfpTitle, lastModified: Timestamp.now() });
            console.log(`PUT /api/rfp-analysis/${analysisId}/title - RFP Analysis title updated. New Title: ${rfpTitle}`);
            res.status(200).json({ id: analysisId, message: 'RFP title updated successfully.', rfpTitle: rfpTitle });
        } catch (error) {
            console.error(`PUT /api/rfp-analysis/${req.params.id}/title - Error updating RFP title:`, error);
            res.status(500).json({ error: 'Failed to update RFP title.', details: error.message });
        }
    });

    app.delete('/api/rfp-analysis/:id', async (req, res) => {
        console.log(`DELETE /api/rfp-analysis/${req.params.id} called.`);
        try {
            const analysisId = req.params.id;
            const docRef = db.collection('rfpAnalyses').doc(analysisId); const doc = await docRef.get();
            if (!doc.exists) {
                console.error(`DELETE /api/rfp-analysis/${analysisId} - Error: RFP analysis not found.`);
                return res.status(404).json({ error: 'RFP analysis not found.' });
            }
            await docRef.delete();
            console.log(`DELETE /api/rfp-analysis/${analysisId} - RFP Analysis deleted.`);
            res.status(200).json({ id: analysisId, message: 'RFP analysis deleted successfully.' });
        } catch (error) {
            console.error(`DELETE /api/rfp-analysis/${req.params.id} - Error deleting RFP analysis:`, error);
            res.status(500).json({ error: 'Failed to delete RFP analysis.', details: error.message });
        }
    });

    app.get('/api/rfp-analyses', async (req, res) => {
        console.log('GET /api/rfp-analyses called.');
        try {
            const analysesSnapshot = await db.collection('rfpAnalyses').orderBy('analysisDate', 'desc').get();
            if (analysesSnapshot.empty) {
                console.log('GET /api/rfp-analyses - No analyses found.');
                return res.status(200).json([]);
            }
            const analyses = []; analysesSnapshot.forEach(doc => { analyses.push({ id: doc.id, ...doc.data() }); });
            console.log(`GET /api/rfp-analyses - Retrieved ${analyses.length} analyses.`);
            res.status(200).json(analyses);
        } catch (error) {
            console.error('GET /api/rfp-analyses - Error retrieving RFP analyses:', error);
            res.status(500).json({ error: 'Failed to retrieve RFP analyses.', details: error.message });
        }
    });

    app.get('/api/rfp-analysis/:id', async (req, res) => {
        console.log(`GET /api/rfp-analysis/${req.params.id} called.`);
        try {
            const analysisId = req.params.id;
            if (!analysisId) {
                console.error(`GET /api/rfp-analysis/${analysisId} - Error: Analysis ID is required.`);
                return res.status(400).json({ error: 'Analysis ID is required.' });
            }
            const docRef = db.collection('rfpAnalyses').doc(analysisId); const doc = await docRef.get();
            if (!doc.exists) {
                console.error(`GET /api/rfp-analysis/${analysisId} - Error: RFP analysis not found.`);
                return res.status(404).json({ error: 'RFP analysis not found.' });
            }
            console.log(`GET /api/rfp-analysis/${analysisId} - Retrieved analysis.`);
            res.status(200).json({ id: doc.id, ...doc.data() });
        } catch (error) {
            console.error(`GET /api/rfp-analysis/${req.params.id} - Error retrieving specific RFP analysis:`, error);
            res.status(500).json({ error: 'Failed to retrieve RFP analysis.', details: error.message });
        }
    });
    console.log('API endpoints defined.');

    // === Serve React App ===
    // This assumes your Vite build output directory is 'dist' at the project root.
    // Your root vite.config.js should be configured as: build: { outDir: 'dist' }
    const reactAppBuildPath = path.join(__dirname, 'dist');
    console.log(`React app build path is: ${reactAppBuildPath}. Serving static assets from this path.`);

    // Serve static assets (JS, CSS, images etc.) from the React app's build directory
    app.use(express.static(reactAppBuildPath));
    console.log(`Static middleware for React app assets from '${reactAppBuildPath}' set up.`);

    // For any GET request that is not an API call and not caught by the static middleware above,
    // serve the main index.html from the React app build. This enables client-side routing.
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.method !== 'GET') {
            console.log(`Path ${req.path} is API or not GET, passing to next handler.`);
            return next(); // Pass to next handler if it's an API call or not a GET request
        }
        
        console.log(`Serving React app's index.html for GET request: ${req.path}`);
        res.sendFile(path.join(reactAppBuildPath, 'index.html'), (err) => {
            if (err) {
                console.error(`Error sending file ${path.join(reactAppBuildPath, 'index.html')} for path ${req.path}:`, err);
                // Avoid sending a new response if headers already sent or if it's a minor client-side issue
                if (!res.headersSent) {
                    res.status(500).send('Error serving application.');
                }
            } else {
                console.log(`Successfully sent ${path.join(reactAppBuildPath, 'index.html')} for ${req.path}`);
            }
        });
    });
    console.log('Catch-all GET route for serving React app index.html set up.');

    // Start the server
    console.log(`Attempting to start server on port ${PORT}...`);
    app.listen(PORT, () => {
        console.log(`--- Cendien agency website server listening on port ${PORT}. ---`);
        console.log(`Access it at http://localhost:${PORT}`);
        console.log(`React RFP Analyzer (if built) should be at http://localhost:${PORT}`);
    });

} catch (error) {
    console.error('--- Unhandled synchronous error during server.js setup: ---', error);
    process.exit(1); // Ensure process exits if there's a major setup error
}
