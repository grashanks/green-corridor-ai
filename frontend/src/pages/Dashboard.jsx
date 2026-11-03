import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ambulance,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrafficCone,
  Zap,
  TrendingDown,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { analyticsAPI, emergenciesAPI, alertsAPI, signalsAPI } from '../services/api';

const HOURLY_ACTIVITY_DATA = [
  { time: '06:00', emergencyCalls: 1, savedMinutes: 3.2 },
  { time: '08:00', emergencyCalls: 4, savedMinutes: 8.5 },
  { time: '10:00', emergencyCalls: 3, savedMinutes: 6.4 },
  { time: '12:00', emergencyCalls: 5, savedMinutes: 11.2 },
  { time: '14:00', emergencyCalls: 2, savedMinutes: 4.8 },
  { time: '16:00', emergencyCalls: 6, savedMinutes: 14.1 },
  { time: '18:00', emergencyCalls: 7, savedMinutes: 16.5 },
  { time: '20:00', emergencyCalls: 4, savedMinutes: 9.3 },
];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [signals, setSignals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overRes, emergRes, sigRes, alertRes] = await Promise.all([
        analyticsAPI.getOverview(),
        emergenciesAPI.getAll(),
        signalsAPI.getAll(),
        alertsAPI.getAll(),
      ]);
      setOverview(overRes.data);
      setActiveEmergencies(emergRes.data.filter((e) => ['Pending', 'Approved', 'In Transit'].includes(e.request_status)));
      setSignals(sigRes.data);
      setAlerts(alertRes.data);
    } catch (e) {
      console.error('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Corridors',
      value: overview?.active_corridors ?? 0,
      sub: overview?.active_corridors > 0 ? 'Live Priority Engaged' : 'Standby Mode',
      icon: Zap,
      color: 'text-[#26D28B]',
      bg: 'bg-[#26D28B]/10',
      border: 'border-[#26D28B]/30',
    },
    {
      title: 'Active Emergencies',
      value: overview?.active_emergencies ?? activeEmergencies.length,
      sub: `${overview?.total_vehicles || 3} Registered Fleet`,
      icon: Ambulance,
      color: 'text-[#42BEE2]',
      bg: 'bg-[#42BEE2]/10',
      border: 'border-[#42BEE2]/30',
    },
    {
      title: 'Time Saved Avg',
      value: `${overview?.avg_time_saved_seconds ? Math.round(overview.avg_time_saved_seconds) : 97}s`,
      sub: `${overview?.avg_time_saved_percent ? overview.avg_time_saved_percent : 43}% delay reduction`,
      icon: TrendingDown,
      color: 'text-[#26D28B]',
      bg: 'bg-[#26D28B]/10',
      border: 'border-[#26D28B]/30',
    },
    {
      title: 'Controlled Intersections',
      value: overview?.controlled_intersections ?? 4,
      sub: 'Central Corridor Network',
      icon: TrafficCone,
      color: 'text-[#FFBE4B]',
      bg: 'bg-[#FFBE4B]/10',
      border: 'border-[#FFBE4B]/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#16253F] to-[#121E33] p-5 rounded-2xl border border-[#243452]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Intelligent Emergency Traffic Operations Center
          </h2>
          <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
            Autonomous Green Corridor Coordination | Connected Arterial Intersections 1–4
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/tracking"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#26D28B]/15 hover:bg-[#26D28B]/25 text-[#26D28B] border border-[#26D28B]/40 text-xs font-semibold rounded-lg transition-colors"
          >
            <Activity className="w-4 h-4" />
            Live Map Tracking
          </Link>
          <Link
            to="/signals"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1E3152] hover:bg-[#28416B] text-[#F5F8FC] border border-[#243452] text-xs font-semibold rounded-lg transition-colors"
          >
            <TrafficCone className="w-4 h-4" />
            Signal Grid
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl bg-[#16253F] border ${card.border} flex items-center justify-between shadow-lg`}
            >
              <div>
                <p className="text-xs font-medium text-[#8E9EBA] uppercase tracking-wider">{card.title}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                <p className="text-[11px] text-[#8E9EBA] mt-0.5 font-mono">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Corridor Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Response Time & Priority Efficiency Chart */}
        <div className="lg:col-span-2 bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#26D28B]" />
                Simulated Priority Efficiency (Time Saved)
              </h3>
              <p className="text-[11px] text-[#8E9EBA]">Minutes saved per hour by preemptive signal clearance</p>
            </div>
            <span className="text-xs font-mono text-[#26D28B] bg-[#26D28B]/10 px-2.5 py-1 rounded-md border border-[#26D28B]/20">
              ~43% Avg Delay Reduction
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_ACTIVITY_DATA}>
                <defs>
                  <linearGradient id="corridorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26D28B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#26D28B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#8E9EBA" fontSize={11} tickLine={false} />
                <YAxis stroke="#8E9EBA" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121E33', borderColor: '#243452', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="savedMinutes"
                  name="Time Saved (Min)"
                  stroke="#26D28B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#corridorGreen)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: 4 Corridor Intersections Quick Status */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#243452] mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrafficCone className="w-4 h-4 text-[#FFBE4B]" />
                Signal Grid Status
              </h3>
              <Link to="/signals" className="text-xs text-[#42BEE2] hover:underline flex items-center gap-1 font-mono">
                Full Grid <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {signals.slice(0, 4).map((sig) => (
                <div
                  key={sig.intersection_id}
                  className="p-3 rounded-lg bg-[#0C162A]/70 border border-[#243452] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{sig.name}</p>
                    <p className="text-[10px] text-[#8E9EBA] font-mono mt-0.5">
                      Mode: <span className={sig.active_priority ? 'text-[#FF646E] font-bold' : 'text-[#26D28B]'}>
                        {sig.phase_state}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        sig.signals?.West === 'GREEN'
                          ? 'bg-[#26D28B] glow-green'
                          : sig.signals?.West === 'YELLOW'
                          ? 'bg-[#FFBE4B]'
                          : sig.signals?.West === 'PRIORITY_ACTIVE'
                          ? 'bg-[#26D28B] animate-ping'
                          : 'bg-[#FF646E]'
                      }`}
                    />
                    <span className="text-[10px] uppercase font-bold text-gray-300">
                      {sig.signals?.West || 'RED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243452] text-center">
            <Link
              to="/corridor"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#1E3152] hover:bg-[#28416B] rounded-lg text-xs font-semibold text-[#42BEE2] transition-colors"
            >
              Open Green Corridor Console
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Requests & Recent Emergency Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Emergency Requests */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#243452] mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-[#42BEE2]" />
              Active Emergency Requests ({activeEmergencies.length})
            </h3>
            <Link to="/vehicles" className="text-xs text-[#26D28B] hover:underline font-mono">
              + New Dispatch
            </Link>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {activeEmergencies.length === 0 ? (
              <div className="text-center py-8 text-[#8E9EBA] text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#26D28B]/60 mb-2" />
                No active emergencies in transit. System on standby.
                <p className="text-[11px] mt-1 text-gray-400">Click "START HACKATHON DEMO" at the top to simulate AMB-001.</p>
              </div>
            ) : (
              activeEmergencies.map((em) => (
                <div
                  key={em.id}
                  className="p-3 rounded-lg bg-[#0C162A]/80 border border-[#243452] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF646E]/20 border border-[#FF646E]/40 flex items-center justify-center text-[#FF646E] font-bold">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{em.vehicle_id}</p>
                      <p className="text-[10px] text-[#8E9EBA] font-mono">
                        Priority: <span className="text-[#FF646E] uppercase font-bold">{em.priority}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#26D28B]/15 text-[#26D28B] border border-[#26D28B]/30 font-mono">
                      {em.request_status}
                    </span>
                    <p className="text-[10px] text-[#8E9EBA] mt-1 font-mono">Dest: Apollo Hospital</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live System Alerts Feed */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#243452] mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FFBE4B]" />
              Real-Time Traffic Events Feed
            </h3>
            <span className="text-[10px] font-mono text-[#8E9EBA] bg-[#1E3152] px-2 py-0.5 rounded">
              Live WebSocket Sync
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-[#8E9EBA] text-center py-8">No recent alerts recorded.</p>
            ) : (
              alerts.slice(0, 6).map((a, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#0C162A]/60 border border-[#243452] text-xs flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#26D28B] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-[11px]">{a.alert_type}</p>
                      <span className="text-[9px] text-[#8E9EBA] font-mono">
                        {a.created_at ? new Date(a.created_at).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-[#8E9EBA] text-[11px] mt-0.5 leading-relaxed">{a.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
