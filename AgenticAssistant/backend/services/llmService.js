require('dotenv').config();
const axios = require('axios');

async function parseIntent(goal) {
    console.log(`Thinking about: ${goal}`);
    const goalLower = goal.toLowerCase();

    // --- STAGE 1: Fast Local Heuristics (Demo & Known Patterns) ---

    // 1. Wikipedia Search (Optimized)
    if (goalLower.includes('search') && (goalLower.includes('wiki') || goalLower.includes('wikipedia'))) {
        let topic = goal.replace(/search for|search|wiki|find out about|on wikipedia/gi, '').trim();
        topic = topic.replace(/[?.,]/g, '');
        return [
            { action: 'goto', target: 'https://www.wikipedia.org' },
            { action: 'fill', target: 'input[name="search"]', data: { value: topic } },
            { action: 'click', target: 'button.pure-button-primary-progressive' },
            { action: 'note', target: `Searching Wikipedia for: ${topic}` }
        ];
    }

    // 2. Demo Site (Restaurant)
    if (goalLower.includes('pizza') || goalLower.includes('burger') || goalLower.includes('ramen')) {
        const itemMap = {
            'pizza': '[data-item="pizza-btn"]',
            'burger': '[data-item="burger-btn"]',
            'ramen': '[data-item="ramen-btn"]'
        };
        const itemSelector = Object.keys(itemMap).find(k => goalLower.includes(k));

        if (itemSelector) {
            return [
                { action: 'goto', target: 'http://localhost:3000/demo/index.html' },
                { action: 'click', target: itemMap[itemSelector] },
                { action: 'fill', target: '#checkout-form', data: { useProfile: true } },
                { action: 'click', target: '#place-order-btn' }
            ];
        }
    }

    // --- STAGE 2: Real LLM (OpenRouter) ---
    // If no local match, ask the AI to plan for the general web.

    if (!process.env.OPENROUTER_API_KEY) {
        return [{ action: 'note', target: 'No API Key. Only demo commands available.' }];
    }

    const models = [
        "google/gemini-2.0-flash-001",
        "nousresearch/hermes-3-llama-3.1-405b",
        "mistralai/mistral-7b-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct:free" // Adding another solid free option
    ];

    console.log("Routing to OpenRouter AI...");

    for (const model of models) {
        try {
            console.log(`Trying model: ${model}`);
            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: model,
                messages: [
                    {
                        "role": "system",
                        "content": `You are an expert Playwright automation engineer. Convert the user's goal into a JSON plan.
                        
                        The plan must be a JSON Array of steps having keys: "action", "target", "data" (optional).
                        "action" can be: "goto", "click", "fill", "note".
                        "target" must be a valid CSS selector (preferred) or URL.
                        "data" is an object, e.g. { "value": "text to type" }.
                        
                        CRITICAL rules:
                        1. Use specific CSS selectors matching the likely real-world website.
                        2. If the goal is a generic search (e.g. 'search for X'), USE 'https://duckduckgo.com' instead of Google to avoid CAPTCHAs. Only use Google if explicitly requested.
                        3. If the goal is a search, always add a 'click' or 'press' action to submit.
                        4. Return ONLY the raw JSON array. No markdown, no explanations.`
                    },
                    { "role": "user", "content": goal }
                ]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
                },
                timeout: 10000 // 10s timeout per model
            });

            const content = response.data.choices[0].message.content;
            const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const plan = JSON.parse(jsonStr);

            if (Array.isArray(plan)) {
                console.log(`Success with ${model}`);
                return plan;
            }
        } catch (error) {
            console.warn(`Failed with ${model}:`, error.message);
            // Continue to next model
        }
    }

    return [
        {
            action: 'active_loop',
            target: 'https://www.google.com', // Default starting point if not specified
            data: { goal: goal }
        }
    ];
}

module.exports = { parseIntent };
