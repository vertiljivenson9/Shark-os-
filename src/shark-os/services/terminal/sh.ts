import { ShellCommand } from '../../types';
import { kernel } from '../kernel';

type CommandHandler = (args: string[], env: Record<string, string>, ctx: ShellContext) => Promise<string>;

interface ShellContext {
  cwd: string;
  setCwd: (path: string) => void;
  print: (text: string) => void;
}

const MANUALS: Record<string, string> = {
    ls: 'ls - List directory contents\nUsage: ls [path] [-la]\n\nOptions:\n  -la    List all files with details',
    cd: 'cd - Change the shell working directory\nUsage: cd <path>',
    pwd: 'pwd - Print name of current/working directory',
    cat: 'cat - Concatenate files and print on the standard output\nUsage: cat <file>',
    cp: 'cp - Copy files and directories\nUsage: cp <source> <dest>',
    mv: 'mv - Move (rename) files\nUsage: mv <source> <dest>',
    rm: 'rm - Remove files or directories\nUsage: rm <path>',
    mkdir: 'mkdir - Create the DIRECTORY(ies), if they do not already exist.',
    touch: 'touch - Update the access and modification times of each FILE to the current time.',
    grep: 'grep - Print lines that match patterns\nUsage: grep <pattern> [file]\n\nExample:\n  cat file.txt | grep "hello"',
    head: 'head - Output the first part of files\nUsage: head [-n lines] [file]',
    tail: 'tail - Output the last part of files\nUsage: tail [-n lines] [file]',
    echo: 'echo - Display a line of text',
    clear: 'clear - Clear the terminal screen',
    open: 'open - Open a system application\nUsage: open <app_name>',
    man: 'man - Format and display the on-line manual pages\nUsage: man <command>',
    uname: 'uname - Print system information',
    uptime: 'uptime - Tell how long the system has been running',
    neofetch: 'neofetch - A command-line system information tool',
    matrix: 'matrix - Enter the matrix simulation',
    curl: 'curl - Transfer a URL\nUsage: curl <url>',
};

export class Shell {
  private env: Record<string, string> = {
    'HOME': '/user/home',
    'USER': 'root',
    'PATH': '/system/bin',
    'SHELL': '/system/bin/bash',
    'TERM': 'xterm-256color',
    'EDITOR': 'editor'
  };

  private history: string[] = [];
  
  constructor() {}

  // --- Parser ---
  parse(input: string): ShellCommand {
    const rawTokens = this.tokenize(input);
    const argv: string[] = [];
    let redirect: string | null = null;
    const localEnv: Record<string, string> = { ...this.env };

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (token === '>') {
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
    
    // Pipe splitting
    const segments = cmdStr.split('|');
    let previousOutput = '';

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i].trim();
        const { argv, redirect, env } = this.parse(segment);
        
        if (argv.length === 0) continue;

        // If piped, the previous output acts as an implicit input
        // Commands need to handle this. We'll pass it as a special property in context
        // OR append it to args if the command expects stdin as last arg. 
        // For simplicity in this shell: We append it as the LAST argument.
        if (previousOutput && i > 0) {
           argv.push(previousOutput); 
        }

        const cmd = argv[0];
        const args = argv.slice(1);
        const ctx: ShellContext = { cwd: getCwd(), setCwd, print };
        
        // Merge Env
        Object.assign(this.env, env);

        let output = '';
        
        try {
            if (this.commands[cmd]) {
                output = await this.commands[cmd](args, this.env, ctx);
            } else {
                // Try executing as script/binary
                const path = cmd.startsWith('/') ? cmd : `${ctx.cwd}/${cmd}`;
                if (await kernel.fs.exists(path)) {
                    output = await this.runScript(path);
                } else if (await kernel.fs.exists(`/system/bin/${cmd}`)) {
                     // Check system bin
                     output = await this.runScript(`/system/bin/${cmd}`);
                } else {
                    throw new Error(`${cmd}: command not found`);
                }
            }
        } catch (e: any) {
            output = `Error: ${e.message}`;
        }

        if (redirect) {
            const absPath = this.resolvePath(redirect, ctx.cwd);
            await kernel.fs.write(absPath, output);
            output = '';
        }

        previousOutput = output; // Keep raw for next pipe
        if (i === segments.length - 1 && output) {
            print(output); // Only print final result if not redirected
        }
    }
  }

  // --- Command Implementations ---
  
  private commands: Record<string, CommandHandler> = {
      // FILESYSTEM OPS
      ls: async (args, env, ctx) => {
          // If the last arg is the piped input (contains newlines), ignore it for ls usually, 
          // unless ls is weird. We assume ls doesn't take stdin.
          const cleanArgs = args.filter(a => !a.includes('\n')); 
          const target = cleanArgs.find(a => !a.startsWith('-')) || ctx.cwd;
          const path = this.resolvePath(target, ctx.cwd);
          
          try {
             const files = await kernel.fs.ls(path);
             if (args.includes('-la') || args.includes('-l')) {
                 const formatted = files.map(f => {
                     const isDir = f.endsWith('/');
                     const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                     const size = isDir ? 4096 : Math.floor(Math.random() * 10000);
                     const date = new Date().toLocaleDateString();
                     return `${perm} root root ${size.toString().padStart(6)} ${date} ${f}`;
                 });
                 return `total ${files.length}\n` + formatted.join('\n');
             }
             return files.join('  ');
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
          if (!args[0]) throw new Error('mkdir: missing operand');
          await kernel.fs.mkdir(this.resolvePath(args[0], ctx.cwd));
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
          const target = args.filter(a => !a.startsWith('-') && !a.includes('\n'))[0];
          if (!target) throw new Error('rm: missing operand');
          await kernel.fs.rm(this.resolvePath(target, ctx.cwd));
          return '';
      },
      cp: async (args, env, ctx) => {
          if (args.length < 2) throw new Error('cp: missing file operand');
          const src = this.resolvePath(args[0], ctx.cwd);
          const dest = this.resolvePath(args[1], ctx.cwd);
          const content = await kernel.fs.cat(src);
          await kernel.fs.write(dest, content);
          return '';
      },
      mv: async (args, env, ctx) => {
          if (args.length < 2) throw new Error('mv: missing file operand');
          const src = this.resolvePath(args[0], ctx.cwd);
          const dest = this.resolvePath(args[1], ctx.cwd);
          const content = await kernel.fs.cat(src);
          await kernel.fs.write(dest, content);
          await kernel.fs.rm(src);
          return '';
      },
      cat: async (args, env, ctx) => {
          if (args.length === 0) return ''; // Interactive cat not supported
          // Handle piped input if any? usually cat with no args echoes stdin. 
          // But here if piped, args[0] might be the content.
          // Let's check filesystem first.
          try {
             const path = this.resolvePath(args[0], ctx.cwd);
             return await kernel.fs.cat(path);
          } catch {
             // If not file, return arg as is (echo)
             return args[0];
          }
      },

      // TEXT PROCESSING
      grep: async (args, env, ctx) => {
          if (args.length === 0) throw new Error('grep: usage: grep [pattern] [file]');
          const pattern = args[0];
          let content = '';
          
          // Check if explicit file provided as arg 1
          if (args[1] && !args[1].includes('\n')) {
              try {
                  const path = this.resolvePath(args[1], ctx.cwd);
                  content = await kernel.fs.cat(path);
              } catch {
                  // If second arg isn't a file, maybe it's the piped text?
                  content = args[1]; 
              }
          } else if (args[1]) {
              // Arg 1 is likely piped text
              content = args[1];
          }

          if (!content) return '';
          
          const regex = new RegExp(pattern, 'g');
          return content.split('\n').filter(line => line.match(regex)).join('\n');
      },
      head: async (args, env, ctx) => {
          const nIndex = args.indexOf('-n');
          let count = 10;
          if (nIndex !== -1 && args[nIndex + 1]) {
              count = parseInt(args[nIndex + 1]);
          }
          
          // Find content/file arg
          const target = args.find((a, i) => !a.startsWith('-') && i !== nIndex + 1);
          let content = target || '';
          
          // Try reading file
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
          const target = args[0];
          let content = target || '';
          if (target && !target.includes('\n')) {
             try { content = await kernel.fs.cat(this.resolvePath(target, ctx.cwd)); } catch {}
          }
          const lines = content.split('\n').length;
          const words = content.split(/\s+/).length;
          const chars = content.length;
          return `${lines} ${words} ${chars}`;
      },

      // SYSTEM
      uname: async () => 'Linux webos 5.10.0-webos-wasm #1 SMP PREEMPT Fri Jan 1 00:00:00 UTC 2024 x86_64 GNU/Linux',
      uptime: async () => {
          const uptimeMs = Date.now() - kernel.bootTime;
          const mins = Math.floor(uptimeMs / 60000);
          return ` up ${mins} min, 1 user, load average: 0.00, 0.01, 0.05`;
      },
      whoami: async (args, env) => env.USER,
      hostname: async () => (await kernel.registry.get('system.network.hostname')) || 'webos-mobile',
      date: async () => new Date().toString(),
      clear: async () => '',
      echo: async (args) => args.join(' '),
      history: async () => this.history.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n'),
      
      open: async (args, env, ctx) => {
          const appName = args[0];
          if (!appName) return 'Usage: open <app_name>';
          kernel.launchApp(appName.toLowerCase());
          return `Launching ${appName}...`;
      },
      
      // NETWORK
      curl: async (args, env, ctx) => {
          const url = args.find(a => a.startsWith('http'));
          if (!url) return 'curl: try \'curl --help\' for more information';
          ctx.print(`curl: (1) Connecting to ${url}...`);
          try {
             return await kernel.net.request(url);
          } catch(e: any) {
             throw new Error(`curl: (6) Could not resolve host: ${e.message}`);
          }
      },

      // HELP
      man: async (args) => {
          const cmd = args[0];
          if (!cmd) return 'What manual page do you want?';
          if (MANUALS[cmd]) return MANUALS[cmd];
          return `No manual entry for ${cmd}`;
      },
      help: async () => {
          const cmds = Object.keys(this.commands).sort();
          return `
GNU bash, version 5.0.17(1)-release (wasm-webos)
These shell commands are defined internally.  Type 'man <command>' to see usage.

Available Commands:
${cmds.map(c => c.padEnd(12)).reduce((acc, c, i) => acc + c + ((i + 1) % 5 === 0 ? '\n' : ''), '')}

Other Utils:
neofetch    matrix      theme
`;
      },

      // FUN / MISC
      neofetch: async () => {
          return `
       .---.       root@webos-mobile
      /     \\      -----------------
      |  O  |      OS: WebOS Mobile v3.1
      \\     /      Kernel: 5.10.0-webos
       '---'       Uptime: ${Math.floor((Date.now() - kernel.bootTime)/60000)} mins
                   Shell: bash 5.0
                   CPU: WASM Virtual Core (1)
                   Memory: 512MB / 4GB
          `;
      },
      matrix: async () => "", 
      theme: async () => "", 
  };

  private async runScript(path: string): Promise<string> {
      try {
          const content = await kernel.fs.cat(path);
          if (content.startsWith('#!/bin/bash')) return ''; // stub
          // Basic JS eval for scripts in this env
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
    return `${cwd}/${path}`.replace(/\/+/g, '/');
  }

  getCommandsList() { return Object.keys(this.commands); }
}