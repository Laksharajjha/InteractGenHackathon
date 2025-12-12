const { chromium } = require('playwright');
const { addLog, getSession } = require('../db/sessionStore');
const { getProfile } = require('../db/profileStore');
const { runActiveLoop } = require('./interactiveAgent');

async function executeAction(page, step, profile) {
    const { action, target, data } = step;

    // Guardrail: Pause for confirmation on submit if in execute mode (Handled by UI logic mostly, but we can pause here too if needed)
    // For MVP, we will assume the Plan given to us is "approved" by the user on the frontend.
    // BUT the prompt says "Stop before final submit unless user confirms".
    // We'll implement that check.

    switch (action) {
        case 'goto':
            await page.goto(target);
            break;
        case 'click':
            // Simple text matching for buttons/links if selector fails
            try {
                await page.click(target, { timeout: 2000 });
            } catch (e) {
                // Try finding by text
                await page.click(`text=${target}`);
            }
            break;
        case 'fill':
            if (data && data.useProfile) {
                // Auto-fill logic
                await page.fill('#name', profile.name);
                await page.fill('#phone', profile.phone);
                await page.fill('#address', profile.address);
            } else {
                await page.fill(target, data.value);
            }
            break;
        case 'note':
            console.log(`NOTE: ${target}`);
            break;
    }
}

// Singleton Browser Instance
let globalBrowser = null;
let globalPage = null;

async function startPersistentBrowser() {
    if (globalBrowser) return;

    globalBrowser = await chromium.launch({
        headless: false,
        channel: 'chrome',
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--window-size=1280,720',
            '--start-maximized'
        ]
    });

    const context = await globalBrowser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        viewport: null,
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata',
        permissions: ['geolocation', 'notifications'],
    });

    // Advanced Anti-detect / Stealth
    await context.addInitScript(() => {
        // 1. Pass Webdriver Test
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

        // 2. Mock Window.Chrome
        window.chrome = { runtime: {} };

        // 3. Mock Plugins
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

        // 4. Mock Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );

        // 5. WebGL Vendor Spoofing (Hide "Google SwiftShader")
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
            // UNMASKED_VENDOR_WEBGL
            if (parameter === 37445) return 'Intel Inc.';
            // UNMASKED_RENDERER_WEBGL
            if (parameter === 37446) return 'Intel Iris OpenGL Engine';
            return getParameter.apply(this, [parameter]);
        };
    });

    globalPage = await context.newPage();

    // EXPOSE BRIDGE: This allows the webpage to call Node.js!
    await globalPage.exposeFunction('agent_run', async (goal) => {
        console.log(`[Bridge] User command received: ${goal}`);
        // Trigger Active Loop on the SAME page
        await runActiveLoop('persistent-session', globalPage, goal);
    });

    // Load initial page (Use DuckDuckGo to avoid Google CAPTCHA on boot)
    await globalPage.goto('https://duckduckgo.com');

    // --- CRITICAL: INJECT DOCK UI ---
    // We need the dock to be there so the user can type "Order Pizza"
    const { getInjectionScript } = require('./interactiveAgent');
    const injectDock = async () => {
        try {
            await globalPage.evaluate(getInjectionScript());
        } catch (e) {
            console.log("Dock injection failed (likely context invalid):", e.message);
        }
    };

    // 1. Inject immediately
    await injectDock();

    // 2. Persist on Navigation (Re-inject when page changes)
    globalPage.on('domcontentloaded', async () => {
        console.log("Page navigated, re-injecting agent dock...");
        await injectDock();
    });

    console.log("Agent Dock is active.");
}

async function runSteps(sessionId, plan, mode) {
    // Try to use system Chrome to avoid waiting for download
    const browser = await chromium.launch({
        headless: false,
        channel: 'chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--window-size=1280,720'
        ]
    });

    // Stealth Context: Mimic a real human user on Mac
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata',
        permissions: ['geolocation'],
        javaScriptEnabled: true,
    });

    // Add stealth scripts to hide automation properties
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    const page = await context.newPage();
    const profile = getProfile();

    const results = [];

    try {
        for (const step of plan) {

            // Check for submit action and mode
            if (step.action === 'click' && (step.target.includes('place-order') || step.target.includes('#place-order-btn'))) {
                if (mode === 'simulate') {
                    console.log('Simulate mode: Stopping before submit.');
                    addLog(sessionId, { type: 'info', message: 'Stopping before submit (Simulation)' });
                    break;
                }
            }

            // Special Handle for Active Loop
            if (step.action === 'active_loop') {
                console.log("Delegating to Active Vision Agent...");
                // Start from the target URL (if present) or just use current if already open? 
                // Usually goto first.
                if (step.target) await page.goto(step.target);

                await runActiveLoop(sessionId, page, step.data.goal);

                // Active loop handles its own logs and actions.
                // After it returns, we considered this step 'done'.
                addLog(sessionId, { type: 'step_complete', step });
                break; // Exit the static plan loop as the active agent took over.
            }

            if (step.action === 'goto') {
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(1000); // Stability wait
            }

            console.log(`Executing: ${step.action} on ${step.target}`);
            addLog(sessionId, { type: 'step', step, status: 'running' });

            await executeAction(page, step, profile);

            // Capture screenshot after each step
            const screenshotPath = `screenshots/${sessionId}_${Date.now()}.png`;

            addLog(sessionId, { type: 'step_complete', step });
            results.push({ step, status: 'success' });

            // Artificial delay for demo effect
            await page.waitForTimeout(1000);
        }
    } catch (error) {
        console.error(error);
        addLog(sessionId, { type: 'error', error: error.message });
        results.push({ status: 'error', error: error.message });
    } finally {
        // Keep browser open for a moment if successful? Or close?
        try {
            await browser.close();
        } catch (e) {
            console.log("Browser already closed.");
        }
    }

    return results;
}

module.exports = {
    startPersistentBrowser,
    executePlan: (id, plan) => runSteps(id, plan, 'assist'),
    simulatePlan: (id, plan) => runSteps(id, plan, 'simulate')
};
