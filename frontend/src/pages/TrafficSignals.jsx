import React, { useState, useEffect } from 'react';
import {
  TrafficCone,
  Shield,
  RotateCcw,
  AlertCircle,
  Play,
  CheckCircle,
  Sliders
} from 'lucide-react';
import { signalsAPI } from '../services/api';

export default function TrafficSignals() {
  const [intersections, setIntersections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      const res = await signalsAPI.getAll();
      setIntersections(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleForcePriority = async (intersectionId, direction) => {
    try {
      await signalsAPI.requestPriority(intersectionId, {
        approaching_direction: direction,
        vehicle_id: 'AMB-001',
      });
      fetchSignals();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request priority.');
    }
  };

  const handleRestore = async (intersectionId) => {
    try {
      await signalsAPI.restore(intersectionId, 'Control room operator restore');
      fetchSignals();
    } catch (e) {}
  };

  const renderLight = (color, isActive) => (
    <div
      className={`w-6 h-6 rounded-full border border-black/40 transition-all ${
        isActive
          ? color === 'red'
            ? 'bg-[#FF646E] glow-danger'
            : color === 'yellow'
            ? 'bg-[#FFBE4B]'
            : 'bg-[#26D28B] glow-green'
          : 'bg-[#0C162A]/90 opacity-20'
      }`}
    />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16253F] p-5 rounded-2xl border border-[#243452]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <TrafficCone className="w-5 h-5 text-[#FFBE4B]" />
            Traffic Signal Control Room
          </h2>
          <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
            4-Way Deterministic Signal Head Management | Arterial Corridor
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#8E9EBA]">
          <span className="w-2 h-2 rounded-full bg-[#26D28B]" />
          <span>Yellow Clearance: 3.0s | All-Red: 2.0s</span>
        </div>
      </div>

      {/* 4 Intersection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {intersections.map((inter) => (
          <div
            key={inter.intersection_id}
            className={`p-5 rounded-xl border shadow-xl transition-all ${
              inter.active_priority
                ? 'bg-[#16253F] border-[#26D28B]/60 shadow-[#26D28B]/10'
                : 'bg-[#16253F] border-[#243452]'
            }`}
          >
            {/* Intersection Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#243452] mb-4">
              <div>
                <h3 className="font-bold text-white text-sm">{inter.name}</h3>
                <p className="text-[11px] text-[#8E9EBA] font-mono mt-0.5">
                  Phase: <span className="text-[#42BEE2] font-semibold">{inter.phase_state}</span>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    inter.active_priority
                      ? 'bg-[#26D28B]/20 text-[#26D28B] border border-[#26D28B]/40 animate-pulse'
                      : 'bg-[#1E3152] text-gray-300'
                  }`}
                >
                  {inter.active_priority ? `PRIORITY: ${inter.prioritized_vehicle}` : 'NORMAL CYCLE'}
                </span>
              </div>
            </div>

            {/* 4 Directions Visualizer (North, South, East, West) */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              {['North', 'South', 'East', 'West'].map((dir) => {
                const state = inter.signals?.[dir] || 'RED';
                const isGreen = state === 'GREEN' || state === 'PRIORITY_ACTIVE';
                const isYellow = state === 'YELLOW';
                const isRed = state === 'RED' || state === 'PRIORITY_REQUESTED';

                return (
                  <div
                    key={dir}
                    className="p-3 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white">{dir} Approach</p>
                      <p className="text-[10px] text-[#8E9EBA] font-mono mt-0.5">{state}</p>
                    </div>

                    {/* Mini Traffic Light Head */}
                    <div className="bg-[#16253F] p-1.5 rounded-lg border border-[#243452] flex flex-col gap-1 items-center">
                      {renderLight('red', isRed)}
                      {renderLight('yellow', isYellow)}
                      {renderLight('green', isGreen)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Control Room Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#243452]">
              <button
                onClick={() => handleForcePriority(inter.intersection_id, 'West')}
                className="flex-1 py-1.5 bg-[#26D28B]/15 hover:bg-[#26D28B]/25 text-[#26D28B] border border-[#26D28B]/30 rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Trigger Priority West
              </button>
              <button
                onClick={() => handleRestore(inter.intersection_id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3152] hover:bg-[#28416B] text-[#8E9EBA] hover:text-white border border-[#243452] rounded-lg text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Normal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
