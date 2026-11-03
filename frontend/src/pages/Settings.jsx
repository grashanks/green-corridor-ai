import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Sliders,
  Shield,
  Key,
  Save,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    osrmUrl: 'https://router.project-osrm.org',
    sumoHome: 'C:\\Program Files (x86)\\Eclipse\\Sumo',
    yoloPath: 'yolov8n.pt',
    minGreen: 5,
    yellowClearance: 3,
    allRedClearance: 2,
    priorityTimeout: 60,
    wsReconnectSec: 3,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#16253F] p-5 rounded-2xl border border-[#243452]">
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#26D28B]" />
          System Settings & Parameter Tuning
        </h2>
        <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
          Configure routing engine providers, SUMO directory, and deterministic safety clearance intervals.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-[#26D28B]/20 border border-[#26D28B] text-[#26D28B] text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>System configuration parameters successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Safety Timing Matrix */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FFBE4B]" />
            Signal Safety Intervals (Deterministic State Machine)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">
                Minimum Green Interval (seconds)
              </label>
              <input
                type="number"
                value={config.minGreen}
                onChange={(e) => setConfig({ ...config, minGreen: Number(e.target.value) })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
              <p className="text-[10px] text-[#8E9EBA] mt-1">Prevents abrupt interruption of newly granted green phases.</p>
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">
                Yellow Clearance Interval (seconds)
              </label>
              <input
                type="number"
                value={config.yellowClearance}
                onChange={(e) => setConfig({ ...config, yellowClearance: Number(e.target.value) })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
              <p className="text-[10px] text-[#8E9EBA] mt-1">Time for vehicles currently in intersection to safely clear.</p>
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">
                All-Red Safety Interval (seconds)
              </label>
              <input
                type="number"
                value={config.allRedClearance}
                onChange={(e) => setConfig({ ...config, allRedClearance: Number(e.target.value) })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
              <p className="text-[10px] text-[#8E9EBA] mt-1">All signals held red before emergency direction gets green.</p>
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">
                Fail-Safe Priority Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.priorityTimeout}
                onChange={(e) => setConfig({ ...config, priorityTimeout: Number(e.target.value) })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
              <p className="text-[10px] text-[#8E9EBA] mt-1">Maximum preemption hold duration before restoring normal cycle.</p>
            </div>
          </div>
        </div>

        {/* External Service Connections */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-[#42BEE2]" />
            Routing & Simulation Integrations
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">OSRM Routing Service URL</label>
              <input
                type="text"
                value={config.osrmUrl}
                onChange={(e) => setConfig({ ...config, osrmUrl: e.target.value })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">SUMO_HOME Environment Path</label>
              <input
                type="text"
                value={config.sumoHome}
                onChange={(e) => setConfig({ ...config, sumoHome: e.target.value })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">Ultralytics YOLO Weights File</label>
              <input
                type="text"
                value={config.yoloPath}
                onChange={(e) => setConfig({ ...config, yoloPath: e.target.value })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-[#26D28B]" />
            Demo Credentials Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
            <div className="p-3 rounded-lg bg-[#0C162A] border border-[#243452]">
              <p className="text-[#26D28B] font-bold">Traffic Administrator</p>
              <p className="text-[#8E9EBA] mt-0.5">Username: <strong>admin</strong></p>
              <p className="text-[#8E9EBA]">Password: <strong>admin123</strong></p>
            </div>
            <div className="p-3 rounded-lg bg-[#0C162A] border border-[#243452]">
              <p className="text-[#42BEE2] font-bold">Emergency Vehicle Operator</p>
              <p className="text-[#8E9EBA] mt-0.5">Username: <strong>operator</strong></p>
              <p className="text-[#8E9EBA]">Password: <strong>operator123</strong></p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#26D28B] hover:bg-[#20b879] text-[#0C162A] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </form>
    </div>
  );
}
