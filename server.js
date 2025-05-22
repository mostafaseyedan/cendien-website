const express = require('express');
const path = require('path');
// Ensure global fetch is available (Node.js 18+ has it built-in)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)

// API Endpoint to communicate with Gemini
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

    // Using gemini-1.5-flash-latest as it's efficient and good for text generation
    const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    try {
        console.log(`Received prompt. Sending to Gemini...`); // Keep logs concise for production
        const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { // Optional: Adjust temperature for more/less creative responses
                    // temperature: 0.7, 
                    // maxOutputTokens: 800, // Adjust if you need longer responses
                }
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
        
        // console.log('Gemini API Raw Response Data:', JSON.stringify(data, null, 2)); // For debugging

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            res.json({ generatedText: data.candidates[0].content.parts[0].text });
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            const blockMessage = `Prompt blocked by Gemini API. Reason: ${data.promptFeedback.blockReason}.`;
            console.warn(blockMessage, data.promptFeedback.safetyRatings);
            res.status(400).json({ error: blockMessage, details: data.promptFeedback.safetyRatings });
        } else if (data.error) {
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

// Fallback for SPA or direct GET requests to non-API routes
// This should serve your main index.html for any GET request not matched above
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Cendien agency website server listening on port ${PORT}.`);
    console.log(`Access it at http://localhost:${PORT}`);
});
