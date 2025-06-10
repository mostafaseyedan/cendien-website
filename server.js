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
const FOIA_PROMPT_SETTINGS_DOC_ID = 'globalFoiaPrompts'; 

app.get('/api/foia-prompt-settings', async (req, res) => {
    try {
        const docRef = db.collection('promptSettings').doc(FOIA_PROMPT_SETTINGS_DOC_ID); 
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
        const EXPECTED_FOIA_PROMPT_KEYS = [
            'summary', 'proposalComparison', 'insightsAnalysis', 
            'pricingIntelligence', 'marketTrends', 'tasksWorkPlan',
            'documentType'
        ];
        for (const key of EXPECTED_FOIA_PROMPT_KEYS) {
            if (!prompts.hasOwnProperty(key) || typeof prompts[key] !== 'string') {
                 return res.status(400).json({ error: `Invalid or missing FOIA prompt for section: ${key}. All sections must be provided with string values.` });
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
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const responseData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            const errorMessage = responseData.error?.message || `Gemini API request failed with status ${geminiResponse.status}`;
            return res.status(geminiResponse.status).json({ error: errorMessage, details: responseData });
        }

        if (responseData.candidates && responseData.candidates[0]?.content?.parts[0]?.text) {
            res.json({ generatedText: responseData.candidates[0].content.parts[0].text });
        } else {
             const blockMessage = `Prompt blocked by Gemini API. Reason: ${responseData.promptFeedback?.blockReason}.`;
            res.status(400).json({ error: blockMessage, details: responseData.promptFeedback?.safetyRatings });
        }
    } catch (error) {
        console.error('Internal server error calling Gemini API:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// --- RAG Chatbot Endpoint ---
app.post('/api/chatbot', async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        let context = "";
        let foundData = false;
        
        const isCountQuery = query.toLowerCase().includes('how many') || query.toLowerCase().includes('count') || query.toLowerCase().includes('total');
        
        if (isCountQuery) {
            const rfpSnapshot = await db.collection('rfpAnalyses').get();
            const foiaSnapshot = await db.collection('foiaAnalyses').get();
            context = `The user is asking for a count. \n- Total RFP analyses in the database: ${rfpSnapshot.size}. \n- Total FOIA analyses in the database: ${foiaSnapshot.size}.`;
            foundData = true;
        } else {
            const rfpQuerySnapshot = await db.collection('rfpAnalyses').where('rfpTitle', '>=', query).where('rfpTitle', '<=', query + '\uf8ff').limit(2).get();
            const foiaQuerySnapshot = await db.collection('foiaAnalyses').where('foiaTitle', '>=', query).where('foiaTitle', '<=', query + '\uf8ff').limit(2).get();

            let searchContext = "Context from the database:\n";
            rfpQuerySnapshot.forEach(doc => {
                const data = doc.data();
                searchContext += `- RFP Analysis titled "${data.rfpTitle || 'Untitled'}". Current Status: ${data.status}. Summary: ${data.rfpSummary}\n`;
                foundData = true;
            });
            foiaQuerySnapshot.forEach(doc => {
                const data = doc.data();
                searchContext += `- FOIA Analysis titled "${data.foiaTitle || 'Untitled'}". Current Status: ${data.status}. Summary: ${data.foiaSummary}\n`;
                foundData = true;
            });
            context = searchContext;
        }
        
        if (!foundData && !isCountQuery) {
            context = "No specific data found for the user's query in the database. Please answer based on your general knowledge.";
        }

        const ragPrompt = `You are a helpful assistant. Answer the user's question based *only* on the provided context. If the context does not contain the answer, say you don't have enough information from the database to answer.

        Context:
        ---
        ${context}
        ---

        User's Question: "${query}"

        Your Answer:`;
        
        const geminiResponse = await fetch(`http://localhost:${PORT}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: ragPrompt })
        });
         if (!geminiResponse.ok) {
            const error = await geminiResponse.json();
            throw new Error(error.error || "Chatbot AI analysis failed.");
        }
        const data = await geminiResponse.json();
        res.json({ reply: data.generatedText });

    } catch (error) {
        console.error('Error in chatbot endpoint:', error);
        res.status(500).json({ error: 'Failed to process chatbot query.', details: error.message });
    }
});


// --- RFP Analysis Endpoints ---
app.post('/api/rfp-analysis', async (req, res) => {
    try {
        const analysisData = { ...req.body, analysisDate: Timestamp.now() };
        if (!analysisData.rfpFileName) {
            return res.status(400).json({ error: 'Missing required field: rfpFileName' });
        }
        const docRef = await db.collection('rfpAnalyses').add(analysisData);
        const savedDoc = await docRef.get();
        res.status(201).json({ id: docRef.id, ...savedDoc.data() });
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
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        await docRef.update({ status, lastModified: Timestamp.now() });
        res.status(200).json({ id: analysisId, message: 'RFP status updated.' });
    } catch (error) {
        console.error('Error updating RFP status:', error);
        res.status(500).json({ error: 'Failed to update RFP status.', details: error.message });
    }
});

app.put('/api/rfp-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const updates = { ...req.body, lastModified: Timestamp.now() };
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        res.status(200).json({ id: updatedDoc.id, message: 'RFP analysis updated successfully.', ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating RFP analysis details:', error);
        res.status(500).json({ error: 'Failed to update RFP analysis details.', details: error.message });
    }
});

app.delete('/api/rfp-analysis/:id', async (req, res) => {
    // This endpoint should be updated to also delete from GCS if gcsUrl exists
    try {
        const analysisId = req.params.id;
        const docRef = db.collection('rfpAnalyses').doc(analysisId);
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
const FOIA_COLLECTION_NAME = 'foiaAnalyses'; 

app.post('/api/foia-analysis', async (req, res) => {
    try {
        const foiaAnalysisData = { ...req.body, analysisDate: Timestamp.now() };
        if (!foiaAnalysisData.foiaFileNames || foiaAnalysisData.foiaFileNames.length === 0) {
            return res.status(400).json({ error: 'Missing required field: foiaFileNames' });
        }
        const docRef = await db.collection(FOIA_COLLECTION_NAME).add(foiaAnalysisData);
        const savedDoc = await docRef.get();
        res.status(201).json({ id: docRef.id, ...savedDoc.data() });
    } catch (error) {
        console.error('Error saving FOIA analysis:', error);
        res.status(500).json({ error: 'Failed to save FOIA analysis.', details: error.message });
    }
});

app.get('/api/foia-analyses', async (req, res) => {
    try {
        const analysesSnapshot = await db.collection(FOIA_COLLECTION_NAME).orderBy('analysisDate', 'desc').get();
        const analyses = [];
        analysesSnapshot.forEach(doc => analyses.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(analyses);
    } catch (error) {
        console.error('Error retrieving FOIA analyses:', error);
        res.status(500).json({ error: 'Failed to retrieve FOIA analyses.', details: error.message });
    }
});

app.get('/api/foia-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        if (!analysisId) return res.status(400).json({ error: 'FOIA Analysis ID is required.' });
        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'FOIA analysis not found.' });
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
        if (!status) return res.status(400).json({ error: 'New status is required.' });
        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        await docRef.update({ status, lastModified: Timestamp.now() });
        res.status(200).json({ id: analysisId, message: 'FOIA status updated.' });
    } catch (error) {
        console.error('Error updating FOIA status:', error);
        res.status(500).json({ error: 'Failed to update FOIA status.', details: error.message });
    }
});

app.put('/api/foia-analysis/:id', async (req, res) => {
    try {
        const analysisId = req.params.id;
        const updates = { ...req.body, lastModified: Timestamp.now() };
        const docRef = db.collection(FOIA_COLLECTION_NAME).doc(analysisId);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating FOIA details:', error);
        res.status(500).json({ error: 'Failed to update FOIA details.', details: error.message });
    }
});

app.delete('/api/foia-analysis/:id', async (req, res) => {
    // This endpoint should be updated to also delete from GCS if gcsUrl exists
    try {
        const analysisId = req.params.id;
        await db.collection(FOIA_COLLECTION_NAME).doc(analysisId).delete();
        res.status(200).json({ id: analysisId, message: 'FOIA analysis deleted.' });
    } catch (error) {
        console.error('Error deleting FOIA analysis:', error);
        res.status(500).json({ error: 'Failed to delete FOIA analysis.', details: error.message });
    }
});


// --- Fallback Route for Frontend ---
app.get(/^\/(?!api).*/, (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Cendien agency website server listening on port ${PORT}.`);
    if (!process.env.GEMINI_API_KEY) console.warn('Warning: GEMINI_API_KEY is not set.');
    if (!process.env.GCLOUD_PROJECT) console.warn('Warning: GCLOUD_PROJECT is not set.');
});