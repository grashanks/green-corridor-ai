import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ambulance,
  MapPin,
  Route,
  TrafficCone,
  ScanEye,
  Cpu,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { simulationAPI, alertsAPI } from '../services/api';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vehicles', label: 'Emergency Vehicles', icon: Ambulance },
  { path: '/tracking', label: 'Live Tracking', icon: MapPin },
  { path: '/corridor', label: 'Green Corridor', icon: Route },
  { path: '/signals', label: 'Traffic Signals', icon: TrafficCone },
  { path: '/ai-detect', label: 'AI Detection', icon: ScanEye },
  { path: '/simulation', label: 'Simulation', icon: Cpu },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Poll alerts and connect WebSocket
  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);

    // Live Notification WebSocket
    let ws;
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/alerts/ws`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ALERT') {
            setAlerts((prev) => [data, ...prev]);
            setUnreadCount((c) => c + 1);
            showMessage(data.message, 'info');
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await alertsAPI.getAll();
      setAlerts(res.data);
      setUnreadCount(res.data.filter((a) => !a.read_status).length);
    } catch (e) {}
  };

  const showMessage = (msg, type = 'success') => {
    setActionMessage({ msg, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleStartDemo = async () => {
    try {
      setDemoRunning(true);
      const res = await simulationAPI.startDemo();
      showMessage('HACKATHON DEMO STARTED! AMB-001 Priority Corridor Active.', 'success');
      navigate('/tracking');
    } catch (e) {
      showMessage('Failed to start demo scenario.', 'danger');
    } finally {
      setDemoRunning(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await simulationAPI.resetDemo();
      showMessage('Simulation and Signal States Reset to Normal.', 'warning');
      navigate('/');
    } catch (e) {
      showMessage('Failed to reset demo.', 'danger');
    }
  };

  return (
    <div className="flex h-screen bg-[#0C162A] text-[#F5F8FC] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#16253F] border-r border-[#243452] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-[#243452]">
            <div className="w-9 h-9 rounded-lg bg-[#26D28B]/20 border border-[#26D28B] flex items-center justify-center text-[#26D28B]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                GreenCorridor <span className="text-[#26D28B] text-xs px-1.5 py-0.5 rounded bg-[#26D28B]/10 border border-[#26D28B]/30">AI</span>
              </h1>
              <p className="text-[10px] text-[#8E9EBA] tracking-wider uppercase font-mono">Autonomous Emergency Priority</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#26D28B] text-[#0C162A] font-semibold shadow-sm shadow-[#26D28B]/20'
                        : 'text-[#8E9EBA] hover:text-white hover:bg-[#1E3152]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#243452] bg-[#121E33]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#42BEE2]/20 border border-[#42BEE2]/40 flex items-center justify-center text-[#42BEE2] font-bold text-xs">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.username || 'Administrator'}</p>
                <p className="text-[10px] text-[#42BEE2] truncate font-mono">{user?.role || 'Traffic Admin'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-md text-[#8E9EBA] hover:text-[#FF646E] hover:bg-[#FF646E]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#16253F] border-b border-[#243452] px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#26D28B]/10 border border-[#26D28B]/30 text-xs text-[#26D28B] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#26D28B] animate-ping" />
              CORRIDOR GRID: ONLINE
            </span>
            <span className="text-xs text-[#8E9EBA] hidden md:inline font-mono">
              4 Intersections Coordinated (Central Metro)
            </span>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-3">
            {/* START HACKATHON DEMO BUTTON */}
            <button
              onClick={handleStartDemo}
              disabled={demoRunning}
              className="flex items-center gap-2 px-4 py-2 bg-[#26D28B] hover:bg-[#20b879] text-[#0C162A] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#26D28B]/25 hover:shadow-[#26D28B]/40 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {demoRunning ? 'Launching...' : 'START HACKATHON DEMO'}
            </button>

            {/* RESET DEMO BUTTON */}
            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3152] hover:bg-[#28416B] border border-[#243452] text-xs text-[#8E9EBA] hover:text-white font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="relative p-2 rounded-lg bg-[#1E3152] hover:bg-[#28416B] text-[#8E9EBA] hover:text-white border border-[#243452] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#FF646E] text-white text-[10px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#16253F] border border-[#243452] rounded-xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#243452]">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live System Alerts</span>
                    <span className="text-[10px] text-[#8E9EBA]">{alerts.length} total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 mt-2 pr-1">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-[#8E9EBA] text-center py-4">No recent emergency alerts.</p>
                    ) : (
                      alerts.slice(0, 8).map((a, i) => (
                        <div key={i} className="p-2 rounded bg-[#0C162A]/60 border border-[#243452] text-xs">
                          <p className="text-[#26D28B] font-semibold text-[11px]">{a.alert_type || 'ALERT'}</p>
                          <p className="text-gray-300 text-[11px] mt-0.5 leading-snug">{a.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Toast Banner */}
        {actionMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              actionMessage.type === 'danger'
                ? 'bg-[#FF646E]/20 text-[#FF646E] border-[#FF646E]/40'
                : actionMessage.type === 'warning'
                ? 'bg-[#FFBE4B]/20 text-[#FFBE4B] border-[#FFBE4B]/40'
                : 'bg-[#26D28B]/20 text-[#26D28B] border-[#26D28B]/40'
            }`}
          >
            <span>{actionMessage.msg}</span>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100 font-bold">✕</button>
          </div>
        )}

        {/* Routed Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0C162A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
