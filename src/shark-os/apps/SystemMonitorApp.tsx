'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { kernel } from '../services/kernel';
import { soundSystem } from '../services/media/SoundSystem';
import { toast } from '../components/Toast';
import { 
  Activity, Cpu, HardDrive, XCircle, RefreshCw, Zap, 
  Pause, Play, Trash2, Info, ChevronDown, ChevronUp,
  Battery, Wifi, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';

interface ProcessInfo {
  pid: number;
  name: string;
  status: string;
  startTime: number;
  priority: number;
  cpuTime: number;
  memory: number;
}

export const SystemMonitorApp: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'processes' | 'performance' | 'logs'>('processes');
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [sortBy, setSortBy] = useState<'pid' | 'name' | 'memory' | 'cpu'>('pid');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(30).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(Array(30).fill(0));

  const updateData = useCallback(() => {
    const procs = kernel.getProcesses();
    setProcesses(procs);
    
    const stats = kernel.getStats();
    setMemoryUsage(stats.memoryUsage);
    setCpuUsage(Math.floor(Math.random() * 30 + 10));
    setUptime(stats.uptime);
    
    // Update history
    setCpuHistory(prev => [...prev.slice(1), Math.random() * 30 + 10]);
    setMemHistory(prev => [...prev.slice(1), stats.memoryUsage / 4096 * 100]);
    
    // Update logs
    try {
      const kernelLogs = kernel.log.getLogs({ limit: 10 });
      setLogs(kernelLogs.map(l => l.message));
    } catch {}
  }, []);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [updateData]);

  const killProcess = (pid: number) => {
    const proc = processes.find(p => p.pid === pid);
    if (!proc) return;
    
    soundSystem.play('trash');
    kernel.killProcess(pid);
    toast.success('Proceso terminado', `${proc.name} (PID: ${pid})`);
    updateData();
  };

  const pauseProcess = (pid: number) => {
    const proc = processes.find(p => p.pid === pid);
    if (!proc) return;
    
    soundSystem.play('click');
    kernel.pauseProcess(pid);
    toast.info('Proceso pausado', `${proc.name} (PID: ${pid})`);
    updateData();
  };

  const resumeProcess = (pid: number) => {
    const proc = processes.find(p => p.pid === pid);
    if (!proc) return;
    
    soundSystem.play('click');
    kernel.resumeProcess(pid);
    toast.success('Proceso reanudado', `${proc.name} (PID: ${pid})`);
    updateData();
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };

  const formatUptime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    
    if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  const sortedProcesses = [...processes].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'pid': cmp = a.pid - b.pid; break;
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'memory': cmp = (a.memory || 0) - (b.memory || 0); break;
      case 'cpu': cmp = (a.cpuTime || 0) - (b.cpuTime || 0); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  const totalMemory = 4096;
  const usedPercent = (memoryUsage / totalMemory) * 100;

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 font-sans">
      {/* Header Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {[
          { id: 'processes' as const, icon: Activity, label: 'Processes' },
          { id: 'performance' as const, icon: Zap, label: 'Performance' },
          { id: 'logs' as const, icon: Info, label: 'Logs' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400 bg-gray-800/50' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'processes' && (
          <div className="p-4">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="text-gray-400 text-xs uppercase mb-1">Processes</div>
                <div className="text-2xl font-bold text-blue-400">{processes.length}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="text-gray-400 text-xs uppercase mb-1">Running</div>
                <div className="text-2xl font-bold text-green-400">
                  {processes.filter(p => p.status === 'running').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="text-gray-400 text-xs uppercase mb-1">Sleeping</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {processes.filter(p => p.status === 'sleeping').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="text-gray-400 text-xs uppercase mb-1">Uptime</div>
                <div className="text-lg font-bold text-purple-400">{formatUptime(uptime)}</div>
              </div>
            </div>

            {/* Process Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-700/50 text-gray-300 font-semibold text-xs">
                  <tr>
                    <th 
                      className="px-4 py-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('pid')}
                    >
                      PID {sortBy === 'pid' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-4 py-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Uptime</th>
                    <th 
                      className="px-4 py-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('memory')}
                    >
                      Memory {sortBy === 'memory' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedProcesses.map(p => (
                    <tr 
                      key={p.pid} 
                      className={`hover:bg-gray-700/50 transition-colors ${selectedPid === p.pid ? 'bg-blue-900/20' : ''}`}
                      onClick={() => setSelectedPid(selectedPid === p.pid ? null : p.pid)}
                    >
                      <td className="px-4 py-2 font-mono text-gray-400">{p.pid}</td>
                      <td className="px-4 py-2 font-medium">{p.name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'running' ? 'bg-green-500/20 text-green-400' : 
                          p.status === 'sleeping' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-400 tabular-nums">{formatTime(Date.now() - p.startTime)}</td>
                      <td className="px-4 py-2 text-gray-400 tabular-nums">
                        {p.memory ? `${Math.floor(p.memory / 1024 / 1024)} MB` : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-1">
                          {p.status === 'running' ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); pauseProcess(p.pid); }}
                              className="p-1.5 text-yellow-400 hover:bg-yellow-500/20 rounded transition-all"
                              title="Pause"
                            >
                              <Pause size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); resumeProcess(p.pid); }}
                              className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-all"
                              title="Resume"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); killProcess(p.pid); }}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-all"
                            title="Kill"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {processes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Activity size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No processes running</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="p-4 space-y-4">
            {/* CPU & Memory Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* CPU Card */}
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Cpu size={20} />
                    <span className="font-bold text-xs uppercase">Virtual CPU</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{Math.round(cpuUsage)}%</span>
                </div>
                
                {/* CPU Graph */}
                <div className="h-32 flex items-end gap-0.5">
                  {cpuHistory.map((val, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-200"
                      style={{ height: `${val}%` }} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">WASM Virtual Core @ 3.0 GHz</p>
              </div>

              {/* Memory Card */}
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <HardDrive size={20} />
                    <span className="font-bold text-xs uppercase">Memory</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-400">
                    {Math.round(memoryUsage / 1024)} <span className="text-sm text-gray-500">MB</span>
                  </span>
                </div>
                
                {/* Memory Graph */}
                <div className="h-32 flex items-end gap-0.5">
                  {memHistory.map((val, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-200"
                      style={{ height: `${val}%` }} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(memoryUsage / 1024)} MB / 4096 MB ({usedPercent.toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* System Stats */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Activity size={18} /> System Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs uppercase">Context Switches</div>
                  <div className="text-xl font-mono text-gray-200">{kernel.getStats().contextSwitches}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase">CPU Time</div>
                  <div className="text-xl font-mono text-gray-200">{kernel.getStats().cpuTime}ms</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase">Processes</div>
                  <div className="text-xl font-mono text-gray-200">{processes.length}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase">Scheduler Tick</div>
                  <div className="text-xl font-mono text-gray-200">100ms</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 h-[calc(100vh-200px)] overflow-auto font-mono text-xs">
              {logs.length > 0 ? (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className="text-gray-300 py-1 border-b border-gray-700/50">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-12">
                  <Info size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No logs available</p>
                  <p className="text-xs mt-1">Run: shark logs</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-400 flex justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Activity size={12} /> {processes.length} processes
          </span>
          <span className="flex items-center gap-1">
            <Cpu size={12} /> {Math.round(cpuUsage)}% CPU
          </span>
          <span className="flex items-center gap-1">
            <HardDrive size={12} /> {Math.round(memoryUsage / 1024)} MB
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} /> {formatUptime(uptime)}
        </div>
      </div>
    </div>
  );
};
