'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

type Shop = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    ownerName?: string;
    contactNumber?: string;
};

interface MapProps {
    shops: Shop[];
    onLocationSelect?: (lat: number, lng: number) => void;
    selectedLocation?: { lat: number; lng: number } | null;
}

function LocationMarker({ onSelect, selected }: { onSelect?: (lat: number, lng: number) => void, selected?: { lat: number; lng: number } | null }) {
    useMapEvents({
        click(e) {
            if (onSelect) {
                onSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    return selected ? (
        <Marker position={[selected.lat, selected.lng]} icon={customIcon}>
            <Popup>Selected Location</Popup>
        </Marker>
    ) : null;
}

export default function Map({ shops, onLocationSelect, selectedLocation }: MapProps) {
    // Default center (Galle, Sri Lanka)
    const defaultCenter: [number, number] = [6.0535, 80.2210];

    return (
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {shops.map((shop) => (
                <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={customIcon}>
                    <Popup>
                        <strong>{shop.name}</strong><br />
                        {shop.ownerName}<br />
                        {shop.contactNumber}
                    </Popup>
                </Marker>
            ))}

            <LocationMarker onSelect={onLocationSelect} selected={selectedLocation} />
        </MapContainer>
    );
}
