import { useState, useEffect } from 'react';
import Spinner from './Spinner';

import imageCompression from 'browser-image-compression';

type Route = {
    id: number;
    name: string;
};

// Define minimal Shop type for form needed
type ShopData = {
    id: number;
    name: string;
    ownerName?: string;
    contactNumber?: string;
    routeId: number;
    paymentMethod: string;
    creditPeriod?: number | null;
    paymentStatus: 'ON_TIME' | 'DELAYED' | 'EXTREMELY_DELAYED';
    avgBillValue: number;
    imageUrl?: string | null;
    latitude: number;
    longitude: number;
};

interface ShopFormProps {
    routes: Route[];
    selectedLocation: { lat: number, lng: number } | null;
    onLocationRequest: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    initialData?: ShopData | null;
    onCancel?: () => void;
}

export default function ShopForm({ routes, selectedLocation, onLocationRequest, onSubmit, initialData, onCancel }: ShopFormProps) {
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'CASH');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    // Update state when initialData changes (e.g. switching shops to edit)
    useEffect(() => {
        if (initialData) {
            setPaymentMethod(initialData.paymentMethod);
        } else {
            setPaymentMethod('CASH');
        }
    }, [initialData]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);

        // Add ID if editing
        if (initialData) {
            formData.append('id', initialData.id.toString());
        }

        // Ensure location is added
        // If editing and no new location selected, use initial location or existing logic
        // But the form uses hidden inputs. If selectedLocation is provided (by parent), use it.
        // If we are editing, specific logic needed?
        // Parent Dashboard should probably set selectedLocation when passing initialData.
        if (selectedLocation) {
            formData.set('latitude', selectedLocation.lat.toString());
            formData.set('longitude', selectedLocation.lng.toString());
        }

        // Use the compressed file if available
        if (compressedFile) {
            formData.set('image', compressedFile);
        }

        await onSubmit(formData);
        setIsSubmitting(false);
        if (!initialData) {
            (event.target as HTMLFormElement).reset();
            setPaymentMethod('CASH');
            setCompressedFile(null);
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset previous state
        setCompressedFile(null);

        // Options for compression
        const options = {
            maxSizeMB: 4.5, // Target slightly under 5MB to be safe
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };

        try {
            setIsCompressing(true);
            const compressed = await imageCompression(file, options);
            setCompressedFile(compressed);
            setIsCompressing(false);
        } catch (error) {
            console.error("Compression failed:", error);
            alert("Failed to compress image. Please try a different photo.");
            setIsCompressing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Shop' : 'Add New Shop'}</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                <input name="name" type="text" defaultValue={initialData?.name} required className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                <input name="ownerName" type="text" defaultValue={initialData?.ownerName || ''} required className="mt-1 block w-full border rounded p-2" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input name="contactNumber" type="text" defaultValue={initialData?.contactNumber || ''} required className="mt-1 block w-full border rounded p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                        name="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1 block w-full border rounded p-2 bg-white"
                    >
                        <option value="CASH">Cash</option>
                        <option value="CREDIT">Credit</option>
                        <option value="CHEQUE">Cheque</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Avg Bill Value</label>
                    <div className="relative mt-1">
                        <span className="absolute left-2 top-2 text-gray-500">Rs.</span>
                        <input name="avgBillValue" type="number" defaultValue={initialData?.avgBillValue} min="0" step="100" className="block w-full border rounded p-2 pl-8" />
                    </div>
                </div>
            </div>

            {paymentMethod === 'CREDIT' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-700">Credit Period</label>
                    <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="creditPeriod" value="7" defaultChecked={initialData?.creditPeriod === 7} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">7 Days</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="creditPeriod" value="14" defaultChecked={initialData?.creditPeriod === 14} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">14 Days</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="creditPeriod" value="21" defaultChecked={initialData?.creditPeriod === 21} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">21 Days</span>
                        </label>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select name="paymentStatus" defaultValue={initialData?.paymentStatus || 'ON_TIME'} className="mt-1 block w-full border rounded p-2 bg-white">
                    <option value="ON_TIME">Pays on Time (Green)</option>
                    <option value="DELAYED">Some Delay (Yellow)</option>
                    <option value="EXTREMELY_DELAYED">Extremely Delayed (Red)</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Route</label>
                <select name="routeId" defaultValue={initialData?.routeId} required className="mt-1 block w-full border rounded p-2 bg-white">
                    {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Shop Photo {initialData && '(Leave empty to keep current)'}</label>
                {initialData?.imageUrl && (
                    <div className="mb-2">
                        <img src={initialData.imageUrl} alt="Current" className="h-20 w-auto object-contain rounded border" />
                    </div>
                )}
                <input
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                />
                {isCompressing && (
                    <div className="text-xs text-blue-600 mt-1 font-semibold flex items-center gap-1">
                        <Spinner />
                        Optimizing image...
                    </div>
                )}
                {compressedFile && (
                    <div className="text-xs text-green-600 mt-1 font-semibold">
                        Image ready! ({(compressedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location {initialData && <span className="text-xs font-normal text-gray-500">(Drag map or 'Get My Location' to change)</span>}
                </label>

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
                        {initialData ? 'Using current shop location (Edit map to change)' : 'No location selected. Click map or "Get My Location".'}
                    </div>
                )}

                {/* Hidden inputs always present, but validated in action */}
                <input type="hidden" name="latitude" value={selectedLocation?.lat || ''} />
                <input type="hidden" name="longitude" value={selectedLocation?.lng || ''} />
            </div>

            <div className="flex gap-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-1/3 bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || isCompressing || (!selectedLocation && !initialData)}
                    className={`flex-1 text-white py-2 rounded flex items-center justify-center gap-2 ${isSubmitting || isCompressing || (!selectedLocation && !initialData) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isSubmitting && <Spinner />}
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Shop' : 'Save Shop')}
                </button>
            </div>
        </form>
    );
}
