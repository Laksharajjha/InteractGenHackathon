import React, { useEffect, useState, useRef } from 'react';

function SessionLogs({ apiBase, sessionId }) {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('Waiting...');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!sessionId) return;

        const fetchLogs = () => {
            fetch(`${apiBase}/session/${sessionId}`)
                .then(r => r.json())
                .then(data => {
                    if (data) {
                        setLogs(data.logs || []);
                        setStatus(data.mode ? `${data.mode.toUpperCase()} MODE` : 'ACTIVE');
                    }
                })
                .catch(err => console.error(err));
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 1000);
        return () => clearInterval(interval);
    }, [apiBase, sessionId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!sessionId) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700">
                <div className="text-4xl mb-4 opacity-50">📡</div>
                <p className="text-slate-500 font-medium">Ready for Agent Signals</p>
                <p className="text-sm text-slate-600 mt-2">Logs will appear here when you execute a plan.</p>
            </div>
        );
    }

    return (
        <div className="bg-black/90 text-green-400 p-0 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col h-[500px]">
            <div className="bg-slate-900/80 p-3 border-b border-slate-800 flex justify-between items-center backdrop-blur">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="ml-3 text-xs font-mono text-slate-400">agent_session_{sessionId.slice(0, 6)}.log</span>
                </div>
                <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/20">{status}</span>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
                {logs.length === 0 && <span className="opacity-50 animate-pulse">Initializing agent connection...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-slate-800 pl-3 py-1 hover:bg-white/5 transition-colors">
                        <span className="text-slate-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={`font-bold mr-2 ${log.type === 'error' ? 'text-red-500' :
                                log.type === 'info' ? 'text-blue-400' :
                                    log.type === 'step' ? 'text-yellow-400' :
                                        log.type === 'step_complete' ? 'text-green-500' : ''
                            }`}>
                            {log.type.toUpperCase()}
                        </span>
                        <span className="text-slate-300">
                            {log.message || (log.step ? `${log.step.action} -> ${log.step.target}` : JSON.stringify(log))}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SessionLogs;
