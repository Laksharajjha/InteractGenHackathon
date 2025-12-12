const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SESSIONS_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR);
}

function createSession(plan, mode) {
    const id = crypto.randomUUID();
    const session = {
        id,
        startTime: new Date().toISOString(),
        mode,
        plan,
        logs: []
    };
    saveSession(session);
    return id;
}

function getSession(id) {
    const filePath = path.join(SESSIONS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function updateSession(id, updateFn) {
    const session = getSession(id);
    if (session) {
        const updated = updateFn(session);
        saveSession(updated);
    }
}

function saveSession(session) {
    fs.writeFileSync(path.join(SESSIONS_DIR, `${session.id}.json`), JSON.stringify(session, null, 2));
}

function addLog(id, entry) {
    updateSession(id, (session) => {
        session.logs.push({
            timestamp: new Date().toISOString(),
            ...entry
        });
        return session;
    });
}

module.exports = { createSession, getSession, addLog };
