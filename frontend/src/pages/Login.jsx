import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Lock,
  User,
  ShieldCheck,
  Ambulance,
  TrafficCone,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0C162A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#26D28B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#42BEE2]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#16253F] border border-[#243452] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#26D28B]/20 border border-[#26D28B] flex items-center justify-center text-[#26D28B] mx-auto mb-3">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">
            GreenCorridor <span className="text-[#26D28B]">AI</span>
          </h1>
          <p className="text-xs text-[#8E9EBA] font-mono">
            AI-Powered Emergency Vehicle Priority System
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FF646E]/15 border border-[#FF646E]/40 text-[#FF646E] text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#8E9EBA] mb-1 font-semibold">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8E9EBA] absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg pl-9 pr-3 py-2 text-white outline-none"
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#8E9EBA] mb-1 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E9EBA] absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg pl-9 pr-3 py-2 text-white outline-none font-mono"
                placeholder="Password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#26D28B] hover:bg-[#20b879] text-[#0C162A] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#26D28B]/20"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Control Center'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Autofill for Hackathon Judges */}
        <div className="pt-4 border-t border-[#243452] space-y-2">
          <p className="text-[11px] text-[#8E9EBA] text-center font-mono">
            Hackathon Demo Roles (1-Click Fill):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'admin123')}
              className="p-2.5 rounded-lg bg-[#0C162A] hover:bg-[#1E3152] border border-[#243452] text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[#26D28B] font-bold">
                <TrafficCone className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <p className="text-[10px] text-[#8E9EBA] font-mono mt-0.5">Traffic Admin</p>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('operator', 'operator123')}
              className="p-2.5 rounded-lg bg-[#0C162A] hover:bg-[#1E3152] border border-[#243452] text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[#42BEE2] font-bold">
                <Ambulance className="w-3.5 h-3.5" />
                <span>Operator</span>
              </div>
              <p className="text-[10px] text-[#8E9EBA] font-mono mt-0.5">Vehicle Operator</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
