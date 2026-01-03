'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions';
import SubmitButton from './SubmitButton';

type Territory = {
    id: number;
    name: string;
};

export default function LoginForm({ territories }: { territories: Territory[] }) {
    // using useActionState (if available in this next/react version helpers) or just standard form pending
    // checking previous page.tsx it used `useActionState` so assuming it's available.
    // Wait, previous file had `import { useActionState } from 'react';`

    // Note: useActionState in React 19 might need careful usage or polyfills if not fully stable, 
    // but sticking to what was there.

    // Actually, simple form action works without state if we just redirect on success.

    return (
        <form action={loginAction} className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Territory</label>
                <div className="relative">
                    <select name="territoryId" required className="input-field appearance-none bg-white">
                        <option value="">Select your territory</option>
                        {territories.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <input name="username" type="text" required placeholder="Enter username" className="input-field pl-10" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input name="password" type="password" required placeholder="••••••••" className="input-field pl-10" />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <SubmitButton className="btn-primary py-3 shadow-lg shadow-blue-500/20" loadingText="Signing in...">
                    Sign In
                </SubmitButton>
            </div>
        </form>
    );
}
