import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Pause,
  RotateCcw,
  BarChart2,
  FileCode,
  CheckCircle,
  Clock,
  Layers,
  Car
} from 'lucide-react';
import { simulationAPI } from '../services/api';

export default function Simulation() {
  const [status, setStatus] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const res = await simulationAPI.getStatus();
      setStatus(res.data);
      if (res.data.benchmark_results) {
        setBenchmark(res.data.benchmark_results);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStart = async () => {
    try {
      await simulationAPI.start({ priority_enabled: true });
      loadStatus();
    } catch (e) {}
  };

  const handlePause = async () => {
    try {
      await simulationAPI.pause();
      loadStatus();
    } catch (e) {}
  };

  const handleResume = async () => {
    try {
      await simulationAPI.resume();
      loadStatus();
    } catch (e) {}
  };

  const handleStop = async () => {
    try {
      await simulationAPI.stop();
      loadStatus();
    } catch (e) {}
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await simulationAPI.runBenchmark();
      setBenchmark(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16253F] p-5 rounded-2xl border border-[#243452]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#42BEE2]" />
            SUMO & Microscopic Traffic Simulator
          </h2>
          <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
            TraCI Integration Engine & Deterministic Urban Flow Model | Central Corridor
          </p>
        </div>

        {/* Engine Mode Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#1E3152] border border-[#243452] text-xs font-mono text-[#26D28B]">
            Engine: <strong>{status?.mode || 'Python-Native Microscopic Fallback'}</strong>
          </span>
        </div>
      </div>

      {/* Simulator Control Toolbar */}
      <div className="bg-[#16253F] border border-[#243452] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            disabled={status?.is_running && !status?.is_paused}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#26D28B] hover:bg-[#20b879] disabled:opacity-50 text-[#0C162A] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Simulation
          </button>

          {status?.is_paused ? (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3152] hover:bg-[#28416B] text-white border border-[#243452] text-xs font-semibold rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={!status?.is_running}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3152] hover:bg-[#28416B] disabled:opacity-50 text-white border border-[#243452] text-xs font-semibold rounded-lg transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}

          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FF646E]/15 hover:bg-[#FF646E]/25 text-[#FF646E] border border-[#FF646E]/30 text-xs font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Stop
          </button>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={benchmarking}
          className="flex items-center gap-2 px-4 py-2 bg-[#42BEE2] hover:bg-[#34a8cb] text-[#0C162A] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow"
        >
          <BarChart2 className="w-4 h-4" />
          {benchmarking ? 'Running Dual Scenarios...' : 'Run Comparative Benchmark'}
        </button>
      </div>

      {/* 4 Intersection Queues Visualizer */}
      <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Car className="w-4 h-4 text-[#FFBE4B]" />
          Live Intersection Queue Densities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {status?.intersections?.map((inter) => (
            <div
              key={inter.id}
              className="p-4 rounded-xl bg-[#0C162A] border border-[#243452] space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#243452]">
                <p className="font-bold text-xs text-white truncate">{inter.name}</p>
                <span className="text-[10px] font-mono text-[#26D28B] font-bold">{inter.signal}</span>
              </div>

              {/* Arterial Queue */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-[#8E9EBA]">Arterial Queue:</span>
                  <span className="font-bold text-white">{inter.arterial_queue_vehicles} vehicles</span>
                </div>
                <div className="w-full bg-[#16253F] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#26D28B] h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (inter.arterial_queue_vehicles / 15) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Cross Street Queue */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-[#8E9EBA]">Cross Queue:</span>
                  <span className="font-bold text-gray-300">{inter.cross_queue_vehicles} vehicles</span>
                </div>
                <div className="w-full bg-[#16253F] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FFBE4B] h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (inter.cross_queue_vehicles / 12) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUMO File Artifacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl bg-[#16253F] border border-[#243452] space-y-1">
          <div className="flex items-center gap-2 text-[#26D28B] font-mono text-xs font-bold">
            <FileCode className="w-4 h-4" />
            <span>simulation/networks/city.net.xml</span>
          </div>
          <p className="text-[11px] text-[#8E9EBA]">
            SUMO arterial grid network defining edges, nodes, TLS programs and 4 junctions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#16253F] border border-[#243452] space-y-1">
          <div className="flex items-center gap-2 text-[#42BEE2] font-mono text-xs font-bold">
            <FileCode className="w-4 h-4" />
            <span>simulation/routes/city.rou.xml</span>
          </div>
          <p className="text-[11px] text-[#8E9EBA]">
            Traffic demand flows: passenger cars, buses, motorcycles, and emergency ambulance with bluelight.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#16253F] border border-[#243452] space-y-1">
          <div className="flex items-center gap-2 text-[#FFBE4B] font-mono text-xs font-bold">
            <FileCode className="w-4 h-4" />
            <span>simulation/configurations/city.sumocfg</span>
          </div>
          <p className="text-[11px] text-[#8E9EBA]">
            Master simulation execution config with 0.5s step-length and tripinfo output collection.
          </p>
        </div>
      </div>
    </div>
  );
}
