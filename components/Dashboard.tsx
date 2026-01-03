'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ShopForm from './ShopForm';
import { addShop, logoutAction, deleteShop } from '@/app/actions';

// Dynamically import Map with no SSR
const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => <div className="h-full w-full bg-gray-200 animate-pulse flex items-center justify-center">Loading Map...</div> });

type Shop = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    ownerName?: string;
    contactNumber?: string;
    routeId: number;
    paymentMethod: string;
    creditPeriod?: number | null;
    paymentStatus: 'ON_TIME' | 'DELAYED' | 'EXTREMELY_DELAYED';
    avgBillValue: number;
    imageUrl?: string | null;
};

type Route = {
    id: number;
    name: string;
};

type Lorry = {
    id: number;
    name: string;
    routes: Route[];
};

interface DashboardProps {
    routes: Route[];
    shops: Shop[];
    userRole: string;
    username: string;
    lorries: Lorry[];
}

export default function Dashboard({ routes, shops, userRole, username, lorries }: DashboardProps) {
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedLorryId, setSelectedLorryId] = useState<number | null>(null);
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

    // Admin Tab State
    // Default to 'view' for Admin and Viewer, 'manage' for Rep
    const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');

    useEffect(() => {
        if (userRole === 'REP') {
            setActiveTab('manage');
        } else {
            setActiveTab('view');
        }
    }, [userRole]);

    // Viewer/Admin View specific states
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    const handleLocationSelect = (lat: number, lng: number) => {
        setSelectedLocation({ lat, lng });
    };

    const handleGeolocationRequest = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setSelectedLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, (error) => {
                alert('Error getting location: ' + error.message);
            });
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    const handleShopSubmit = async (formData: FormData) => {
        try {
            await addShop(formData);
            alert('Shop added successfully!');
            setSelectedLocation(null);
        } catch (e) {
            alert('Failed to save shop. You might not have permission.');
        }
    };

    // Filter shops for map/list display based on selection
    const filteredShops = useMemo(() => {
        // If in Manage mode (Admin/Rep), logic might differ or just show all/lorry based?
        // Current logic:
        if (selectedRouteId) {
            return shops.filter(s => s.routeId === selectedRouteId);
        }
        if (selectedLorryId) {
            const lorry = lorries.find(l => l.id === selectedLorryId);
            if (lorry) {
                const lorryRouteIds = lorry.routes.map(r => r.id);
                return shops.filter(s => lorryRouteIds.includes(s.routeId));
            }
        }

        // If Admin is in 'manage' mode or general view, and no filters applied, show all?
        // Or if Rep, show their lorry shops
        // The page.tsx passes filtered 'shops' prop for Reps already.
        // For Admin, 'shops' is ALL shops.
        return shops;
    }, [shops, selectedLorryId, selectedRouteId, lorries]);

    const getPaymentColor = (method: string) => {
        switch (method) {
            case 'CREDIT': return 'bg-yellow-100 text-yellow-800';
            case 'CHEQUE': return 'bg-purple-100 text-purple-800';
            default: return 'bg-green-100 text-green-800'; // CASH
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELAYED': return 'bg-yellow-500';
            case 'EXTREMELY_DELAYED': return 'bg-red-500';
            default: return 'bg-green-500'; // ON_TIME
        }
    };

    const isViewMode = activeTab === 'view';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Bar inside Dashboard for User Info */}
            <div className="bg-white border-b p-2 flex justify-between items-center px-4 shrink-0 shadow-sm z-20">
                <div className="text-sm flex items-center gap-4">
                    <span>Logged in as: <span className="font-bold">{username}</span> ({userRole})</span>
                    {userRole === 'ADMIN' && (
                        <div className="flex bg-gray-100 p-1 rounded">
                            <button
                                onClick={() => { setActiveTab('view'); setViewMode('list'); setSelectedLorryId(null); setSelectedRouteId(null); }}
                                className={`px-3 py-1 text-xs rounded transition-all ${activeTab === 'view' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                View Shops
                            </button>
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`px-3 py-1 text-xs rounded transition-all ${activeTab === 'manage' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                Manage Shops
                            </button>
                        </div>
                    )}
                    {userRole === 'ADMIN' && (
                        <a href="/admin/users" className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                            Manage Users
                        </a>
                    )}
                </div>
                <form action={logoutAction}>
                    <button className="text-sm text-red-600 hover:text-red-800 underline">Logout</button>
                </form>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
                {/* Sidebar / Form Area */}
                <div className={`w-full md:w-1/3 p-4 bg-gray-50 overflow-y-auto z-10 shadow-xl border-r border-gray-200 transition-all duration-300 ${isViewMode && selectedShop ? 'hidden md:block' : ''}`}>

                    {isViewMode ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 text-blue-800 rounded mb-4">
                                <h3 className="font-bold">Viewer Mode</h3>
                                <p className="text-sm mt-1">Navigate: Lorry &gt; Route &gt; Shops</p>
                            </div>

                            {/* Lorry Selection */}
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-700">1. Select Lorry</h4>
                                <div className="space-y-1">
                                    {lorries.map(lorry => (
                                        <button
                                            key={lorry.id}
                                            onClick={() => { setSelectedLorryId(lorry.id); setSelectedRouteId(null); setViewMode('list'); setSelectedShop(null); }}
                                            className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedLorryId === lorry.id ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                                        >
                                            {lorry.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Route Selection - Now acts as filter */}
                            {selectedLorryId && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                    <h4 className="font-semibold mb-2 mt-4 text-gray-700">2. Filter by Route</h4>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => { setSelectedRouteId(null); setViewMode('list'); setSelectedShop(null); }}
                                            className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedRouteId === null ? 'bg-green-600 text-white shadow' : 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-600'}`}
                                        >
                                            All Routes
                                        </button>
                                        {lorries.find(l => l.id === selectedLorryId)?.routes.map(route => (
                                            <button
                                                key={route.id}
                                                onClick={() => { setSelectedRouteId(route.id); setViewMode('list'); setSelectedShop(null); }}
                                                className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedRouteId === route.id ? 'bg-green-600 text-white shadow' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                                            >
                                                {route.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // MANAGE MODE (Admin 'manage' or Rep)
                        <>
                            <div className="p-4 bg-green-50 text-green-800 rounded mb-4">
                                <h3 className="font-bold">Manage Mode</h3>
                                <p className="text-sm mt-1">Add new shops to system.</p>
                            </div>
                            <ShopForm
                                routes={routes}
                                selectedLocation={selectedLocation}
                                onLocationRequest={handleGeolocationRequest}
                                onSubmit={handleShopSubmit}
                            />
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    <li>Use "Get My Location" to auto-fill coordinates.</li>
                                    <li>Or click on the map to manually pin-point the shop.</li>
                                    <li>Fill in details and click "Save Shop".</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* Main Content Area (Map or List, depending on mode) */}
                <div className="flex-1 relative z-0 h-full overflow-hidden bg-gray-100">
                    {/* View Mode Logic - Show if Lorry is selected (Route is optional filter) */}
                    {isViewMode && selectedLorryId ? (
                        <>
                            {/* Toggle Bar */}
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white rounded-full shadow-lg p-1 flex">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    List View
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Map View
                                </button>
                            </div>

                            {viewMode === 'list' ? (
                                <div className="h-full overflow-y-auto p-4 md:p-8 pt-20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredShops.length === 0 ? (
                                            <p className="text-gray-500 text-center col-span-full mt-10">No shops found for this selection.</p>
                                        ) : (
                                            filteredShops.map(shop => (
                                                <div
                                                    key={shop.id}
                                                    onClick={() => setSelectedShop(shop)}
                                                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(shop.paymentStatus)} shrink-0`} title={shop.paymentStatus.replace('_', ' ')} />
                                                            <h3 className="font-bold text-lg text-gray-900">{shop.name}</h3>
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPaymentColor(shop.paymentMethod)}`}>
                                                            {shop.paymentMethod}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Owner: {shop.ownerName}</p>
                                                    <p className="text-sm text-gray-500 mt-2">Avg Bill: <span className="font-mono">{shop.avgBillValue.toLocaleString()}</span></p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Map
                                    shops={filteredShops}
                                    onLocationSelect={undefined}
                                    selectedLocation={null}
                                />
                            )}

                            {/* Shop Detail Modal */}
                            {selectedShop && (
                                <div className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedShop(null)}>
                                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                        <div className="relative h-48 bg-gray-200">
                                            {selectedShop.imageUrl ? (
                                                <img src={selectedShop.imageUrl} alt={selectedShop.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No Image Available
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setSelectedShop(null)}
                                                className="absolute top-2 right-2 bg-white/80 p-1 rounded-full hover:bg-white text-gray-800"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedShop.name}</h2>
                                                {userRole === 'ADMIN' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm("Are you sure you want to delete this shop? This cannot be undone.")) {
                                                                try {
                                                                    await deleteShop(selectedShop.id);
                                                                    setSelectedShop(null);
                                                                } catch (e) {
                                                                    alert("Failed to delete shop");
                                                                }
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800 text-sm font-semibold border border-red-200 bg-red-50 px-3 py-1 rounded hover:bg-red-100"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Owner</span>
                                                    <span className="font-medium">{selectedShop.ownerName}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Contact</span>
                                                    <span className="font-medium text-blue-600">
                                                        <a href={`tel:${selectedShop.contactNumber}`}>{selectedShop.contactNumber}</a>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Payment</span>
                                                    <div className="text-right">
                                                        <span className={`font-medium px-2 py-0.5 rounded text-sm ${getPaymentColor(selectedShop.paymentMethod)}`}>
                                                            {selectedShop.paymentMethod}
                                                        </span>
                                                        {selectedShop.paymentMethod === 'CREDIT' && selectedShop.creditPeriod && (
                                                            <div className="text-xs text-gray-500 mt-1">({selectedShop.creditPeriod} Days Credit)</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Payment Status</span>
                                                    <span className="flex items-center gap-2 font-medium text-sm">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedShop.paymentStatus)}`} />
                                                        {selectedShop.paymentStatus.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Avg Bill</span>
                                                    <span className="font-medium font-mono">{selectedShop.avgBillValue.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between pt-2">
                                                    <span className="text-gray-600">Location</span>
                                                    <span className="text-sm font-mono bg-gray-100 px-2 rounded">
                                                        {selectedShop.latitude.toFixed(5)}, {selectedShop.longitude.toFixed(5)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <button
                                                    onClick={() => {
                                                        setViewMode('map');
                                                        setSelectedShop(null);
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                >
                                                    View Location on Map
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Default Map View (for Manage Mode OR View Mode before drilldown)
                        <Map
                            shops={filteredShops}
                            // Only allow pinning location in Manage mode
                            onLocationSelect={activeTab === 'manage' ? handleLocationSelect : undefined}
                            selectedLocation={activeTab === 'manage' ? selectedLocation : null}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
