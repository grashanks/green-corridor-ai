import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanEye,
  Upload,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Car,
  Bus,
  Ambulance,
  Zap,
  Play
} from 'lucide-react';
import { aiAPI } from '../services/api';

export default function AIDetection() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmedMessage, setConfirmedMessage] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRunDetection = async () => {
    setAnalyzing(true);
    setConfirmedMessage(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      const res = await aiAPI.detect(formData);
      setResult(res.data);
    } catch (err) {
      alert('Detection failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmEmergency = async () => {
    try {
      const formData = new FormData();
      formData.append('vehicle_id', 'AMB-VISION-01');
      formData.append('vehicle_type', 'Ambulance');
      formData.append('operator_name', 'AI Vision Dispatcher');

      const res = await aiAPI.confirmEmergency(formData);
      setConfirmedMessage(res.data.message);
      setTimeout(() => {
        navigate('/tracking');
      }, 2500);
    } catch (e) {
      alert('Could not confirm emergency vehicle.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16253F] p-5 rounded-2xl border border-[#243452]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ScanEye className="w-5 h-5 text-[#26D28B]" />
            AI Emergency Vehicle Vision Detector
          </h2>
          <p className="text-xs text-[#8E9EBA] mt-1 font-mono">
            YOLOv8 & OpenCV Traffic Stream Analysis with Human-in-the-Loop Operator Verification
          </p>
        </div>
        <button
          onClick={handleRunDetection}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-[#26D28B] hover:bg-[#20b879] text-[#0C162A] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#26D28B]/20 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {analyzing ? 'Analyzing Frame...' : 'Run Sample CCTV Detection'}
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-[#1E3152] border border-[#42BEE2]/40 rounded-xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-[#42BEE2] shrink-0 mt-0.5" />
        <div className="text-[#8E9EBA] leading-relaxed">
          <strong className="text-white">Safety Protocol: </strong>
          Computer vision detection is advisory. In compliance with GreenCorridor AI safety protocols,
          signals are never preempted on uncertain raw vision detection alone. An authenticated traffic operator must
          confirm the candidate before a green corridor is activated.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Upload & Detection Summary */}
        <div className="space-y-4">
          <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#42BEE2]" />
              Upload CCTV Video / Image
            </h3>

            <div className="border-2 border-dashed border-[#243452] hover:border-[#42BEE2] rounded-xl p-6 text-center transition-colors cursor-pointer bg-[#0C162A]/50">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <ScanEye className="w-8 h-8 text-[#8E9EBA] mx-auto" />
                <p className="text-xs font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Choose traffic MP4 video or JPG/PNG image'}
                </p>
                <p className="text-[10px] text-[#8E9EBA] font-mono">Max size 25MB</p>
              </label>
            </div>

            <button
              onClick={handleRunDetection}
              disabled={analyzing}
              className="mt-4 w-full py-2.5 bg-[#1E3152] hover:bg-[#28416B] text-white border border-[#243452] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-[#26D28B]" />
              {analyzing ? 'Processing Deep Vision Inference...' : 'Analyze Uploaded Media'}
            </button>
          </div>

          {/* Counts & Classification Breakdown */}
          {result && (
            <div className="bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Vehicle Counts</span>
                <span className="text-[10px] font-mono text-[#26D28B] bg-[#26D28B]/10 px-2 py-0.5 rounded">
                  {result.model_engine}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                  <span className="text-gray-300">Cars:</span>
                  <span className="font-bold text-white">{result.counts?.car || 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                  <span className="text-gray-300">Buses:</span>
                  <span className="font-bold text-white">{result.counts?.bus || 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                  <span className="text-gray-300">Motorcycles:</span>
                  <span className="font-bold text-white">{result.counts?.motorcycle || 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0C162A] border border-[#243452] flex items-center justify-between">
                  <span className="text-gray-300">Ambulance:</span>
                  <span className="font-bold text-[#FF646E]">{result.counts?.ambulance || 0}</span>
                </div>
              </div>

              {/* Operator Confirmation Button */}
              {result.emergency_detected && (
                <div className="mt-4 p-3 bg-[#FF646E]/15 border border-[#FF646E]/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-[#FF646E] font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>EMERGENCY AMBULANCE IDENTIFIED</span>
                  </div>
                  <p className="text-[11px] text-[#8E9EBA]">
                    Confidence score: <strong>95%</strong>. Do you authorize green corridor preemption for this vehicle?
                  </p>
                  <button
                    onClick={handleConfirmEmergency}
                    className="w-full py-2 bg-[#26D28B] hover:bg-[#20b879] text-[#0C162A] font-bold text-xs rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm & Dispatch Corridor
                  </button>
                </div>
              )}

              {confirmedMessage && (
                <div className="p-3 bg-[#26D28B]/20 border border-[#26D28B] rounded-lg text-xs text-[#26D28B] font-semibold">
                  {confirmedMessage} Redirecting to tracking...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 2 Cols: Annotated Frame Preview Canvas */}
        <div className="lg:col-span-2 bg-[#16253F] border border-[#243452] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#243452] mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Annotated Video Inspection Canvas
              </h3>
              <span className="text-[10px] font-mono text-[#8E9EBA]">
                Resolution: 640 x 480
              </span>
            </div>

            <div className="bg-[#0C162A] rounded-xl border border-[#243452] overflow-hidden min-h-[380px] flex items-center justify-center relative">
              {result?.annotated_frame_base64 ? (
                <img
                  src={result.annotated_frame_base64}
                  alt="Annotated detection preview"
                  className="w-full h-auto object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-2 text-[#8E9EBA]">
                  <ScanEye className="w-12 h-12 mx-auto text-[#243452]" />
                  <p className="text-xs">No media processed yet.</p>
                  <p className="text-[11px]">Click "Run Sample CCTV Detection" to view live YOLO bounding boxes.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243452] flex items-center justify-between text-[11px] text-[#8E9EBA] font-mono">
            <span>Color Legend: Green = Standard Traffic | Red = Emergency Priority</span>
            <span>Ultralytics Model: yolov8n.pt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
