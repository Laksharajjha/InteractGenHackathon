const { addLog } = require('../db/sessionStore');
const axios = require('axios');

// --- 1. DOM Vision Script (Snapshot) ---
const DOM_SNAPSHOT_SCRIPT = `
(function() {
    let idCounter = 1;
    const elements = document.querySelectorAll('button, a, input, textarea, select, [role="button"], [role="link"], [role="option"], li');
    const items = [];
    
    elements.forEach(el => {
        // Filter invisible
        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5 || window.getComputedStyle(el).visibility === 'hidden') return;
        
        // Add ID if missing
        let agentId = el.getAttribute('data-agent-id');
        if (!agentId) {
            agentId = idCounter++;
            el.setAttribute('data-agent-id', agentId);
            // Visual hint: Highlight interactables subtly
            // el.style.outline = '1px dashed rgba(99, 102, 241, 0.3)'; 
        } else {
             idCounter = Math.max(idCounter, parseInt(agentId) + 1);
        }

        let label = el.innerText || el.getAttribute('aria-label') || el.name || '';
        let placeholder = el.placeholder || '';
        
        label = label.replace(/\\n/g, ' ').trim().substring(0, 50);
        placeholder = placeholder.replace(/\\n/g, ' ').trim().substring(0, 50);
        
        let desc = label;
        if (placeholder) desc += \` [Placeholder: "\${placeholder}"]\`;
        
        items.push({
            id: agentId,
            tag: el.tagName.toLowerCase(),
            desc: desc || '[No Label]'
        });
    });
    return items;
})()
`;

// --- 2. Overlay Injection (Search Dock) ---
const INJECT_OVERLAY_SCRIPT = `
(function() {
    if (document.getElementById('agent-dock-overlay')) return;
    
    // Create the Dock UI
    const dock = document.createElement('div');
    dock.id = 'agent-dock-overlay';
    dock.innerHTML = \`
        <div class="agent-dock-glass">
            <div class="agent-icon">
                <div class="agent-eye"></div>
            </div>
            <div class="agent-input-wrapper">
                <input type="text" id="agent-input" placeholder="Ask Agent (e.g., 'Order Pizza')..." autocomplete="off">
            </div>
            <button id="agent-send-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
        </div>
        <div id="agent-status-bar" class="agent-status-hidden">
            <span id="agent-status-icon">🧠</span>
            <span id="agent-status-text">Ready</span>
        </div>
        <style>
            #agent-dock-overlay {
                position: fixed;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2147483647;
                font-family: 'Inter', system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            .agent-dock-glass {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                padding: 8px 8px 8px 16px;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
                width: 500px;
                transition: transform 0.2s;
            }
            .agent-dock-glass:focus-within {
                border-color: #6366f1;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.6), 0 0 0 2px rgba(99, 102, 241, 0.3);
            }
            .agent-icon {
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #6366f1, #ec4899);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .agent-eye {
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                animation: blink 4s infinite;
            }
            .agent-input-wrapper {
                flex: 1;
            }
            #agent-input {
                width: 100%;
                background: transparent;
                border: none;
                color: white;
                font-size: 15px;
                outline: none;
                font-weight: 400;
            }
            #agent-input::placeholder {
                color: #94a3b8;
            }
            #agent-send-btn {
                background: #334155;
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            #agent-send-btn:hover {
                background: #6366f1;
                transform: scale(1.05);
            }
            #agent-status-bar {
                background: rgba(0,0,0,0.8);
                padding: 6px 16px;
                border-radius: 20px;
                color: #cbd5e1;
                font-size: 13px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                border: 1px solid rgba(255,255,255,0.1);
                opacity: 1;
                transform: translateY(0);
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .agent-status-hidden {
                opacity: 0 !important;
                transform: translateY(10px) !important;
                pointer-events: none;
            }
            @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        </style>
    \`;

    document.body.appendChild(dock);

    // Bind Interactions
    const input = document.getElementById('agent-input');
    const sendBtn = document.getElementById('agent-send-btn');
    const statusText = document.getElementById('agent-status-text');
    const statusBar = document.getElementById('agent-status-bar');

    async function submit() {
        const goal = input.value.trim();
        if (!goal) return;
        
        input.value = '';
        input.blur();
        
        statusBar.classList.remove('agent-status-hidden');
        statusText.innerText = 'Starting...';
        
        // CALL BACKEND
        if (window.agent_run) {
            window.agent_run(goal);
        } else {
            alert('Agent Backend Disconnected');
        }
    }

    sendBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });
    
    // Highlight Visualization
    window.highlightElement = (id) => {
        const el = document.querySelector(\`[data-agent-id="\${id}"]\`);
        if (!el) return;
        
        // Scroll into view nicely
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Apply glow effect
        const originalTransition = el.style.transition;
        const originalBoxShadow = el.style.boxShadow;
        const originalOutline = el.style.outline;
        
        el.style.transition = 'all 0.3s ease';
        el.style.outline = '2px solid #a855f7'; // Purple
        el.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.6), inset 0 0 10px rgba(168, 85, 247, 0.3)';
        
        // Create a floating label
        const label = document.createElement('div');
        label.innerText = 'Target 🎯';
        label.style.position = 'absolute';
        label.style.background = '#a855f7';
        label.style.color = 'white';
        label.style.padding = '2px 6px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '10px';
        label.style.fontWeight = 'bold';
        label.style.zIndex = '999999';
        label.style.top = '-20px';
        label.style.left = '0';
        label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        // Handle positioning (simple append for now, better would be absolute body positioning)
        // For robustness, we just append to body and calculate pos
        const rect = el.getBoundingClientRect();
        label.style.position = 'fixed';
        label.style.top = (rect.top - 20) + 'px';
        label.style.left = rect.left + 'px';
        document.body.appendChild(label);

        // Remove after 2 seconds
        setTimeout(() => {
            el.style.outline = originalOutline;
            el.style.boxShadow = originalBoxShadow;
            el.style.transition = originalTransition;
            if (label.parentNode) label.parentNode.removeChild(label);
        }, 2000);
    };

    // Listen for status updates from backend
    window.updateAgentStatus = (icon, text) => {
        statusBar.classList.remove('agent-status-hidden');
        document.getElementById('agent-status-icon').innerText = icon;
        statusText.innerText = text;
        
        if (text.includes('Goal Achieved') || text.includes('Error')) {
            setTimeout(() => statusBar.classList.add('agent-status-hidden'), 5000);
        }
    };
})()
`;

// --- 3. Main Logic ---

async function runActiveLoop(sessionId, page, goal) {
    let steps = 0;
    const MAX_STEPS = 20;

    // Inject if missing (failsafe)
    try { await page.evaluate(INJECT_OVERLAY_SCRIPT); } catch (e) { }

    try {
        while (steps < MAX_STEPS) {
            steps++;

            // 1. OBSERVE
            await updateOverlay(page, '👀', 'Scanning page...');

            try {
                // Wait for network idle 
                await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { });

                // Retry DOM scan
                let interactiveElements = [];
                for (let i = 0; i < 3; i++) {
                    interactiveElements = await page.evaluate(DOM_SNAPSHOT_SCRIPT);
                    if (interactiveElements.length > 5) break;
                    await page.waitForTimeout(1500);
                }

                if (interactiveElements.length === 0) {
                    await updateOverlay(page, '⚠️', 'Empty page. Retrying...');
                }

                const currentUrl = page.url();

                // --- CAPTCHA DETECTION / HUMAN HANDOFF ---
                const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
                if (pageText.includes('verify you are human') ||
                    pageText.includes('security check') ||
                    pageText.includes('challenge-platform') ||
                    (pageText.includes('captcha') && pageText.length < 2000)) { // Short page + captcha = blockage

                    await updateOverlay(page, '🛑', 'CAPTCHA Detected! Please solve it for me.');
                    addLog(sessionId, { type: 'info', message: '🛑 Agent paused for Manual CAPTCHA solution.' });

                    // Wait for user to solve it (15 seconds)
                    await page.waitForTimeout(15000);

                    await updateOverlay(page, '👀', 'Thanks! Resuming scan...');
                    continue; // Skip this loop iteration and re-scan
                }

                // 2. THINK
                await updateOverlay(page, '🧠', 'Thinking...');

                const prompt = `
                You are an autonomous AI Agent.
                GOAL: "${goal}"
                URL: "${currentUrl}"
                
                UI ELEMENTS:
                ${interactiveElements.slice(0, 300).map(i => `${i.id}: <${i.tag}> ${i.desc}`).join('\n')}
                
                Determine the SINGLE NEXT interaction.
                
                RULES:
                1. **Prioritize Location**: If site asks for location/address (e.g. Swiggy/UberEats), set it first!
                2. **Search Engines**: If on Google/DuckDuckGo, you MUST click a result to leave the search engine.
                3. **Autocomplete**: For "From"/"To" or "Location" fields, do NOT hit Enter immediately. Type the text, then in the next step, CLICK the correct suggestion from the list.
                4. **Be Precise**: Use the exact ID of the element.
                5. **Done**: Only say "done" if you are on the final service page.
                
                Return JSON: { "action": "click"|"fill"|"goto"|"done", "target": "ID", "value": "text", "reason": "reason" }
                `;

                addLog(sessionId, { type: 'step', step: { action: 'thinking', target: 'AI is planning...' }, status: 'running' });

                const aiResponse = await callLLM(prompt);
                const decision = parseDecision(aiResponse);

                // Update Overlay with Thought
                await updateOverlay(page, '⚡', decision.reason || `Action: ${decision.action}`);
                await page.waitForTimeout(1000);

                console.log(`Step ${steps}:`, decision);
                addLog(sessionId, { type: 'step_complete', step: { action: 'thought', target: decision.reason } });

                if (decision.action === 'done') {
                    await updateOverlay(page, '✅', 'Goal Achieved!');
                    addLog(sessionId, { type: 'info', message: '✅ Goal Achieved!' });
                    break;
                }

                // 3. ACT
                const stepLog = { action: decision.action, target: decision.target };
                addLog(sessionId, { type: 'step', step: stepLog, status: 'running' });

                if (decision.action === 'goto') {
                    await page.goto(decision.target);
                    // Re-inject overlay after nav
                    await page.waitForLoadState('domcontentloaded');
                    await page.evaluate(INJECT_OVERLAY_SCRIPT);
                } else if (decision.action === 'click') {
                    // HIGHLIGHT BEFORE CLICK
                    await page.evaluate((id) => window.highlightElement && window.highlightElement(id), decision.target);
                    await page.waitForTimeout(800); // Visual pause for effect

                    await page.click(`[data-agent-id="${decision.target}"]`, { timeout: 5000 });
                } else if (decision.action === 'fill') {
                    // HIGHLIGHT BEFORE FILL
                    await page.evaluate((id) => window.highlightElement && window.highlightElement(id), decision.target);
                    await page.waitForTimeout(800);

                    const selector = `[data-agent-id="${decision.target}"]`;
                    // Slow typing to trigger JS events
                    await page.click(selector); // Focus first
                    await page.type(selector, decision.value, { delay: 150 });

                    // IMPROVED AUTOCOMPLETE HANDLING:
                    // For search/location inputs, we almost always want to pick the first result.
                    // The most reliable way is: Type -> Wait -> ArrowDown -> Enter
                    if (decision.reason.toLowerCase().includes('search') ||
                        decision.reason.toLowerCase().includes('enter') ||
                        decision.reason.toLowerCase().includes('location') ||
                        decision.reason.toLowerCase().includes('station') ||
                        decision.reason.toLowerCase().includes('city')) {

                        await page.waitForTimeout(2000); // Wait for dropdown results to render
                        await page.press(selector, 'ArrowDown');
                        await page.waitForTimeout(500);
                        await page.press(selector, 'Enter');
                    }
                }

                addLog(sessionId, { type: 'step_complete', step: stepLog });
                await page.waitForTimeout(1000);

            } catch (innerErr) {
                console.error("Step Error:", innerErr);
                await updateOverlay(page, '❌', 'Retrying step...');
            }
        }
    } catch (e) {
        console.error("Active Loop Error:", e);
        addLog(sessionId, { type: 'error', error: e.message });
        try { await updateOverlay(page, '❌', 'Error: ' + e.message.substring(0, 20)); } catch (err) { }
    }
}

async function updateOverlay(page, icon, text) {
    try {
        await page.evaluate(({ icon, text }) => {
            if (window.updateAgentStatus) window.updateAgentStatus(icon, text);
        }, { icon, text });
    } catch (e) { }
}

async function callLLM(prompt) {
    const models = [
        "google/gemini-2.0-flash-001",
        "mistralai/mistral-7b-instruct",
        "nousresearch/hermes-3-llama-3.1-405b"
    ];

    for (const model of models) {
        try {
            const res = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: model,
                messages: [{ role: "user", content: prompt }]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000"
                },
                timeout: 20000
            });
            return res.data.choices[0].message.content;
        } catch (e) {
            console.warn(`Model ${model} failed:`, e.message);
        }
    }
    throw new Error("All AI models failed.");
}

function parseDecision(text) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { }
    return { action: 'done', reason: 'Failed to parse JSON' };
}

const getInjectionScript = () => INJECT_OVERLAY_SCRIPT;

module.exports = { runActiveLoop, getInjectionScript };
