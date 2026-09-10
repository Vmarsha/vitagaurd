import React, { useEffect, useRef } from 'react';
import { NearbyHospital } from '../../types';
import L from 'leaflet';

interface IndiaHospitalMapProps {
  hospitals: NearbyHospital[];
  selectedHospitalId?: string;
  onSelectHospital?: (hospital: NearbyHospital) => void;
}

// Origin Coordinates (KC General Hospital / Central Bengaluru, India)
const ORIGIN_LAT = 12.9716;
const ORIGIN_LNG = 77.5946;

export const IndiaHospitalMap: React.FC<IndiaHospitalMapProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [ORIGIN_LAT, ORIGIN_LNG],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | VitaGuard India Hub',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers & polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // 1. Add Origin Marker (KC General Hospital, Bengaluru)
    const originIcon = L.divIcon({
      className: 'custom-origin-icon',
      html: `
        <div style="background: #10b981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
          🏥
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const originMarker = L.marker([ORIGIN_LAT, ORIGIN_LNG], { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #065f46; font-size: 13px;">📍 Origin Facility</strong><br/>
        <b style="font-size: 12px;">KC General Hospital</b><br/>
        <span style="font-size: 11px; color: #4b5563;">Bengaluru, Karnataka, India</span>
      </div>
    `);

    // 2. Add Partner Hospital Markers & Route Polylines
    hospitals.forEach((hosp) => {
      const lat = (hosp as any).latitude || 12.9716;
      const lng = (hosp as any).longitude || 77.5946;
      const isSelected = hosp.id === selectedHospitalId;

      const hospIcon = L.divIcon({
        className: 'custom-hosp-icon',
        html: `
          <div style="background: ${isSelected ? '#ef4444' : '#3b82f6'}; color: white; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            🚑
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([lat, lng], { icon: hospIcon }).addTo(map);

      const googleMapsUrl = (hosp as any).maps_url || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <span style="font-size: 10px; color: #2563eb; font-weight: bold; text-transform: uppercase;">Partner Hospital</span>
          <h4 style="margin: 2px 0 4px 0; font-size: 13px; color: #111827; font-weight: bold;">${hosp.name}</h4>
          <div style="font-size: 11px; color: #374151; margin-bottom: 4px;">
            <b>Specialty:</b> ${hosp.primary_specialty}
          </div>
          <div style="font-size: 11px; color: #059669; font-weight: bold; margin-bottom: 6px;">
            ● ${hosp.available_icu_beds} of ${hosp.total_icu_beds} ICU Beds Available
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
            ⚡ <b>${hosp.distance_km} km</b> • ~<b>${hosp.travel_time_mins} mins</b> via Priority Transit
          </div>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: bold;">
            🗺️ Open Live GPS Navigation
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectHospital) {
          onSelectHospital(hosp);
        }
      });

      // Draw Green Transit Corridor Polyline from Origin to Hospital
      const routeColor = isSelected ? '#ef4444' : '#0284c7';
      L.polyline([[ORIGIN_LAT, ORIGIN_LNG], [lat, lng]], {
        color: routeColor,
        weight: isSelected ? 3.5 : 2,
        dashArray: isSelected ? '4, 4' : '6, 6',
        opacity: 0.85,
      }).addTo(map);
    });

    // Auto-fit map bounds
    if (hospitals.length > 0) {
      const allCoords = [
        [ORIGIN_LAT, ORIGIN_LNG] as [number, number],
        ...hospitals.map((h) => [(h as any).latitude || ORIGIN_LAT, (h as any).longitude || ORIGIN_LNG] as [number, number]),
      ];
      map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    }
  }, [hospitals, selectedHospitalId]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl bg-slate-900">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <strong className="text-white">Bengaluru Emergency Medical Corridor</strong>
        </div>
        <div className="text-[11px] text-slate-300 mt-0.5">
          Origin: <span className="text-emerald-400 font-semibold">KC General Hospital</span> (12.9716°N, 77.5946°E)
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-80 sm:h-96 z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-300 flex items-center space-x-3 shadow-lg">
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Origin Ward</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>Partner Hospital</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span>Selected Destination</span>
        </span>
      </div>
    </div>
  );
};
