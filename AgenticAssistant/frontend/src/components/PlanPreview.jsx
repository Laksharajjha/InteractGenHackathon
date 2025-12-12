import React, { useState, useEffect } from 'react';

function PlanPreview({ apiBase, plan, onPlanExecuted }) {
    const [editablePlan, setEditablePlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        setEditablePlan(JSON.stringify(plan, null, 2));
    }, [plan]);

    const handleExecute = async (mode) => {
        setLoading(true);
        setMessage(null);
        try {
            const parsedPlan = JSON.parse(editablePlan);
            const res = await fetch(`${apiBase}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: parsedPlan, mode })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            onPlanExecuted(data.sessionId);
            setMessage(mode === 'simulate' ? 'Simulation started...' : 'Execution started...');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-semibold text-white">2. Action Plan</h2>
            </div>

            <div className="mb-4 relative group">
                <textarea
                    className="w-full p-4 font-mono text-xs md:text-sm bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 h-64 outline-none focus:border-emerald-500/50 transition-all custom-scrollbar resize-none"
                    value={editablePlan}
                    onChange={(e) => setEditablePlan(e.target.value)}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 pointer-events-none">
                    Editable JSON
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <span className="text-amber-500 text-base">🛡️</span>
                    <span>Safety Mode Active</span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => handleExecute('simulate')}
                        disabled={loading}
                        className="flex-1 md:flex-none border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 px-5 py-2.5 rounded-xl font-medium disabled:opacity-50 transition-all"
                    >
                        Simulate
                    </button>
                    <button
                        onClick={() => handleExecute('assist')}
                        disabled={loading}
                        className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transform active:scale-95 transition-all"
                    >
                        Execute Now
                    </button>
                </div>
            </div>

            {message && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm text-center">
                    {message}
                </div>
            )}
        </div>
    );
}

export default PlanPreview;
