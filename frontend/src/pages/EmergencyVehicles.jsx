import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ambulance,
  Flame,
  LifeBuoy,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Radio,
  Send,
  ShieldAlert,
  Search
} from 'lucide-react';
import { vehiclesAPI, emergenciesAPI, routesAPI } from '../services/api';

const PREDEFINED_LOCATIONS = [
  { name: 'West Gate Terminal (MG Road)', lat: 12.9700, lon: 77.5900 },
  { name: 'South Police HQ (Richmond Circle)', lat: 12.9650, lon: 77.5980 },
  { name: 'North Fire Station (Shivajinagar)', lat: 12.9860, lon: 77.6030 },
];

const PREDEFINED_HOSPITALS = [
  { name: 'Apollo Super Specialty Hospital (Corridor End)', lat: 12.9840, lon: 77.6180 },
  { name: 'Fortis Emergency Trauma Center', lat: 12.9880, lon: 77.6220 },
  { name: 'Manipal City Health Campus', lat: 12.9780, lon: 77.6250 },
];

export default function EmergencyVehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [form, setForm] = useState({
    vehicle_id: '',
    vehicle_type: 'Ambulance',
    registration_number: '',
    operator_name: '',
    contact_number: '+91 98450 12345',
    priority: 'Critical',
    start_location_idx: 0,
    hospital_idx: 0,
    status: 'Available',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await vehiclesAPI.getAll();
      setVehicles(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.vehicle_id.trim() || !form.registration_number.trim() || !form.operator_name.trim()) {
      setError('Please fill in all required vehicle identification details.');
      return;
    }

    try {
      setLoading(true);
      await vehiclesAPI.create({
        vehicle_id: form.vehicle_id.trim().toUpperCase(),
        vehicle_type: form.vehicle_type,
        registration_number: form.registration_number.trim().toUpperCase(),
        operator_name: form.operator_name.trim(),
        status: form.status,
      });

      setSuccess(`Vehicle ${form.vehicle_id.toUpperCase()} successfully registered in the fleet.`);
      setForm({
        ...form,
        vehicle_id: '',
        registration_number: '',
        operator_name: '',
      });
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm(`Are you sure you want to remove vehicle ${vehicleId}?`)) return;
    try {
      await vehiclesAPI.delete(vehicleId);
      loadVehicles();
    } catch (e) {
      alert('Could not delete vehicle. It may have linked active emergency records.');
    }
  };

  const handleDispatchEmergency = async (vehicle) => {
    try {
      const src = PREDEFINED_LOCATIONS[form.start_location_idx];
      const dst = PREDEFINED_HOSPITALS[form.hospital_idx];

      const emRes = await emergenciesAPI.create({
        vehicle_id: vehicle.vehicle_id,
        source_latitude: src.lat,
        source_longitude: src.lon,
        destination_latitude: dst.lat,
        destination_longitude: dst.lon,
        priority: form.priority,
      });

      // Calculate initial route
      await routesAPI.calculate({
        source_latitude: src.lat,
        source_longitude: src.lon,
        destination_latitude: dst.lat,
        destination_longitude: dst.lon,
        emergency_request_id: emRes.data.id,
      });

      alert(`Emergency dispatch approved for ${vehicle.vehicle_id}! Redirecting to live tracking...`);
      navigate('/tracking');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch emergency request.');
    }
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.vehicle_id.toLowerCase().includes(search.toLowerCase()) ||
    v.operator_name.toLowerCase().includes(search.toLowerCase()) ||
    v.registration_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">Emergency Vehicle Fleet Management</h2>
        <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
          Register emergency response units and configure starting coordinates and destination hospitals.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FF646E]/15 border border-[#FF646E]/40 text-[#FF646E] text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-[#26D28B]/15 border border-[#26D28B]/40 text-[#26D28B] text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Registration Form */}
        <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#26D28B]" />
            Register Emergency Vehicle
          </h3>

          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">Vehicle Identifier *</label>
              <input
                type="text"
                placeholder="e.g. AMB-004, FIRE-201"
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#8E9EBA] mb-1 font-semibold">Vehicle Type</label>
                <select
                  value={form.vehicle_type}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-2.5 py-2 text-white outline-none"
                >
                  <option value="Ambulance">Ambulance</option>
                  <option value="Fire engine">Fire engine</option>
                  <option value="Rescue vehicle">Rescue vehicle</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8E9EBA] mb-1 font-semibold">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-2.5 py-2 text-white outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">License Plate / Reg Number *</label>
              <input
                type="text"
                placeholder="e.g. KA-01-EQ-5544"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white font-mono outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">Operator / Driver Name *</label>
              <input
                type="text"
                placeholder="e.g. Officer Vikram Sharma"
                value={form.operator_name}
                onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-3 py-2 text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">Starting Location Dispatch</label>
              <select
                value={form.start_location_idx}
                onChange={(e) => setForm({ ...form, start_location_idx: Number(e.target.value) })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-2.5 py-2 text-white outline-none"
              >
                {PREDEFINED_LOCATIONS.map((loc, idx) => (
                  <option key={idx} value={idx}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#8E9EBA] mb-1 font-semibold">Destination Medical Facility</label>
              <select
                value={form.hospital_idx}
                onChange={(e) => setForm({ ...form, hospital_idx: Number(e.target.value) })}
                className="w-full bg-[#0C162A] border border-[#243452] focus:border-[#26D28B] rounded-lg px-2.5 py-2 text-white outline-none"
              >
                {PREDEFINED_HOSPITALS.map((hosp, idx) => (
                  <option key={idx} value={idx}>{hosp.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#26D28B] hover:bg-[#20b879] text-[#0C162A] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 2 Cols: Registered Fleet Directory */}
        <div className="lg:col-span-2 bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#243452] mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-[#42BEE2]" />
                Registered Emergency Fleet ({vehicles.length})
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8E9EBA] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search fleet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#0C162A] border border-[#243452] text-xs rounded-lg pl-8 pr-3 py-1.5 text-white outline-none focus:border-[#42BEE2]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#243452] text-[#8E9EBA] font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">ID / Type</th>
                    <th className="pb-2.5">License Plate</th>
                    <th className="pb-2.5">Operator</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243452]">
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-[#1E3152]/40 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {v.vehicle_type === 'Fire engine' ? (
                            <Flame className="w-4 h-4 text-[#FFBE4B]" />
                          ) : v.vehicle_type === 'Rescue vehicle' ? (
                            <LifeBuoy className="w-4 h-4 text-[#42BEE2]" />
                          ) : (
                            <Ambulance className="w-4 h-4 text-[#FF646E]" />
                          )}
                          <div>
                            <p className="font-bold text-white font-mono">{v.vehicle_id}</p>
                            <p className="text-[10px] text-[#8E9EBA]">{v.vehicle_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-gray-300">{v.registration_number}</td>
                      <td className="py-3 text-gray-200">{v.operator_name}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            v.status === 'Active'
                              ? 'bg-[#26D28B]/15 text-[#26D28B] border border-[#26D28B]/30'
                              : v.status === 'Maintenance'
                              ? 'bg-[#FFBE4B]/15 text-[#FFBE4B] border border-[#FFBE4B]/30'
                              : 'bg-[#42BEE2]/15 text-[#42BEE2] border border-[#42BEE2]/30'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDispatchEmergency(v)}
                            title="Dispatch Emergency Corridor"
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#26D28B]/15 hover:bg-[#26D28B]/30 text-[#26D28B] border border-[#26D28B]/30 rounded font-semibold text-[11px] transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch
                          </button>
                          <button
                            onClick={() => handleDelete(v.vehicle_id)}
                            title="Delete"
                            className="p-1 text-[#8E9EBA] hover:text-[#FF646E] hover:bg-[#FF646E]/10 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243452] flex items-center justify-between text-[11px] text-[#8E9EBA] font-mono">
            <span>Duplicate Vehicle ID Prevention: Active</span>
            <span>OSRM Road Geocoding: Synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
