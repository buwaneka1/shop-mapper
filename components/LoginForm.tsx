'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions';

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
        <form action={loginAction} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Territory</label>
                <select name="territoryId" required className="mt-1 block w-full border rounded p-2">
                    <option value="">Select Territory</option>
                    {territories.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input name="username" type="text" required className="mt-1 block w-full border rounded p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input name="password" type="password" required className="mt-1 block w-full border rounded p-2" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Sign In
            </button>
        </form>
    );
}
