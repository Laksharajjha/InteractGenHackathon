import React, { useState } from 'react';

function InputParser({ apiBase, onPlanParsed }) {
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleParse = async () => {
        if (!goal.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/parse-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            onPlanParsed(data.plan);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                <h2 className="text-xl font-semibold text-white">1. Define Goal</h2>
            </div>

            <div className="relative">
                <textarea
                    className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none shadow-inner font-light"
                    rows="3"
                    placeholder="What would you like me to do? (e.g., 'Order a Margherita Pizza')"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                />
                <div className="absolute bottom-3 right-3">
                    {loading && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-400">Try:</span>
                    <button onClick={() => setGoal('Order a Margherita Pizza')} className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors">Order Pizza</button>
                    <button onClick={() => setGoal('Buy a Coffee Mug')} className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors">Buy Coffee</button>
                </div>

                <button
                    onClick={handleParse}
                    disabled={loading || !goal.trim()}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all shadow-lg shadow-indigo-500/25 w-full sm:w-auto"
                >
                    {loading ? 'Thinking...' : 'Generate Plan →'}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}
        </div>
    );
}

export default InputParser;
