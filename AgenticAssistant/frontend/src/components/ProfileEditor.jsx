import React, { useEffect, useState } from 'react';

function ProfileEditor({ apiBase }) {
    const [profile, setProfile] = useState({});
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetch(`${apiBase}/profile`).then(r => r.json()).then(setProfile);
    }, [apiBase]);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        await fetch(`${apiBase}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        setMsg('Profile Updated Successfully');
        setTimeout(() => setMsg(''), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-xl">
            <div className="mb-8 border-b border-slate-700 pb-4">
                <h2 className="text-2xl font-semibold text-white">User Profile</h2>
                <p className="text-slate-400 text-sm mt-1">Agent uses this information to autofill forms during execution.</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                            name="name"
                            value={profile.name || ''}
                            onChange={handleChange}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">Phone</label>
                        <input
                            name="phone"
                            value={profile.phone || ''}
                            onChange={handleChange}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">Delivery Address</label>
                    <input
                        name="address"
                        value={profile.address || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">Payment Method (Mock)</label>
                    <input
                        name="paymentMethod"
                        value={profile.paymentMethod || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none opacity-60"
                        readOnly
                    />
                    <p className="text-xs text-slate-500 mt-1">Payment info is mocked for security in this demo.</p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-500 font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>

                {msg && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-center text-sm animate-in fade-in duration-300">
                        {msg}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileEditor;
