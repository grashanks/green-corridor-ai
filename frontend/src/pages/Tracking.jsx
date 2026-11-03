import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Compass,
  MapPin,
  Clock,
  TrafficCone,
  AlertOctagon,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { routesAPI, signalsAPI, simulationAPI } from '../services/api';

// Custom Map Markers using pure SVG data URLs
const createIcon = (svgString) => {
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const ambulanceIcon = createIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="18" fill="#FF646E" stroke="#FFFFFF" stroke-width="2.5"/>
    <path d="M20 10 V30 M10 20 H30" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  </svg>
`);

const hospitalIcon = createIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="18" fill="#26D28B" stroke="#FFFFFF" stroke-width="2.5"/>
    <rect x="11" y="11" width="18" height="18" rx="2" fill="#FFFFFF"/>
    <path d="M20 14 V26 M14 20 H26" stroke="#26D28B" stroke-width="3.5" stroke-linecap="round"/>
  </svg>
`);

const getSignalIcon = (state) => {
  const color = state === 'GREEN' || state === 'PRIORITY_ACTIVE' ? '#26D28B' : state === 'YELLOW' ? '#FFBE4B' : '#FF646E';
  return createIcon(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <rect x="8" y="2" width="16" height="28" rx="4" fill="#16253F" stroke="#243452" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
    </svg>
  `);
};

export default function Tracking() {
  const [telemetry, setTelemetry] = useState({
    vehicle_id: 'AMB-001',
    latitude: 12.9700,
    longitude: 77.5900,
    speed: 58.0,
    heading: 68.0,
    progress_pct: 0,
    distance_travelled_m: 0,
    remaining_distance_m: 2480,
    eta_seconds: 145,
    next_intersection: 'Intersection 1 (West Gate)',
    is_completed: false,
  });

  const [routeGeometry, setRouteGeometry] = useState([]);
  const [intersections, setIntersections] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(2.0);
  const [obstructionActive, setObstructionActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Center coordinate of corridor
  const mapCenter = [12.9770, 77.6040];

  useEffect(() => {
    // 1. Initial Route and Signal fetch
    fetchRouteAndSignals();

    // 2. Setup WebSocket for live GPS tracking updates
    let ws;
    const connectWS = () => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/tracking/ws`);

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWS, 3000);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'GPS_TELEMETRY' && msg.data?.length > 0) {
              const active = msg.data[0];
              setTelemetry(active);
            }
          } catch (e) {}
        };
      } catch (e) {}
    };

    connectWS();
    const sigInterval = setInterval(fetchSignalsOnly, 3000);

    return () => {
      clearInterval(sigInterval);
      if (ws) ws.close();
    };
  }, [obstructionActive]);

  const fetchRouteAndSignals = async () => {
    try {
      const routeRes = await routesAPI.calculate({
        source_latitude: 12.9700,
        source_longitude: 77.5900,
        destination_latitude: 12.9840,
        destination_longitude: 77.6180,
        simulate_obstruction: obstructionActive,
      });
      setRouteGeometry(routeRes.data.route_geometry);

      const sigRes = await signalsAPI.getAll();
      setIntersections(sigRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSignalsOnly = async () => {
    try {
      const sigRes = await signalsAPI.getAll();
      setIntersections(sigRes.data);
    } catch (e) {}
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await simulationAPI.resume();
        setIsPaused(false);
      } else {
        await simulationAPI.pause();
        setIsPaused(true);
      }
    } catch (e) {}
  };

  const handleSpeedChange = async (multiplier) => {
    setSpeedMultiplier(multiplier);
    try {
      await simulationAPI.start({ speed_multiplier: multiplier });
    } catch (e) {}
  };

  const handleToggleObstruction = async () => {
    const nextState = !obstructionActive;
    setObstructionActive(nextState);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel Toolbar */}
      <div className="bg-[#16253F] border border-[#243452] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#26D28B] animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide">Live GPS Corridor Tracking</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded bg-[#1E3152] border border-[#243452] text-[#42BEE2] font-mono">
            {wsConnected ? 'Telemetry Stream: Connected' : 'Syncing...'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePauseResume}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isPaused
                ? 'bg-[#26D28B]/20 text-[#26D28B] border-[#26D28B]/40 hover:bg-[#26D28B]/30'
                : 'bg-[#1E3152] text-gray-200 border-[#243452] hover:bg-[#28416B]'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-[#0C162A] p-0.5 rounded-lg border border-[#243452] text-xs font-mono">
            {[1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  speedMultiplier === s ? 'bg-[#26D28B] text-[#0C162A]' : 'text-[#8E9EBA] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Road Obstruction Re-routing Demo Button */}
          <button
            onClick={handleToggleObstruction}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              obstructionActive
                ? 'bg-[#FF646E]/20 text-[#FF646E] border-[#FF646E]/50'
                : 'bg-[#FFBE4B]/15 text-[#FFBE4B] border-[#FFBE4B]/30 hover:bg-[#FFBE4B]/25'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {obstructionActive ? 'Obstruction Detour Active' : 'Simulate Road Block'}
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 Cols: Leaflet Interactive Map */}
        <div className="lg:col-span-3 h-[560px] bg-[#16253F] border border-[#243452] rounded-xl overflow-hidden relative shadow-2xl">
          <MapContainer
            center={mapCenter}
            zoom={14}
            scrollWheelZoom={true}
            className="h-full w-full dark-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Glowing Green Corridor Route Polyline */}
            {routeGeometry.length > 0 && (
              <>
                <Polyline
                  positions={routeGeometry}
                  pathOptions={{
                    color: obstructionActive ? '#FFBE4B' : '#26D28B',
                    weight: 6,
                    opacity: 0.9,
                  }}
                />
                <Polyline
                  positions={routeGeometry}
                  pathOptions={{
                    color: obstructionActive ? '#FF646E' : '#42BEE2',
                    weight: 12,
                    opacity: 0.25,
                  }}
                />
              </>
            )}

            {/* Moving Virtual Ambulance Marker */}
            {telemetry.latitude && (
              <Marker position={[telemetry.latitude, telemetry.longitude]} icon={ambulanceIcon}>
                <Popup className="text-xs">
                  <div className="font-sans text-slate-900">
                    <p className="font-bold text-red-600">{telemetry.vehicle_id}</p>
                    <p>Speed: {telemetry.speed} km/h</p>
                    <p>ETA: {telemetry.eta_seconds}s</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination: Apollo Hospital Marker */}
            <Marker position={[12.9840, 77.6180]} icon={hospitalIcon}>
              <Popup className="text-xs">
                <div className="font-sans text-slate-900">
                  <p className="font-bold text-emerald-600">Apollo Super Specialty Hospital</p>
                  <p>Corridor Destination</p>
                </div>
              </Popup>
            </Marker>

            {/* 4 Connected Traffic Intersections with Dynamic Phase Signals */}
            {intersections.map((inter) => {
              const sigState = inter.signals?.West || 'RED';
              return (
                <Marker
                  key={inter.intersection_id}
                  position={[inter.latitude, inter.longitude]}
                  icon={getSignalIcon(sigState)}
                >
                  <Popup className="text-xs">
                    <div className="font-sans text-slate-900">
                      <p className="font-bold text-blue-800">{inter.name}</p>
                      <p>West Signal: <strong className={sigState === 'GREEN' ? 'text-green-600' : 'text-red-600'}>{sigState}</strong></p>
                      <p>Phase: {inter.phase_state}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#16253F]/95 backdrop-blur border border-[#243452] p-3 rounded-lg text-xs space-y-1.5 shadow-xl font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF646E] border border-white" />
              <span className="text-white text-[11px]">Emergency Ambulance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#26D28B] border border-white" />
              <span className="text-white text-[11px]">Apollo Hospital</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded bg-[#26D28B]" />
              <span className="text-[#26D28B] text-[11px]">Green Corridor Way</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live Telemetry & Upcoming Intersection Card */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#243452] mb-3">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Vehicle Telemetry</p>
                <p className="text-[10px] text-[#42BEE2] font-mono">{telemetry.vehicle_id}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#26D28B]/20 text-[#26D28B] border border-[#26D28B]/30 font-mono">
                {telemetry.is_completed ? 'ARRIVED' : 'IN TRANSIT'}
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8E9EBA]">
                  <Gauge className="w-4 h-4 text-[#42BEE2]" />
                  <span>Velocity</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">{telemetry.speed} km/h</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8E9EBA]">
                  <Compass className="w-4 h-4 text-[#FFBE4B]" />
                  <span>Heading</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">{telemetry.heading}°</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8E9EBA]">
                  <MapPin className="w-4 h-4 text-[#26D28B]" />
                  <span>Distance Covered</span>
                </div>
                <span className="text-sm font-bold font-mono text-white">{telemetry.distance_travelled_m} m</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8E9EBA]">
                  <Clock className="w-4 h-4 text-[#FF646E]" />
                  <span>Estimated Arrival (ETA)</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#26D28B]">{telemetry.eta_seconds}s</span>
              </div>
            </div>

            {/* Next Intersection Alert */}
            <div className="mt-4 p-3 rounded-lg bg-[#0C162A]/90 border border-[#243452]">
              <p className="text-[10px] text-[#8E9EBA] font-mono uppercase tracking-wider">Next Approaching Junction</p>
              <p className="text-xs font-bold text-white mt-0.5">{telemetry.next_intersection}</p>
              <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-2 border-t border-[#243452]">
                <span className="text-[#8E9EBA]">Signal Preemption:</span>
                <span className="text-[#26D28B] font-bold">ARMED (250m)</span>
              </div>
            </div>
          </div>

          {/* Route Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-[#8E9EBA]">Corridor Journey</span>
              <span className="text-[#26D28B] font-bold">{telemetry.progress_pct}%</span>
            </div>
            <div className="w-full bg-[#0C162A] h-2.5 rounded-full overflow-hidden border border-[#243452]">
              <div
                className="bg-gradient-to-r from-[#26D28B] to-[#42BEE2] h-full transition-all duration-300"
                style={{ width: `${telemetry.progress_pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
