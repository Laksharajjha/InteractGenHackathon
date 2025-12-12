import React, { useState } from 'react';
import InputParser from './components/InputParser';
import PlanPreview from './components/PlanPreview';
import ProfileEditor from './components/ProfileEditor';
import SessionLogs from './components/SessionLogs';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [activeTab, setActiveTab] = useState('agent');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <header className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Agentic Assistant
            </h1>
            <p className="text-xs text-slate-500 font-mono">MVP v1.0</p>
          </div>
        </div>
        <nav className="flex bg-slate-800/50 p-1 rounded-full border border-slate-700/50 backdrop-blur-sm">
          <TabButton id="agent" label="Agent" />
          <TabButton id="profile" label="Profile" />
          <TabButton id="logs" label="Logs" />
        </nav>
      </header>

      <main className="max-w-5xl mx-auto">
        {activeTab === 'agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <InputParser apiBase={API_BASE} onPlanParsed={setCurrentPlan} />
              {currentPlan && (
                <PlanPreview
                  apiBase={API_BASE}
                  plan={currentPlan}
                  onPlanExecuted={setCurrentSessionId}
                />
              )}
            </div>

            <div className="space-y-6">
              <SessionLogs apiBase={API_BASE} sessionId={currentSessionId} />
            </div>
          </div>
        )}

        {activeTab === 'profile' && <ProfileEditor apiBase={API_BASE} />}

        {activeTab === 'logs' && (
          <div className="text-center p-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
            <p className="text-slate-500">View session logs in the Agent tab sidebar during execution.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
