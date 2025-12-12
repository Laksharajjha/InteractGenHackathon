# Agentic Web Assistant MVP

A lightweight agentic AI web assistant that converts natural language goals into Playwright actions on a demo website.

## Features
- **Think**: LLM (Mocked/Simple) parses goals into JSON plans.
- **Plan**: Review and edit the plan before implementation.
- **Act**: Playwright executes actions on a local demo site.
- **Observe**: Real-time session logs and screenshots (simulated).
- **Guardrails**: Confirmation required for execution; simulation mode available.

## Structure
- `/backend`: Node.js + Express server + Playwright agent.
- `/frontend`: React + Tailwind interface.
- `/demo-site`: Static restaurant website for automation target.

## Prerequisites
- Node.js installed.
- Browsers installed for Playwright (`npx playwright install` might be needed if not present).

## Setup & Run

1. **Install Dependencies**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   (Or run `npm install` in `backend` and `frontend` folders manually).

2. **Start the App**
   ```bash
   chmod +x start-all.sh
   ./start-all.sh
   ```
   This will start:
   - Backend on http://localhost:3000
   - Frontend on http://localhost:5173
   - Demo Site on http://localhost:3000/demo/index.html

3. **Usage**
   - Open http://localhost:5173
   - Type a goal (see examples below).
   - Click "Parse Plan".
   - Review the steps.
   - Click "Simulate" to watch it run without submitting.
   - Click "Execute" to place the order.

## Example Prompts
- "Order a Margherita Pizza."
- "Buy a Cheeseburger and check out using my profile."
- "Get me a Coffee Mug."

## API Endpoints
- `POST /api/parse-intent`: Convert text to plan.
- `POST /api/execute`: Run Playwright.
- `GET /api/profile`: Get user profile.
