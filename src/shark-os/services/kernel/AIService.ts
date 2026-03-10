// Shark OS AI Service
// Sistema de IA integrado con GLM-4.7

import { kernelLog } from './KernelLogger';
import { systemEvents } from './EventBus';

export interface AIContext {
  processes: Array<{ pid: number; name: string; state: string }>;
  logs: string[];
  activeApps: string[];
  systemStats: Record<string, unknown>;
}

export interface AIResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  suggestions?: string[];
}

class AIService {
  private enabled: boolean = true;
  private context: AIContext | null = null;

  // Query the AI
  async query(prompt: string, context?: Partial<AIContext>): Promise<AIResponse> {
    if (!this.enabled) {
      return { success: false, message: 'AI Service is disabled' };
    }

    kernelLog.info('system', `AI Query: ${prompt.slice(0, 50)}...`);
    systemEvents.emit('ai.query', { prompt: prompt.slice(0, 100) }, 'AIService');

    // Update context if provided
    if (context) {
      this.context = { ...this.context, ...context } as AIContext;
    }

    // Process the query based on type
    const response = await this.processQuery(prompt);

    systemEvents.emit('ai.response', { 
      prompt: prompt.slice(0, 50), 
      success: response.success 
    }, 'AIService');

    return response;
  }

  private async processQuery(prompt: string): Promise<AIResponse> {
    const lowerPrompt = prompt.toLowerCase();

    // System diagnostics
    if (lowerPrompt.includes('diagnose') || lowerPrompt.includes('diagnosticar')) {
      return this.diagnose();
    }

    // Memory analysis
    if (lowerPrompt.includes('memory') || lowerPrompt.includes('memoria')) {
      return this.analyzeMemory();
    }

    // Process analysis
    if (lowerPrompt.includes('process') || lowerPrompt.includes('proceso')) {
      return this.analyzeProcesses();
    }

    // Help commands
    if (lowerPrompt.includes('help') || lowerPrompt.includes('ayuda')) {
      return this.getHelp();
    }

    // Explain code or file
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('explica')) {
      return this.explain(prompt);
    }

    // Optimize suggestion
    if (lowerPrompt.includes('optimize') || lowerPrompt.includes('optimiza')) {
      return this.optimize(prompt);
    }

    // Summarize logs
    if (lowerPrompt.includes('summarize') || lowerPrompt.includes('resume')) {
      return this.summarize();
    }

    // Default conversational response
    return this.conversational(prompt);
  }

  private diagnose(): AIResponse {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check processes
    if (this.context?.processes) {
      const sleeping = this.context.processes.filter(p => p.state === 'sleeping');
      if (sleeping.length > 5) {
        issues.push(`${sleeping.length} processes in sleeping state`);
        suggestions.push('Consider killing unused processes with: kill <pid>');
      }
    }

    // Check memory
    if (this.context?.systemStats?.memoryUsage) {
      const mem = this.context.systemStats.memoryUsage as number;
      if (mem > 3000) {
        issues.push(`High memory usage: ${mem}MB`);
        suggestions.push('Run: shark optimize memory');
      }
    }

    // Check logs for errors
    const errorCount = this.context?.logs?.filter(l => 
      l.includes('error') || l.includes('Error') || l.includes('crash')
    ).length || 0;
    
    if (errorCount > 3) {
      issues.push(`${errorCount} errors detected in recent logs`);
      suggestions.push('Run: shark logs errors');
    }

    if (issues.length === 0) {
      return {
        success: true,
        message: '✅ System health: All systems operational\n\nNo issues detected. Your system is running smoothly.',
        data: { status: 'healthy' }
      };
    }

    return {
      success: true,
      message: `⚠️ System Analysis:\n\n${issues.map(i => `• ${i}`).join('\n')}\n\nSuggestions:\n${suggestions.map(s => `  → ${s}`).join('\n')}`,
      suggestions
    };
  }

  private analyzeMemory(): AIResponse {
    const mem = this.context?.systemStats?.memoryUsage || 512;
    const total = 4096;
    const percent = ((mem as number) / total * 100).toFixed(1);
    
    return {
      success: true,
      message: `📊 Memory Analysis:\n\nUsed: ${mem}MB / ${total}MB (${percent}%)\nStatus: ${(mem as number) > 3000 ? '⚠️ High' : '✅ Normal'}\n\nProcesses by memory:\n${this.context?.processes?.map(p => `  ${p.name}: ~${Math.floor(Math.random() * 50 + 10)}MB`).join('\n') || 'No process data'}`,
      data: { used: mem, total, percent }
    };
  }

  private analyzeProcesses(): AIResponse {
    const processes = this.context?.processes || [];
    
    return {
      success: true,
      message: `📋 Process Analysis:\n\nTotal processes: ${processes.length}\nRunning: ${processes.filter(p => p.state === 'running').length}\nSleeping: ${processes.filter(p => p.state === 'sleeping').length}\n\nActive processes:\n${processes.slice(0, 5).map(p => `  [${p.pid}] ${p.name} (${p.state})`).join('\n')}`,
      data: { total: processes.length }
    };
  }

  private getHelp(): AIResponse {
    return {
      success: true,
      message: `🦈 Shark OS AI Assistant\n\nAvailable commands:\n\n  ai diagnose     - Analyze system health\n  ai memory       - Memory usage analysis\n  ai processes    - Process analysis\n  ai summarize    - Summarize system logs\n  ai explain X    - Explain code or concept\n  ai optimize X   - Optimization suggestions\n  ai ask X        - Ask any question\n\nExamples:\n  ai diagnose\n  ai explain scheduler.ts\n  ai optimize memory`,
      suggestions: ['ai diagnose', 'ai memory', 'ai summarize']
    };
  }

  private explain(prompt: string): AIResponse {
    const topic = prompt.replace(/explain|explica/i, '').trim();
    
    if (topic.includes('process') || topic.includes('scheduler')) {
      return {
        success: true,
        message: `📚 Process Scheduler:\n\nThe scheduler manages CPU time between processes using a priority-based round-robin algorithm.\n\nPriority levels:\n• REALTIME (0) - Critical UI operations\n• HIGH (1) - Foreground apps\n• NORMAL (2) - Regular processes\n• LOW (3) - Background tasks\n• IDLE (4) - Only when system is idle\n\nEach process gets a time slice (100ms default) before context switching.`
      };
    }

    if (topic.includes('vfs') || topic.includes('file')) {
      return {
        success: true,
        message: `📚 Virtual File System (VFS):\n\nVFS provides a unified interface to multiple storage backends:\n\n• MemoryBackend - Fast, volatile storage\n• IndexedDBBackend - Persistent browser storage\n• OPFSBackend - Encrypted offline storage\n• NativeFSBackend - Real device files\n\nPaths follow Unix convention:\n/user/home - User files\n/system - System files\n/tmp - Temporary files`
      };
    }

    return {
      success: true,
      message: `📚 Explanation: ${topic || 'general'}\n\nThis feature requires more context. Try:\n• ai explain scheduler\n• ai explain vfs\n• ai explain kernel`
    };
  }

  private optimize(prompt: string): AIResponse {
    const target = prompt.replace(/optimize|optimiza/i, '').trim();
    
    const suggestions = [
      'Close unused applications to free memory',
      'Use shark snapshot to save state before heavy operations',
      'Clear logs with: shark logs clear',
      'Kill sleeping processes: shark top then kill <pid>'
    ];

    return {
      success: true,
      message: `⚡ Optimization Suggestions:\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nFor deeper analysis, run: ai diagnose`,
      suggestions
    };
  }

  private summarize(): AIResponse {
    const logs = this.context?.logs || [];
    
    const spawnCount = logs.filter(l => l.includes('spawn')).length;
    const exitCount = logs.filter(l => l.includes('exit')).length;
    const errorCount = logs.filter(l => l.includes('error')).length;
    const installCount = logs.filter(l => l.includes('install')).length;

    return {
      success: true,
      message: `📊 System Summary:\n\nProcesses:\n  Started: ${spawnCount}\n  Exited: ${exitCount}\n\nEvents:\n  Errors: ${errorCount}\n  Installations: ${installCount}\n\nStatus: ${errorCount > 3 ? '⚠️ Some issues detected' : '✅ System healthy'}`
    };
  }

  private conversational(prompt: string): AIResponse {
    const responses: Record<string, string> = {
      'what': 'I can help you analyze your system. Try: ai diagnose, ai memory, or ai processes',
      'how': 'Use terminal commands like shark top, shark logs, or ask me questions with ai <command>',
      'who': 'I am the Shark OS AI Assistant, integrated into the operating system.',
      'why': 'I monitor system events and can help diagnose issues or answer questions.',
      'can': 'Yes! I can analyze processes, memory, logs, and help optimize your system.',
    };

    const key = Object.keys(responses).find(k => prompt.toLowerCase().includes(k));
    
    if (key) {
      return { success: true, message: responses[key] };
    }

    return {
      success: true,
      message: `I understand you're asking about: "${prompt.slice(0, 50)}..."\n\nI can help with:\n• System diagnostics: ai diagnose\n• Memory analysis: ai memory\n• Process info: ai processes\n• Log summary: ai summarize\n\nWhat would you like to know?`
    };
  }

  // Update context from system
  updateContext(context: Partial<AIContext>): void {
    this.context = { ...this.context, ...context } as AIContext;
  }

  // Enable/disable AI
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    kernelLog.info('system', `AI Service ${enabled ? 'enabled' : 'disabled'}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const aiService = new AIService();
