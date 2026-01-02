'use client';

import { useState } from 'react';
import Spinner from './Spinner';

type Route = {
    id: number;
    name: string;
};

interface ShopFormProps {
    routes: Route[];
    selectedLocation: { lat: number, lng: number } | null;
    onLocationRequest: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
}

export default function ShopForm({ routes, selectedLocation, onLocationRequest, onSubmit }: ShopFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);

        // Ensure location is added
        if (selectedLocation) {
            formData.set('latitude', selectedLocation.lat.toString());
            formData.set('longitude', selectedLocation.lng.toString());
        }

        await onSubmit(formData);
        setIsSubmitting(false);
        (event.target as HTMLFormElement).reset();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Add New Shop</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                <input name="name" type="text" required className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                <input name="ownerName" type="text" required className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input name="contactNumber" type="text" required className="mt-1 block w-full border rounded p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select name="paymentMethod" className="mt-1 block w-full border rounded p-2 bg-white">
                        <option value="CASH">Cash</option>
                        <option value="CREDIT">Credit</option>
                        <option value="CHEQUE">Cheque</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Avg Bill Value</label>
                    <div className="relative mt-1">
                        <span className="absolute left-2 top-2 text-gray-500">Rs.</span>
                        <input name="avgBillValue" type="number" min="0" step="100" className="block w-full border rounded p-2 pl-8" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Route</label>
                <select name="routeId" required className="mt-1 block w-full border rounded p-2 bg-white">
                    {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Shop Photo</label>
                <input name="image" type="file" accept="image/*" className="mt-1 block w-full text-sm text-gray-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>

                <div className="flex space-x-2 mb-2">
                    <button type="button" onClick={onLocationRequest} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200">
                        Get My Location
                    </button>
                </div>

                {selectedLocation ? (
                    <div className="text-sm bg-green-50 text-green-700 p-2 rounded">
                        Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </div>
                ) : (
                    <div className="text-sm bg-yellow-50 text-yellow-700 p-2 rounded">
                        No location selected. Click map or "Get My Location".
                    </div>
                )}

                {/* Hidden inputs always present, but validated in action */}
                <input type="hidden" name="latitude" value={selectedLocation?.lat || ''} />
                <input type="hidden" name="longitude" value={selectedLocation?.lng || ''} />
            </div>

            <button
                type="submit"
                disabled={isSubmitting || !selectedLocation}
                className={`w-full text-white py-2 rounded flex items-center justify-center gap-2 ${isSubmitting || !selectedLocation ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isSubmitting && <Spinner />}
                {isSubmitting ? 'Saving...' : 'Save Shop'}
            </button>
        </form>
    );
}
