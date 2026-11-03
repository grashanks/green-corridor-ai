import React, { useState, useEffect } from 'react';
import {
  Route,
  Zap,
  CheckCircle2,
  Clock,
  TrafficCone,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Radio
} from 'lucide-react';
import { signalsAPI, simulationAPI, emergenciesAPI } from '../services/api';

export default function GreenCorridor() {
  const [signals, setSignals] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCorridorState();
    const interval = setInterval(fetchCorridorState, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchCorridorState = async () => {
    try {
      const [sigRes, emRes] = await Promise.all([
        signalsAPI.getAll(),
        emergenciesAPI.getAll(),
      ]);
      setSignals(sigRes.data);
      const active = emRes.data.find((e) => ['In Transit', 'Approved'].includes(e.request_status));
      setActiveEmergency(active || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPriority = async (intersectionId) => {
    try {
      await signalsAPI.requestPriority(intersectionId, {
        approaching_direction: 'West',
        vehicle_id: activeEmergency?.vehicle_id || 'AMB-001',
      });
      fetchCorridorState();
    } catch (e) {
      alert('Could not set priority. Another conflict may be active.');
    }
  };

  const handleManualRestore = async (intersectionId) => {
    try {
      await signalsAPI.restore(intersectionId, 'Manual corridor console restore');
      fetchCorridorState();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16253F] p-5 rounded-2xl border border-[#243452]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#26D28B]" />
            Green Corridor Coordination Console
          </h2>
          <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
            Deterministic Signal Preemption Pipeline | Arterial Corridor #1
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#26D28B]/10 border border-[#26D28B]/30 text-xs font-mono text-[#26D28B]">
            <Radio className="w-4 h-4 animate-pulse" />
            CORRIDOR: {activeEmergency ? 'PRIORITY ENGAGED' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Corridor Linear Pipeline Stages */}
      <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Route className="w-4 h-4 text-[#42BEE2]" />
          Arterial Intersection Cascade (West to East)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {signals.map((inter, idx) => {
            const westState = inter.signals?.West || 'RED';
            const isPriority = inter.active_priority || westState === 'PRIORITY_ACTIVE';

            return (
              <div
                key={inter.intersection_id}
                className={`p-4 rounded-xl border relative transition-all ${
                  isPriority
                    ? 'bg-[#26D28B]/10 border-[#26D28B] shadow-lg shadow-[#26D28B]/20'
                    : 'bg-[#0C162A] border-[#243452]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#8E9EBA] uppercase font-bold">
                    Stage {idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isPriority ? 'bg-[#26D28B] text-[#0C162A]' : 'bg-[#1E3152] text-gray-300'
                    }`}
                  >
                    {isPriority ? 'PRIORITY GREEN' : 'NORMAL'}
                  </span>
                </div>

                <p className="text-xs font-bold text-white truncate">{inter.name}</p>
                <p className="text-[10px] text-[#8E9EBA] font-mono mt-0.5">Phase: {inter.phase_state}</p>

                {/* Signal Light Indicator */}
                <div className="mt-3 py-2 px-3 rounded-lg bg-[#121E33] border border-[#243452] flex items-center justify-between">
                  <span className="text-[10px] text-[#8E9EBA] font-mono">Arterial Light:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        westState === 'GREEN' || westState === 'PRIORITY_ACTIVE'
                          ? 'bg-[#26D28B] glow-green'
                          : westState === 'YELLOW'
                          ? 'bg-[#FFBE4B]'
                          : 'bg-[#FF646E]'
                      }`}
                    />
                    <span className="text-xs font-bold font-mono text-white">{westState}</span>
                  </div>
                </div>

                {/* Manual Override Buttons */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleManualPriority(inter.intersection_id)}
                    className="flex-1 py-1 bg-[#26D28B]/15 hover:bg-[#26D28B]/25 text-[#26D28B] border border-[#26D28B]/30 rounded text-[10px] font-bold uppercase transition-colors"
                  >
                    Force Green
                  </button>
                  <button
                    onClick={() => handleManualRestore(inter.intersection_id)}
                    className="p-1 bg-[#1E3152] hover:bg-[#28416B] text-[#8E9EBA] hover:text-white rounded border border-[#243452] transition-colors"
                    title="Restore Normal Cycle"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Matrix Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-[#26D28B]">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">All-Red Safety Clearance</h4>
          </div>
          <p className="text-xs text-[#8E9EBA] leading-relaxed">
            Strict 2-second all-red clearance interval enforced between conflicting signal transitions to eliminate intersection collisions.
          </p>
        </div>

        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-[#42BEE2]">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Fail-Safe Priority Timeout</h4>
          </div>
          <p className="text-xs text-[#8E9EBA] leading-relaxed">
            60-second deterministic timeout resets green corridor preemption back to normal cycle if GPS telemetry is interrupted.
          </p>
        </div>

        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-[#FFBE4B]">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Conflict Movement Validation</h4>
          </div>
          <p className="text-xs text-[#8E9EBA] leading-relaxed">
            Locks out conflicting priority requests from perpendicular emergency vehicles at the same intersection until previous vehicle clears.
          </p>
        </div>
      </div>
    </div>
  );
}
