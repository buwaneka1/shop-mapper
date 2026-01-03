import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createLorry, createRoute, updateLorry, updateRoute } from '@/app/actions';
import DeleteLorryButton from '@/components/DeleteLorryButton';
import DeleteRouteButton from '@/components/DeleteRouteButton';
import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';


export const dynamic = 'force-dynamic';

export default async function AdminLogisticsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const { editLorryId, editRouteId } = await searchParams;

    // Fetch all data needed
    const territories = await prisma.territory.findMany();
    const lorries = await prisma.lorry.findMany({
        include: { territory: true, routes: true }
    });
    const routes = await prisma.route.findMany({
        include: { lorry: true }
    });

    const editingLorry = editLorryId ? lorries.find(l => l.id === parseInt(editLorryId)) : null;
    const editingRoute = editRouteId ? routes.find(r => r.id === parseInt(editRouteId)) : null;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Logistics Management</h1>
                    <div className="space-x-4">
                        <Link href="/admin/users" className="text-blue-600 hover:underline">Users</Link>
                        <Link href="/" className="text-blue-600 hover:underline">Dashboard</Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* --- LORRY MANAGEMENT --- */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">
                                {editingLorry ? `Edit Lorry: ${editingLorry.name}` : 'Add New Lorry'}
                            </h2>
                            <form action={editingLorry ? updateLorry : createLorry} className="space-y-4">
                                {editingLorry && <input type="hidden" name="id" value={editingLorry.id} />}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lorry Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="e.g. Lorry 1"
                                        className="mt-1 block w-full border rounded p-2"
                                        defaultValue={editingLorry?.name || ''}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Territory</label>
                                    <select
                                        name="territoryId"
                                        required
                                        className="mt-1 block w-full border rounded p-2 bg-white"
                                        defaultValue={editingLorry?.territoryId || ''}
                                    >
                                        <option value="">Select Territory</option>
                                        {territories.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <SubmitButton
                                        className={`flex-1 text-white py-2 rounded font-medium ${editingLorry ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                        loadingText={editingLorry ? 'Updating...' : 'Creating...'}
                                    >
                                        {editingLorry ? 'Update Lorry' : 'Create Lorry'}
                                    </SubmitButton>
                                    {editingLorry && (
                                        <Link href="/admin/logistics" className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">
                                            Cancel
                                        </Link>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Lorries</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-2">Name</th>
                                            <th className="pb-2">Territory</th>
                                            <th className="pb-2">Routes</th>
                                            <th className="pb-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {lorries.map((l) => (
                                            <tr key={l.id} className={editingLorry?.id === l.id ? 'bg-orange-50' : ''}>
                                                <td className="py-2 font-medium">{l.name}</td>
                                                <td className="py-2 text-gray-500">{l.territory?.name || '-'}</td>
                                                <td className="py-2 text-gray-500">{l.routes.length}</td>
                                                <td className="py-2 text-right space-x-2">
                                                    <Link href={`/admin/logistics?editLorryId=${l.id}`} className="text-blue-600 hover:text-blue-900 text-xs font-semibold">
                                                        Edit
                                                    </Link>
                                                    <span className="text-gray-300">|</span>
                                                    <div className="inline-block">
                                                        <DeleteLorryButton id={l.id} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {lorries.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-center text-gray-500">No lorries found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* --- ROUTE MANAGEMENT --- */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">
                                {editingRoute ? `Edit Route: ${editingRoute.name}` : 'Add New Route'}
                            </h2>
                            <form action={editingRoute ? updateRoute : createRoute} className="space-y-4">
                                {editingRoute && <input type="hidden" name="id" value={editingRoute.id} />}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Route Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="e.g. Galle Town"
                                        className="mt-1 block w-full border rounded p-2"
                                        defaultValue={editingRoute?.name || ''}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign to Lorry</label>
                                    <select
                                        name="lorryId"
                                        required
                                        className="mt-1 block w-full border rounded p-2 bg-white"
                                        defaultValue={editingRoute?.lorryId || ''}
                                    >
                                        <option value="">Select Lorry</option>
                                        {lorries.map((l) => (
                                            <option key={l.id} value={l.id}>{l.name} ({l.territory?.name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <SubmitButton
                                        className={`flex-1 text-white py-2 rounded font-medium ${editingRoute ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                                        loadingText={editingRoute ? 'Updating...' : 'Creating...'}
                                    >
                                        {editingRoute ? 'Update Route' : 'Create Route'}
                                    </SubmitButton>
                                    {editingRoute && (
                                        <Link href="/admin/logistics" className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">
                                            Cancel
                                        </Link>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Routes</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-2">Name</th>
                                            <th className="pb-2">Lorry</th>
                                            <th className="pb-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {routes.map((r) => (
                                            <tr key={r.id} className={editingRoute?.id === r.id ? 'bg-orange-50' : ''}>
                                                <td className="py-2 font-medium">{r.name}</td>
                                                <td className="py-2 text-gray-500">{r.lorry.name}</td>
                                                <td className="py-2 text-right space-x-2">
                                                    <Link href={`/admin/logistics?editRouteId=${r.id}`} className="text-blue-600 hover:text-blue-900 text-xs font-semibold">
                                                        Edit
                                                    </Link>
                                                    <span className="text-gray-300">|</span>
                                                    <div className="inline-block">
                                                        <DeleteRouteButton id={r.id} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {routes.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-4 text-center text-gray-500">No routes found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
