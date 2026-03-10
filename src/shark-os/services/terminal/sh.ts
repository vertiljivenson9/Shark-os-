import { ShellCommand } from '../../types';
import { kernel } from '../kernel';

type CommandHandler = (args: string[], env: Record<string, string>, ctx: ShellContext) => Promise<string>;

interface ShellContext {
  cwd: string;
  setCwd: (path: string) => void;
  print: (text: string) => void;
}

const MANUALS: Record<string, string> = {
    ls: 'ls - List directory contents\nUsage: ls [path] [-la]\n\nOptions:\n  -la    List all files with details\n  -a     Show hidden files',
    cd: 'cd - Change the shell working directory\nUsage: cd <path>\n\nExamples:\n  cd /user/home\n  cd ..',
    pwd: 'pwd - Print name of current/working directory',
    cat: 'cat - Concatenate files and print on the standard output\nUsage: cat <file>',
    cp: 'cp - Copy files and directories\nUsage: cp <source> <dest>',
    mv: 'mv - Move (rename) files\nUsage: mv <source> <dest>',
    rm: 'rm - Remove files or directories\nUsage: rm [-rf] <path>\n\nOptions:\n  -r     Recursive\n  -f     Force',
    mkdir: 'mkdir - Create directories\nUsage: mkdir [-p] <directory>\n\nOptions:\n  -p     Create parent directories as needed',
    touch: 'touch - Create empty file or update timestamps\nUsage: touch <file>',
    grep: 'grep - Print lines matching a pattern\nUsage: grep <pattern> [file]\n\nExamples:\n  grep "error" log.txt\n  cat file.txt | grep "hello"',
    find: 'find - Search for files in a directory hierarchy\nUsage: find [path] -name <pattern>',
    ps: 'ps - Report process status\nUsage: ps [-aux]\n\nOptions:\n  -aux   Show all processes with details',
    kill: 'kill - Terminate a process\nUsage: kill [-9] <pid>',
    top: 'top - Display Linux processes (real-time)',
    df: 'df - Report file system disk space usage\nUsage: df [-h]\n\nOptions:\n  -h     Human readable format',
    du: 'du - Estimate file space usage\nUsage: du [-sh] [path]',
    free: 'free - Display amount of free and used memory\nUsage: free [-h]',
    uname: 'uname - Print system information\nUsage: uname [-a]\n\nOptions:\n  -a     Print all information',
    hostname: 'hostname - Show or set the system host name',
    uptime: 'uptime - Tell how long the system has been running',
    neofetch: 'neofetch - Display system information with ASCII art\nUsage: neofetch',
    curl: 'curl - Transfer a URL\nUsage: curl [options] <url>\n\nOptions:\n  -I     Fetch headers only\n  -s     Silent mode',
    wget: 'wget - Non-interactive network downloader\nUsage: wget <url>',
    ping: 'ping - Send ICMP ECHO_REQUEST to network hosts\nUsage: ping <host>',
    ifconfig: 'ifconfig - Configure network interface\nUsage: ifconfig',
    netstat: 'netstat - Print network connections\nUsage: netstat [-tulpn]',
    chmod: 'chmod - Change file mode bits\nUsage: chmod <mode> <file>',
    chown: 'chown - Change file owner\nUsage: chown <user>:<group> <file>',
    history: 'history - Display command history\nUsage: history [-c]\n\nOptions:\n  -c     Clear history',
    export: 'export - Set environment variable\nUsage: export VAR=value',
    env: 'env - Display all environment variables',
    source: 'source - Execute commands from a file\nUsage: source <file>',
    echo: 'echo - Display a line of text\nUsage: echo [options] [string]\n\nOptions:\n  -n     Do not output trailing newline\n  -e     Enable interpretation of backslash escapes',
    printf: 'printf - Format and print data\nUsage: printf <format> [arguments]',
    sleep: 'sleep - Delay for a specified amount of time\nUsage: sleep <seconds>',
    time: 'time - Measure time of command execution\nUsage: time <command>',
    watch: 'watch - Execute a program periodically\nUsage: watch [-n interval] <command>',
    alias: 'alias - Create an alias\nUsage: alias name="command"',
    clear: 'clear - Clear the terminal screen',
    open: 'open - Open a file or application\nUsage: open <app_name|file>',
    man: 'man - Display manual page\nUsage: man <command>',
    help: 'help - Display help information',
    systemctl: 'systemctl - Control the systemd system\nUsage: systemctl <command> [service]\n\nCommands:\n  status   Show service status\n  start    Start service\n  stop     Stop service\n  restart  Restart service',
    journalctl: 'journalctl - Query the journal\nUsage: journalctl [-u service]',
    crontab: 'crontab - Schedule cron jobs\nUsage: crontab [-l|-e]',
    ssh: 'ssh - OpenSSH SSH client (simulated)\nUsage: ssh <user>@<host>',
    scp: 'scp - Secure copy (simulated)\nUsage: scp <source> <dest>',
    tar: 'tar - Archive manipulation\nUsage: tar [-cvzf] <archive> <files>',
    zip: 'zip - Package and compress files\nUsage: zip <archive> <files>',
    unzip: 'unzip - Extract compressed files\nUsage: unzip <archive>',
    git: 'git - Version control system (simulated)\nUsage: git <command>',
    npm: 'npm - Node package manager (simulated)\nUsage: npm <command>',
    python: 'python - Python interpreter (simulated)\nUsage: python <script>',
    node: 'node - Node.js runtime (simulated)\nUsage: node <script>',
};

export class Shell {
  private env: Record<string, string> = {
    'HOME': '/user/home',
    'USER': 'root',
    'PATH': '/system/bin:/usr/bin:/usr/local/bin',
    'SHELL': '/system/bin/bash',
    'TERM': 'xterm-256color',
    'EDITOR': 'nano',
    'LANG': 'en_US.UTF-8',
    'HOSTNAME': 'shark-os',
    'SHARK_VERSION': '15.13',
    'PWD': '/user/home'
  };

  private history: string[] = [];
  private aliases: Record<string, string> = {
    'll': 'ls -la',
    'la': 'ls -a',
    'l': 'ls',
    'cls': 'clear',
    '..': 'cd ..',
    '...': 'cd ../..'
  };
  
  constructor() {}

  // --- Parser ---
  parse(input: string): ShellCommand {
    const rawTokens = this.tokenize(input);
    const argv: string[] = [];
    let redirect: string | null = null;
    const localEnv: Record<string, string> = { ...this.env };

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (token === '>' || token === '>>') {
        if (i + 1 < rawTokens.length) {
          redirect = rawTokens[i+1];
          i++; 
          continue;
        }
      }
      if (token.includes('=') && argv.length === 0) {
        const [key, val] = token.split('=');
        localEnv[key] = this.expand(val, localEnv);
        continue;
      }
      argv.push(this.expand(token, localEnv));
    }
    return { argv, redirect, env: localEnv };
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote: "'" | '"' | null = null;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (inQuote) {
        if (char === inQuote) inQuote = null;
        else current += char;
      } else {
        if (char === '"' || char === "'") inQuote = char;
        else if (char === ' ') {
          if (current.length > 0) { tokens.push(current); current = ''; }
        } else current += char;
      }
    }
    if (current.length > 0) tokens.push(current);
    return tokens;
  }

  private expand(text: string, env: Record<string, string>): string {
    return text.replace(/\$([A-Z_]+)/g, (_, key) => env[key] || '');
  }

  // --- Execution Engine ---
  async exec(cmdStr: string, print: (s: string) => void, setCwd: (p: string) => void, getCwd: () => string): Promise<void> {
    if (!cmdStr.trim()) return;
    this.history.push(cmdStr);
    
    // Expand aliases
    const firstWord = cmdStr.split(' ')[0];
    if (this.aliases[firstWord]) {
      cmdStr = this.aliases[firstWord] + cmdStr.slice(firstWord.length);
    }
    
    // Pipe splitting
    const segments = cmdStr.split('|');
    let previousOutput = '';

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i].trim();
        const { argv, redirect, env } = this.parse(segment);
        
        if (argv.length === 0) continue;

        if (previousOutput && i > 0) {
           argv.push(previousOutput); 
        }

        const cmd = argv[0];
        const args = argv.slice(1);
        const ctx: ShellContext = { cwd: getCwd(), setCwd, print };
        
        Object.assign(this.env, env);
        this.env.PWD = ctx.cwd;

        let output = '';
        
        try {
            if (this.commands[cmd]) {
                output = await this.commands[cmd](args, this.env, ctx);
            } else if (this.powershellCommands[cmd]) {
                output = await this.powershellCommands[cmd](args, this.env, ctx);
            } else {
                const path = cmd.startsWith('/') ? cmd : `${ctx.cwd}/${cmd}`;
                if (await kernel.fs.exists(path)) {
                    output = await this.runScript(path);
                } else if (await kernel.fs.exists(`/system/bin/${cmd}`)) {
                     output = await this.runScript(`/system/bin/${cmd}`);
                } else {
                    throw new Error(`${cmd}: command not found. Type 'help' for available commands.`);
                }
            }
        } catch (e: any) {
            output = `\x1b[31mError:\x1b[0m ${e.message}`;
        }

        if (redirect) {
            const absPath = this.resolvePath(redirect, ctx.cwd);
            await kernel.fs.write(absPath, output);
            output = '';
        }

        previousOutput = output;
        if (i === segments.length - 1 && output) {
            print(output);
        }
    }
  }

  // --- PowerShell-style Commands ---
  private powershellCommands: Record<string, CommandHandler> = {
    'Get-Process': async () => {
      const procs = kernel.getProcesses();
      return `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
${procs.map(p => `     ${Math.floor(Math.random()*100)}       ${Math.floor(Math.random()*10)}    ${Math.floor(Math.random()*50000)}      ${Math.floor(Math.random()*30000)}       0.00   ${p.pid}   1 ${p.name}`).join('\n')}`;
    },
    'Get-Service': async () => {
      return `Status   Name               DisplayName
------   ----               -----------
Running  kernel             Shark OS Kernel
Running  vfs                Virtual File System
Running  ipc                IPC Bus Service
Running  audio              Audio Service
Running  network            Network Stack
Running  scheduler          Process Scheduler`;
    },
    'Get-ChildItem': async (args, env, ctx) => {
      return await this.commands.ls(args, env, ctx);
    },
    'Set-Location': async (args, env, ctx) => {
      return await this.commands.cd(args, env, ctx);
    },
    'Write-Host': async (args) => args.join(' '),
    'Clear-Host': async () => '',
    'Get-Content': async (args, env, ctx) => {
      return await this.commands.cat(args, env, ctx);
    },
    'Get-Help': async (args) => {
      return await this.commands.man(args, {}, {} as ShellContext);
    },
    'Get-Location': async (args, env, ctx) => ctx.cwd,
    'New-Item': async (args, env, ctx) => {
      const path = args[args.indexOf('-Path') + 1] || args[args.indexOf('-Name') + 1] || args[0];
      if (!path) return 'Specify a path';
      await kernel.fs.write(this.resolvePath(path, ctx.cwd), '');
      return `Created: ${path}`;
    },
    'Remove-Item': async (args, env, ctx) => {
      return await this.commands.rm(args.filter(a => !a.startsWith('-')), env, ctx);
    }
  };

  // --- Command Implementations ---
  
  private commands: Record<string, CommandHandler> = {
      // FILESYSTEM OPS
      ls: async (args, env, ctx) => {
          const cleanArgs = args.filter(a => !a.includes('\n')); 
          const target = cleanArgs.find(a => !a.startsWith('-')) || ctx.cwd;
          const path = this.resolvePath(target, ctx.cwd);
          
          try {
             const files = await kernel.fs.ls(path);
             if (args.includes('-la') || args.includes('-l') || args.includes('-al')) {
                 const formatted = files.map(f => {
                     const isDir = f.endsWith('/');
                     const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                     const size = isDir ? 4096 : Math.floor(Math.random() * 10000);
                     const date = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                     return `${perm} 1 root root ${size.toString().padStart(8)} ${date} ${f}`;
                 });
                 return `total ${files.length}\n` + formatted.join('\n');
             }
             if (args.includes('-a') || args.includes('--all')) {
               return files.map(f => f.endsWith('/') ? `\x1b[34m${f}\x1b[0m` : f).join('  ');
             }
             const colored = files.map(f => f.endsWith('/') ? `\x1b[34m${f}\x1b[0m` : f);
             return colored.join('  ');
          } catch (e) {
             throw new Error(`ls: cannot access '${path}': No such file or directory`);
          }
      },
      
      cd: async (args, env, ctx) => {
          const path = this.resolvePath(args[0] || env.HOME, ctx.cwd);
          if (await kernel.fs.exists(path)) { 
              ctx.setCwd(path);
              return '';
          }
          throw new Error(`cd: ${path}: No such file or directory`);
      },
      
      pwd: async (args, env, ctx) => ctx.cwd,
      
      mkdir: async (args, env, ctx) => {
          const hasP = args.includes('-p');
          const paths = args.filter(a => !a.startsWith('-'));
          if (paths.length === 0) throw new Error('mkdir: missing operand');
          for (const p of paths) {
            await kernel.fs.mkdir(this.resolvePath(p, ctx.cwd)).catch(e => {
              if (!hasP) throw e;
            });
          }
          return '';
      },
      
      touch: async (args, env, ctx) => {
          if (!args[0]) throw new Error('touch: missing operand');
          const path = this.resolvePath(args[0], ctx.cwd);
          if (!(await kernel.fs.exists(path))) {
            await kernel.fs.write(path, '');
          }
          return '';
      },
      
      rm: async (args, env, ctx) => {
          const hasR = args.includes('-r') || args.includes('-rf') || args.includes('-R');
          const hasF = args.includes('-f') || args.includes('-rf') || args.includes('-fr');
          const targets = args.filter(a => !a.startsWith('-') && !a.includes('\n'));
          
          if (targets.length === 0) {
            if (hasF) return '';
            throw new Error('rm: missing operand');
          }
          
          for (const target of targets) {
            try {
              await kernel.fs.rm(this.resolvePath(target, ctx.cwd));
            } catch (e: any) {
              if (!hasF) throw new Error(`rm: cannot remove '${target}': ${e.message}`);
            }
          }
          return '';
      },
      
      cp: async (args, env, ctx) => {
          if (args.length < 2) throw new Error('cp: missing file operand\nUsage: cp <source> <dest>');
          const src = this.resolvePath(args[0], ctx.cwd);
          const dest = this.resolvePath(args[1], ctx.cwd);
          const content = await kernel.fs.cat(src);
          await kernel.fs.write(dest, content);
          return '';
      },
      
      mv: async (args, env, ctx) => {
          if (args.length < 2) throw new Error('mv: missing file operand\nUsage: mv <source> <dest>');
          const src = this.resolvePath(args[0], ctx.cwd);
          const dest = this.resolvePath(args[1], ctx.cwd);
          const content = await kernel.fs.cat(src);
          await kernel.fs.write(dest, content);
          await kernel.fs.rm(src);
          return '';
      },
      
      cat: async (args, env, ctx) => {
          if (args.length === 0) return '';
          try {
             const path = this.resolvePath(args[0], ctx.cwd);
             return await kernel.fs.cat(path);
          } catch {
             return args[0];
          }
      },
      
      find: async (args, env, ctx) => {
          const nameIdx = args.indexOf('-name');
          const pattern = nameIdx !== -1 ? args[nameIdx + 1] : '*';
          const startPath = args.find(a => !a.startsWith('-')) || ctx.cwd;
          
          const results: string[] = [];
          const search = async (path: string) => {
            try {
              const files = await kernel.fs.ls(path);
              for (const f of files) {
                const fullPath = `${path}/${f}`.replace(/\/+/g, '/');
                if (pattern === '*' || f.includes(pattern.replace(/\*/g, ''))) {
                  results.push(fullPath);
                }
                if (f.endsWith('/')) {
                  await search(fullPath.slice(0, -1));
                }
              }
            } catch {}
          };
          
          await search(this.resolvePath(startPath, ctx.cwd));
          return results.join('\n') || 'No files found';
      },

      // TEXT PROCESSING
      grep: async (args, env, ctx) => {
          if (args.length === 0) throw new Error('grep: usage: grep [pattern] [file]');
          const pattern = args[0];
          let content = '';
          
          if (args[1] && !args[1].includes('\n')) {
              try {
                  content = await kernel.fs.cat(this.resolvePath(args[1], ctx.cwd));
              } catch {
                  content = args[1]; 
              }
          } else if (args[1]) {
              content = args[1];
          }
          
          if (!content) return '';
          
          const regex = new RegExp(pattern, 'g');
          const matches = content.split('\n').filter(line => line.match(regex));
          return matches.map(line => line.replace(regex, '\x1b[31m$&\x1b[0m')).join('\n');
      },
      
      head: async (args, env, ctx) => {
          const nIndex = args.indexOf('-n');
          let count = 10;
          if (nIndex !== -1 && args[nIndex + 1]) {
              count = parseInt(args[nIndex + 1]);
          }
          
          const target = args.find((a, i) => !a.startsWith('-') && i !== nIndex + 1);
          let content = target || '';
          
          if (target && !target.includes('\n')) {
             try { content = await kernel.fs.cat(this.resolvePath(target, ctx.cwd)); } catch {}
          }
          
          return content.split('\n').slice(0, count).join('\n');
      },
      
      tail: async (args, env, ctx) => {
          const nIndex = args.indexOf('-n');
          let count = 10;
          if (nIndex !== -1 && args[nIndex + 1]) {
              count = parseInt(args[nIndex + 1]);
          }
          
          const target = args.find((a, i) => !a.startsWith('-') && i !== nIndex + 1);
          let content = target || '';
          
          if (target && !target.includes('\n')) {
             try { content = await kernel.fs.cat(this.resolvePath(target, ctx.cwd)); } catch {}
          }
          
          const lines = content.split('\n');
          return lines.slice(Math.max(lines.length - count, 0)).join('\n');
      },
      
      wc: async (args, env, ctx) => {
          const hasL = args.includes('-l');
          const hasW = args.includes('-w');
          const hasC = args.includes('-c');
          
          const target = args.find(a => !a.startsWith('-'));
          let content = target || '';
          if (target && !target.includes('\n')) {
             try { content = await kernel.fs.cat(this.resolvePath(target, ctx.cwd)); } catch {}
          }
          
          const lines = content.split('\n').length;
          const words = content.split(/\s+/).filter(w => w).length;
          const chars = content.length;
          
          if (hasL) return lines.toString();
          if (hasW) return words.toString();
          if (hasC) return chars.toString();
          
          return `  ${lines}   ${words}  ${chars} ${target || ''}`;
      },
      
      sort: async (args, env, ctx) => {
        const target = args.find(a => !a.startsWith('-'));
        let content = target || '';
        if (target && !target.includes('\n')) {
           try { content = await kernel.fs.cat(this.resolvePath(target, ctx.cwd)); } catch {}
        }
        return content.split('\n').sort().join('\n');
      },
      
      uniq: async (args, env, ctx) => {
        const target = args.find(a => !a.startsWith('-'));
        let content = target || '';
        if (target && !target.includes('\n')) {
           try { content = await kernel.fs.cat(this.resolvePath(target, ctx.cwd)); } catch {}
        }
        return [...new Set(content.split('\n'))].join('\n');
      },

      // SYSTEM
      uname: async (args) => {
        const hasA = args.includes('-a');
        if (hasA) {
          return 'Linux shark-os 5.15.0-shark-wasm #1 SMP PREEMPT_DYNAMIC Shark OS x86_64 GNU/Linux';
        }
        return 'Linux';
      },
      
      hostname: async () => 'shark-os',
      
      uptime: async () => {
          const uptimeMs = Date.now() - kernel.bootTime;
          const days = Math.floor(uptimeMs / 86400000);
          const hours = Math.floor((uptimeMs % 86400000) / 3600000);
          const mins = Math.floor((uptimeMs % 3600000) / 60000);
          
          const loadAvg = (Math.random() * 0.5).toFixed(2);
          
          return ` ${days === 0 ? '' : days + ' days, '}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} up,  1 user,  load average: ${loadAvg}, ${loadAvg}, ${(parseFloat(loadAvg) + 0.1).toFixed(2)}`;
      },
      
      whoami: async (args, env) => env.USER,
      
      id: async (args, env) => `uid=0(${env.USER}) gid=0(${env.USER}) groups=0(${env.USER})`,
      
      date: async () => new Date().toString(),
      
      clear: async () => '',
      
      echo: async (args) => {
        const hasN = args.includes('-n');
        const hasE = args.includes('-e');
        const text = args.filter(a => !a.startsWith('-')).join(' ');
        
        let processed = text;
        if (hasE) {
          processed = processed
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\e/g, '\x1b')
            .replace(/\\\\/g, '\\');
        }
        
        return processed + (hasN ? '' : '\n');
      },
      
      printf: async (args) => {
        const format = args[0] || '';
        const values = args.slice(1);
        let result = format;
        values.forEach((v, i) => {
          result = result.replace(/%[sdif]/, v);
        });
        return result.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      },
      
      history: async (args) => {
        if (args.includes('-c')) {
          this.history = [];
          return 'History cleared';
        }
        return this.history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`).join('\n');
      },
      
      env: async (args, env) => {
        return Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n');
      },
      
      export: async (args, env) => {
        if (args.length === 0) {
          return Object.entries(env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n');
        }
        const [key, val] = args[0].split('=');
        if (key && val !== undefined) {
          env[key] = val;
        }
        return '';
      },
      
      alias: async (args) => {
        if (args.length === 0) {
          return Object.entries(this.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n');
        }
        const match = args.join(' ').match(/(\w+)=['"](.+)['"]/);
        if (match) {
          this.aliases[match[1]] = match[2];
          return '';
        }
        return 'Usage: alias name="command"';
      },
      
      open: async (args, env, ctx) => {
          const appName = args[0];
          if (!appName) return 'Usage: open <app_name|file>';
          kernel.launchApp(appName.toLowerCase());
          return `Launching ${appName}...`;
      },
      
      // PROCESS MANAGEMENT
      ps: async (args, env, ctx) => {
        const procs = kernel.getProcesses();
        const hasAux = args.includes('-aux') || args.includes('aux') || args.includes('-a');
        
        if (hasAux) {
          return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
${procs.map(p => `root     ${String(p.pid).padStart(5)}  0.0  0.1 ${String(Math.floor(Math.random()*100000)).padStart(6)} ${String(Math.floor(Math.random()*5000)).padStart(5)} pts/0    S    ${new Date(p.startTime).toLocaleTimeString().slice(0,5)}   0:00 ${p.name}`).join('\n')}`;
        }
        
        return `  PID TTY          TIME CMD
${procs.map(p => `${String(p.pid).padStart(5)} pts/0    00:00:00 ${p.name}`).join('\n')}`;
      },
      
      kill: async (args, env, ctx) => {
        const has9 = args.includes('-9');
        const pid = parseInt(args.find(a => !a.startsWith('-')) || '0');
        
        if (!pid) throw new Error('kill: usage: kill [-9] <pid>');
        
        const success = kernel.killProcess(pid);
        if (success) return '';
        throw new Error(`kill: (${pid}) - No such process`);
      },
      
      top: async (args, env, ctx) => {
        const procs = kernel.getProcesses();
        const uptime = Math.floor((Date.now() - kernel.bootTime) / 1000);
        const memTotal = 4096;
        const memUsed = 512 + procs.length * 50;
        
        return `top - ${new Date().toLocaleTimeString()} up ${uptime}s, 1 user, load average: 0.00, 0.01, 0.05
Tasks: ${procs.length} total, 1 running, ${procs.length - 1} sleeping, 0 stopped, 0 zombie
%Cpu(s):  2.3 us,  1.0 sy,  0.0 ni, 96.5 id,  0.2 wa,  0.0 hi,  0.0 si
MiB Mem :   ${memTotal}.0 total,   ${memTotal - memUsed}.5 free,   ${memUsed}.5 used,     50.0 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.   3500.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
${procs.map(p => `${String(p.pid).padStart(5)} root      20   0   50000   5000   2000 S   0.0   0.1   0:00.00 ${p.name}`).join('\n')}`;
      },
      
      // DISK
      df: async (args, env, ctx) => {
        const hasH = args.includes('-h');
        
        if (hasH) {
          return `Filesystem      Size  Used Avail Use% Mounted on
/dev/shark-os   50G   2.0G   48G   4% /
tmpfs           512M   12M  500M   3% /tmp
opfs            2.0G  256M  1.8G  13% /user/secure`;
        }
        
        return `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/shark-os   52428800  2097152  50331648   4% /
tmpfs            524288    12288    512000   3% /tmp
opfs            2097152   262144   1835008  13% /user/secure`;
      },
      
      du: async (args, env, ctx) => {
        const hasH = args.includes('-h');
        const hasS = args.includes('-s');
        const path = args.find(a => !a.startsWith('-')) || ctx.cwd;
        
        const size = Math.floor(Math.random() * 500000) + 1000;
        
        if (hasS) {
          return hasH ? `${(size/1024).toFixed(1)}M\t${path}` : `${size}\t${path}`;
        }
        
        return `${hasH ? (size/1024).toFixed(1) + 'M' : size}\t${path}`;
      },
      
      free: async (args, env, ctx) => {
        const hasH = args.includes('-h');
        
        if (hasH) {
          return `              total        used        free      shared  buff/cache   available
Mem:          4.0Gi       512Mi       3.5Gi        12Mi        50Mi       3.5Gi
Swap:            0B          0B          0B`;
        }
        
        return `              total        used        free      shared  buff/cache   available
Mem:        4194304      524288     3670016      12288       51200     3670016
Swap:             0           0           0`;
      },

      // NETWORK
      curl: async (args, env, ctx) => {
          const url = args.find(a => a.startsWith('http'));
          if (!url) return 'curl: try \'curl --help\' for more information';
          
          const hasI = args.includes('-I');
          const hasS = args.includes('-s');
          
          if (!hasS) ctx.print(`  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0`);
          
          try {
            if (hasI) {
              return `HTTP/2 200
content-type: text/html; charset=utf-8
date: ${new Date().toUTCString()}
server: shark-os/${this.env.SHARK_VERSION}
`;
            }
            return await kernel.net.request(url);
          } catch(e: any) {
             throw new Error(`curl: (6) Could not resolve host: ${e.message}`);
          }
      },
      
      wget: async (args, env, ctx) => {
        const url = args.find(a => a.startsWith('http'));
        if (!url) return 'wget: missing URL';
        
        ctx.print(`--${new Date().toISOString()}--  ${url}`);
        ctx.print(`Connecting to ${new URL(url).hostname}... connected.`);
        ctx.print(`HTTP request sent, awaiting response... 200 OK`);
        
        return `Length: 12345 (12K) [text/html]
Saving to: 'index.html'

index.html          100%[===================>]  12.05K  --.-KB/s    in 0.01s

${new Date().toISOString()} (1.20 MB/s) - 'index.html' saved [12345/12345]`;
      },
      
      ping: async (args, env, ctx) => {
        const host = args[0];
        if (!host) return 'Usage: ping <host>';
        
        let output = `PING ${host} (${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}) 56(84) bytes of data.\n`;
        
        for (let i = 1; i <= 4; i++) {
          const time = (Math.random() * 50 + 10).toFixed(3);
          output += `64 bytes from ${host}: icmp_seq=${i} ttl=117 time=${time} ms\n`;
        }
        
        output += `\n--- ${host} ping statistics ---\n`;
        output += `4 packets transmitted, 4 received, 0% packet loss, time ${Math.floor(Math.random()*100)}ms\n`;
        output += `rtt min/avg/max/mdev = 10.000/25.000/45.000/15.000 ms`;
        
        return output;
      },
      
      ifconfig: async () => {
        return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.${Math.floor(Math.random()*255)}  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:00:00:00:00:00  txqueuelen 1000  (Ethernet)
        RX packets 12345  bytes 1234567 (1.2 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 54321  bytes 5432109 (5.4 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 100  bytes 10000 (10.0 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 100  bytes 10000 (10.0 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0`;
      },
      
      netstat: async (args) => {
        const hasTulpn = args.includes('-tulpn');
        if (hasTulpn) {
          return `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1/kernel
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      1/kernel
tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN      1/kernel
udp        0      0 0.0.0.0:68              0.0.0.0:*                           1/kernel`;
        }
        return 'Active Internet connections';
      },

      // SYSTEMCTL
      systemctl: async (args) => {
        const cmd = args[0];
        const service = args[1];
        
        if (cmd === 'status') {
          return `● ${service || 'shark-os'}.service - Shark OS Core Service
     Loaded: loaded (/etc/systemd/system/${service || 'shark-os'}.service; enabled; vendor preset: enabled)
     Active: active (running) since ${new Date(kernel.bootTime).toISOString()};
       Docs: man:shark-os(1)
   Main PID: 1 (kernel)
      Tasks: ${kernel.getProcesses().length} (limit: 4915)
     Memory: 512.0M
     CGroup: /system.slice/${service || 'shark-os'}.service
             └─1 /usr/bin/shark-os`;
        }
        
        if (['start', 'stop', 'restart', 'enable', 'disable'].includes(cmd)) {
          return `Operation ${cmd} on ${service || 'service'} completed successfully`;
        }
        
        return `systemctl: Usage: systemctl {start|stop|restart|status|enable|disable} SERVICE`;
      },
      
      journalctl: async (args) => {
        const uIdx = args.indexOf('-u');
        const service = uIdx !== -1 ? args[uIdx + 1] : 'kernel';
        
        return `-- Logs begin at ${new Date(kernel.bootTime).toISOString()}. --
${new Date(Date.now() - 60000).toISOString()} shark-os ${service}[1]: Service started
${new Date(Date.now() - 30000).toISOString()} shark-os ${service}[1]: Running normally
${new Date().toISOString()} shark-os ${service}[1]: All systems operational`;
      },

      // ARCHIVE
      tar: async (args, env, ctx) => {
        const hasC = args.includes('-c');
        const hasX = args.includes('-x');
        const hasZ = args.includes('-z');
        const hasV = args.includes('-v');
        const hasF = args.includes('-f');
        
        if (hasC) {
          const archive = args[args.indexOf('-f') + 1] || 'archive.tar';
          return hasV ? `${archive} created` : '';
        }
        
        if (hasX) {
          return hasV ? `Extracted successfully` : '';
        }
        
        return 'tar: Usage: tar [-cxzvf] archive files...';
      },
      
      zip: async (args, env, ctx) => {
        const archive = args[0];
        if (!archive) return 'zip: missing archive name';
        return `  adding: ${args[1] || 'files'} (deflated 50%)`;
      },
      
      unzip: async (args, env, ctx) => {
        const archive = args[0];
        if (!archive) return 'unzip: missing archive';
        return `Archive: ${archive}
  inflating: extracted_files
  extracting: complete`;
      },

      // HELP
      man: async (args) => {
          const cmd = args[0];
          if (!cmd) return 'What manual page do you want?\nTry: man ls, man cd, man neofetch';
          if (MANUALS[cmd]) return MANUALS[cmd];
          return `No manual entry for ${cmd}`;
      },
      
      help: async () => {
          const cmds = Object.keys(this.commands).sort();
          const psCmds = Object.keys(this.powershellCommands).sort();
          
          return `
\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
\x1b[1;34m  🦈 Shark OS Terminal v15.13 - Advanced Shell\x1b[0m
\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m

\x1b[33mBash Commands:\x1b[0m
${cmds.slice(0, 25).map(c => c.padEnd(10)).reduce((acc, c, i) => acc + c + ((i + 1) % 6 === 0 ? '\n' : ''), '')}

\x1b[33mPowerShell Commands:\x1b[0m
${psCmds.map(c => c.padEnd(18)).join('\n')}

\x1b[33mSpecial Commands:\x1b[0m
  neofetch    Show system info with ASCII art
  matrix      Enter matrix mode
  theme       Change terminal theme

\x1b[90mType 'man <command>' for help on a specific command.\x1b[0m
`;
      },

      // FUN / MISC
      neofetch: async () => {
          const uptime = Math.floor((Date.now() - kernel.bootTime) / 60000);
          const procs = kernel.getProcesses().length;
          const shell = this.env.SHELL.split('/').pop();
          
          return `
\x1b[38;5;39m        ▄▄▄▄▄▄▄▄                \x1b[0m\x1b[1mroot\x1b[0m@\x1b[38;5;39mshark-os\x1b[0m
\x1b[38;5;39m     ▄██████████████▄             \x1b[0m─────────────────
\x1b[38;5;39m   ▄████████████████████▄          \x1b[0m\x1b[1mOS:\x1b[0m Shark OS 15.13 Apex
\x1b[38;5;39m  ████████████████████████         \x1b[0m\x1b[1mHost:\x1b[0m Virtual Browser Machine
\x1b[38;5;45m ██████████████████████████       \x1b[0m\x1b[1mKernel:\x1b[0m 5.15.0-shark-wasm
\x1b[38;5;45m████████████████████████████      \x1b[0m\x1b[1mUptime:\x1b[0m ${uptime} mins
\x1b[38;5;51m████████████████████████████      \x1b[0m\x1b[1mPackages:\x1b[0m 20 (shark)
\x1b[38;5;51m████████████████████████████      \x1b[0m\x1b[1mShell:\x1b[0m ${shell} 5.0
\x1b[38;5;51m████████████████████████████      \x1b[0m\x1b[1mResolution:\x1b[0m ${typeof window !== 'undefined' ? window.innerWidth : 1920}x${typeof window !== 'undefined' ? window.innerHeight : 1080}
\x1b[38;5;159m████████████████████████████      \x1b[0m\x1b[1mDE:\x1b[0m Shark Desktop Environment
\x1b[38;5;159m████████████████████████████      \x1b[0m\x1b[1mWM:\x1b[0m SharkWM
\x1b[38;5;159m███████████████████████████       \x1b[0m\x1b[1mTerminal:\x1b[0m SharkTerm
\x1b[38;5;159m ██████████████████████████       \x1b[0m\x1b[1mCPU:\x1b[0m WASM Virtual Core @ 3.0GHz
\x1b[38;5;159m  ████████████████████████        \x1b[0m\x1b[1mMemory:\x1b[0m 512MiB / 4096MiB
\x1b[38;5;159m   ███████████████████████        
\x1b[38;5;159m    █████████████████████         \x1b[0m\x1b[38;5;39m▄▄▄▄▄▄▄▄\x1b[0m\x1b[38;5;45m▄▄▄▄▄▄▄▄\x1b[0m\x1b[38;5;51m▄▄▄▄▄▄▄▄\x1b[0m\x1b[38;5;159m▄▄▄▄▄▄▄▄\x1b[0m
\x1b[38;5;159m      ███████████████████          \x1b[0m\x1b[48;5;39m        \x1b[0m\x1b[48;5;45m        \x1b[0m\x1b[48;5;51m        \x1b[0m\x1b[48;5;159m        \x1b[0m
\x1b[38;5;159m        ████████████████           \x1b[0m
\x1b[38;5;159m          ████████████            
\x1b[38;5;159m            ████████              
\x1b[38;5;159m              ████                

\x1b[90m   🦈 "The apex predator of web operating systems"\x1b[0m
`;
      },
      
      matrix: async () => "",
      theme: async () => "",
      
      // Simulated commands
      git: async (args) => {
        const cmd = args[0];
        if (cmd === 'status') return 'On branch main\nnothing to commit, working tree clean';
        if (cmd === 'log') return 'commit abc123 (HEAD -> main)\nAuthor: root <root@shark-os>\nDate: ' + new Date().toString();
        if (cmd === 'branch') return '* main';
        return 'git: simulated command - repository not initialized';
      },
      
      npm: async (args) => {
        if (args[0] === 'install') return 'added 1 package in 0.5s';
        if (args[0] === 'list') return 'shark-os@15.13.0';
        return 'npm: simulated command';
      },
      
      python: async (args) => `Python 3.11.0 (simulated)
>>> (interactive mode not available)`,
      
      node: async (args) => `Node.js v18.0.0 (simulated)
> (interactive mode not available)`,
      
      sleep: async (args) => {
        const secs = parseInt(args[0]) || 1;
        await new Promise(r => setTimeout(r, secs * 1000));
        return '';
      },
      
      time: async (args, env, ctx) => {
        const start = Date.now();
        const cmd = args[0];
        if (cmd && this.commands[cmd]) {
          await this.commands[cmd](args.slice(1), env, ctx);
        }
        const elapsed = Date.now() - start;
        return `\nreal\t0m${(elapsed/1000).toFixed(3)}s\nuser\t0m0.001s\nsys\t0m0.000s`;
      },
      
      watch: async (args, env, ctx) => {
        return 'watch: simulated - use Ctrl+C to stop (not available)';
      },
      
      crontab: async (args) => {
        if (args.includes('-l')) return '# no crontab for root';
        return 'crontab: simulated';
      },
      
      ssh: async (args) => {
        const host = args[0] || 'localhost';
        return `ssh: connect to host ${host} port 22: Connection refused (simulated)`;
      },
      
      scp: async (args) => {
        return 'scp: simulated - file transfer not available';
      },
      
      chmod: async (args, env, ctx) => {
        const file = args[args.length - 1];
        return `chmod: mode changed for ${file}`;
      },
      
      chown: async (args, env, ctx) => {
        const file = args[args.length - 1];
        return `chown: ownership changed for ${file}`;
      },
      
      source: async (args, env, ctx) => {
        if (!args[0]) return 'source: filename argument required';
        const path = this.resolvePath(args[0], ctx.cwd);
        if (!(await kernel.fs.exists(path))) {
          throw new Error(`source: ${args[0]}: No such file`);
        }
        return '';
      },
      
      // ===== SHARK OS SPECIFIC COMMANDS =====
      
      shark: async (args, env, ctx) => {
        const subcommand = args[0];
        
        switch (subcommand) {
          case 'top':
            return kernel.getProcesses().map(p => 
              `${String(p.pid).padStart(5)}  ${(p.name || 'unknown').padEnd(12)} ${(p.status || 'running').padEnd(10)} ${String(p.cpuTime || 0).padEnd(8)} ${p.memory ? Math.floor(p.memory / 1024 / 1024) + 'MB' : 'N/A'}`
            ).join('\n') || 'No processes running';
            
          case 'logs':
            const logFilter = args[1];
            if (logFilter === 'process') {
              return kernelLog.getFormattedLogs({ category: 'process', limit: 20 });
            }
            if (logFilter === 'errors') {
              return kernelLog.getFormattedLogs({ level: 'error', limit: 20 });
            }
            return kernelLog.getFormattedLogs({ limit: 30 });
            
          case 'install':
            const runtime = args[1];
            if (!runtime) return 'Usage: shark install <python|node|lua|ruby|deno|bun>';
            
            const runtimes = kernel.runtime.getAvailable();
            const rt = runtimes.find(r => r.id === runtime);
            if (!rt) return `Unknown runtime: ${runtime}. Available: ${runtimes.map(r => r.id).join(', ')}`;
            
            if (rt.installed) return `${rt.name} is already installed`;
            
            ctx.print(`Installing ${rt.name}...\n`);
            const result = await kernel.runtime.install(runtime, (progress, msg) => {
              ctx.print(`[${progress}%] ${msg}\n`);
            });
            
            return result.message;
            
          case 'snapshot':
            const snapAction = args[1];
            
            if (snapAction === 'create') {
              const name = args[2] || `Snapshot ${new Date().toLocaleString()}`;
              const data = {
                version: '15.13',
                timestamp: Date.now(),
                windows: [],
                processes: kernel.getProcesses(),
                settings: {},
                wallpaper: '',
                brightness: 100
              };
              const snap = await kernel.snapshots.create(name, data);
              return `Snapshot created: ${snap.id.slice(0, 8)}... (${name})`;
            }
            
            if (snapAction === 'list') {
              return kernel.snapshots.getFormattedList();
            }
            
            if (snapAction === 'restore') {
              const snapId = args[2];
              if (!snapId) return 'Usage: shark snapshot restore <id>';
              const data = await kernel.snapshots.restore(snapId);
              if (!data) return `Snapshot not found: ${snapId}`;
              return `Snapshot restored: ${snapId}`;
            }
            
            return 'Usage: shark snapshot <create|list|restore> [name|id]';
            
          case 'safe-mode':
            kernel.setSafeMode(true);
            return 'Safe mode enabled. Only terminal available.';
            
          case 'stats':
            const stats = kernel.getStats();
            return `Shark OS System Stats

CPU time used: ${stats.cpuTime}ms
Context switches: ${stats.contextSwitches}
Processes running: ${stats.processCount}
System uptime: ${Math.floor(stats.uptime / 60000)}m ${Math.floor((stats.uptime % 60000) / 1000)}s
Memory usage: ${Math.floor(stats.memoryUsage / 1024 / 1024)}MB`;
            
          case 'help':
            return `🦈 Shark OS System Commands

Process Management:
  shark top              Show running processes
  shark stats            System statistics
  
Logging:
  shark logs             Show system logs
  shark logs process     Process logs only
  shark logs errors      Error logs only

Runtimes:
  shark install python   Install Python runtime
  shark install node     Install Node.js runtime
  shark install lua      Install Lua runtime

Snapshots:
  shark snapshot create <name>   Create system snapshot
  shark snapshot list            List all snapshots
  shark snapshot restore <id>    Restore from snapshot

System:
  shark safe-mode        Enable safe mode
  shark help             Show this help
`;
            
          default:
            return 'Shark OS v15.13\n\nUsage: shark <command>\n\nCommands: top, logs, install, snapshot, stats, safe-mode, help';
        }
      },
      
      kill: async (args) => {
        const pid = parseInt(args[0]);
        if (isNaN(pid)) return 'Usage: kill <pid>';
        
        const success = kernel.killProcess(pid);
        return success ? `Process ${pid} killed` : `Process ${pid} not found`;
      },
      
      pause: async (args) => {
        const pid = parseInt(args[0]);
        if (isNaN(pid)) return 'Usage: pause <pid>';
        
        const success = kernel.pauseProcess(pid);
        return success ? `Process ${pid} paused` : `Process ${pid} not found`;
      },
      
      resume: async (args) => {
        const pid = parseInt(args[0]);
        if (isNaN(pid)) return 'Usage: resume <pid>';
        
        const success = kernel.resumeProcess(pid);
        return success ? `Process ${pid} resumed` : `Process ${pid} not found`;
      },
      
      ai: async (args, env, ctx) => {
        const query = args.join(' ');
        if (!query) return 'Usage: ai <question or command>\n\nExamples:\n  ai diagnose\n  ai memory\n  ai processes\n  ai summarize logs\n  ai explain scheduler';
        
        // Update AI context
        kernel.ai.updateContext({
          processes: kernel.getProcesses(),
          logs: kernel.log.getLogs({ limit: 50 }).map(l => l.message),
          activeApps: [],
          systemStats: kernel.getStats() as unknown as Record<string, unknown>
        });
        
        const response = await kernel.ai.query(query);
        return response.message;
      }
  };

  private async runScript(path: string): Promise<string> {
      try {
          const content = await kernel.fs.cat(path);
          if (content.startsWith('#!/bin/bash')) return '';
          const fn = new Function('kernel', 'print', content);
          let logs = '';
          fn(kernel, (s: any) => logs += s + '\n');
          return logs;
      } catch (e: any) {
          return `Exec error: ${e.message}`;
      }
  }

  private resolvePath(path: string, cwd: string): string {
    if (!path) return cwd;
    if (path.startsWith('/')) return path;
    if (path === '..') return cwd.split('/').slice(0, -1).join('/') || '/';
    if (path === '.') return cwd;
    if (path.startsWith('~')) return path.replace('~', '/user/home');
    return `${cwd}/${path}`.replace(/\/+/g, '/');
  }

  getCommandsList() { return Object.keys(this.commands); }
}
