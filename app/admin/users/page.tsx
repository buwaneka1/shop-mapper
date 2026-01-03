import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createUser } from '@/app/actions';
import DeleteUserButton from '@/components/DeleteUserButton';
import SubmitButton from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

type Lorry = {
    id: number;
    name: string;
};

type UserWithLorry = {
    id: number;
    username: string;
    role: string;
    lorry: Lorry | null;
};

export default async function AdminUsersPage() {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const lorries: Lorry[] = await prisma.lorry.findMany();
    const users: UserWithLorry[] = await prisma.user.findMany({
        include: { lorry: true }
    });

    return (
        <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Create and manage access for reps and admins.</p>
                </div>
                <a href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Dashboard
                </a>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form - Sticky on Desktop */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Add User</h2>
                        </div>

                        <form action={createUser} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                                <input name="username" type="text" required placeholder="johndoe" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                <input name="password" type="password" required placeholder="••••••••" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                                <div className="relative">
                                    <select name="role" required className="input-field appearance-none bg-white">
                                        <option value="VIEWER">Viewer (Read Only)</option>
                                        <option value="REP">Representative</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Lorry <span className="text-slate-400 font-normal">(Reps Only)</span></label>
                                <div className="relative">
                                    <select name="lorryId" className="input-field appearance-none bg-white">
                                        <option value="">-- No Lorry Assigned --</option>
                                        {lorries.map((l: Lorry) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2">
                                <SubmitButton className="btn-primary" loadingText="Creating User...">
                                    Create User
                                </SubmitButton>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Existing Users List */}
                <div className="lg:col-span-2">
                    <div className="card overflow-hidden">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 px-1">Team Members</h2>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 bg-white">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Lorry</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {u.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4 text-sm font-semibold text-slate-900">{u.username}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                    ${u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-100 ring-1 ring-red-600/10' :
                                                        u.role === 'REP' ? 'bg-blue-50 text-blue-700 border-blue-100 ring-1 ring-blue-600/10' :
                                                            'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-600/10'}`}>
                                                    {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {u.lorry ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0014 7z" />
                                                        </svg>
                                                        {u.lorry.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {session.user.id !== u.id && (
                                                    <div className="flex justify-end">
                                                        <DeleteUserButton userId={u.id} />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
