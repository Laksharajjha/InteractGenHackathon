const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { parseIntent } = require('./services/llmService');
const { executePlan, simulatePlan } = require('./services/playwrightService');
const { getProfile, updateProfile } = require('./db/profileStore');
const { createSession, getSession } = require('./db/sessionStore');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/demo', express.static(path.join(__dirname, '../demo-site')));

// Profile Routes
app.get('/api/profile', (req, res) => {
    res.json(getProfile());
});

app.post('/api/profile', (req, res) => {
    updateProfile(req.body);
    res.json({ success: true, profile: getProfile() });
});

// Agent Routes
app.post('/api/parse-intent', async (req, res) => {
    try {
        const { goal } = req.body;
        const plan = await parseIntent(goal);
        res.json({ plan });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/execute', async (req, res) => {
    try {
        const { plan, mode } = req.body; // mode: 'simulate' | 'assist'
        const sessionId = createSession(plan, mode);

        let result;
        if (mode === 'simulate') {
            result = await simulatePlan(sessionId, plan);
        } else {
            result = await executePlan(sessionId, plan);
        }

        res.json({ sessionId, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/session/:id', (req, res) => {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Auto-launch the agent browser
    console.log("Launching Agent Browser...");
    try {
        const { startPersistentBrowser } = require('./services/playwrightService');
        await startPersistentBrowser();
    } catch (e) {
        console.error("Failed to launch browser:", e);
    }
});
