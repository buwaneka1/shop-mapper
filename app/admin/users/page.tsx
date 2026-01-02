import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createUser } from '@/app/actions';
import DeleteUserButton from '@/components/DeleteUserButton';

const prisma = new PrismaClient();

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
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <a href="/" className="text-blue-600 hover:underline">Back to Dashboard</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create User Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New User</h2>
                        <form action={createUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input name="username" type="text" required className="mt-1 block w-full border rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input name="password" type="password" required className="mt-1 block w-full border rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select name="role" required className="mt-1 block w-full border rounded p-2 bg-white">
                                    <option value="VIEWER">Viewer</option>
                                    <option value="REP">Representative</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign Lorry (For Reps)</label>
                                <select name="lorryId" className="mt-1 block w-full border rounded p-2 bg-white">
                                    <option value="">-- None --</option>
                                    {lorries.map((l: Lorry) => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Only required if Role is 'Representative'</p>
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium">
                                Create User
                            </button>
                        </form>
                    </div>

                    {/* Existing Users List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Users</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-2">Username</th>
                                        <th className="pb-2">Role</th>
                                        <th className="pb-2">Lorry</th>
                                        <th className="pb-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="py-2 font-medium">{u.username}</td>
                                            <td className="py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : u.role === 'REP' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-500">{u.lorry?.name || '-'}</td>
                                            <td className="py-2 text-right">
                                                {session.user.id !== u.id && ( // Cannot delete self
                                                    <DeleteUserButton userId={u.id} />
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
