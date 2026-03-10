import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Process } from '../types';
import { Activity, Cpu, HardDrive, XCircle, RefreshCw, Zap } from 'lucide-react';

export const SystemMonitorApp: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [activeTab, setActiveTab] = useState<'processes' | 'performance'>('processes');
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateData = () => {
    setProcesses(kernel.getProcesses());
    // Simulate fluctuating memory usage based on process count
    const base = 256; // MB
    const usage = base + (kernel.getProcesses().length * 45) + (Math.random() * 20);
    setMemoryUsage(Math.min(4096, Math.round(usage)));
  };

  const killProcess = (pid: number) => {
    kernel.killProcess(pid);
    updateData();
  };

  const formatTime = (ms: number) => {
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 font-sans text-gray-800">
      {/* Header Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('processes')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'processes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
        >
          <Activity size={16} /> Processes
        </button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'performance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
        >
          <Zap size={16} /> Performance
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'processes' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 w-20">PID</th>
                  <th className="px-4 py-3 w-24">Status</th>
                  <th className="px-4 py-3 w-32">Uptime</th>
                  <th className="px-4 py-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processes.map(p => (
                  <tr key={p.pid} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{p.pid}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{formatTime(p.startTime)}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => killProcess(p.pid)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all"
                        title="End Task"
                      >
                        <XCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* CPU Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <Cpu size={20} />
                <span className="font-bold text-xs uppercase">Virtual CPU</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-light text-blue-600">{Math.round(Math.random() * 30 + 10)}%</span>
                <span className="text-sm text-gray-400 mb-1">Utilization</span>
              </div>
              <div className="h-24 flex items-end gap-1 mt-4 border-b border-gray-100 pb-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-blue-500/20 rounded-t-sm" 
                    style={{ height: `${Math.random() * 80 + 20}%` }} 
                  />
                ))}
              </div>
            </div>

            {/* Memory Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <HardDrive size={20} />
                <span className="font-bold text-xs uppercase">Memory</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-light text-purple-600">{memoryUsage}</span>
                <span className="text-sm text-gray-400 mb-1">MB / 4096 MB</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${(memoryUsage / 4096) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Cached: {Math.round(memoryUsage * 0.3)} MB
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-2 text-xs text-center text-gray-400 flex justify-between px-4">
        <span>Processes: {processes.length}</span>
        <span>Kernel Tick: {100}ms</span>
      </div>
    </div>
  );
};