import React, { useEffect, useState, useRef } from 'react';

interface BiosProps {
  onComplete: () => void;
}

export const BiosScreen: React.FC<BiosProps> = ({ onComplete }) => {
  const [memory, setMemory] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [showLogo, setShowLogo] = useState(false);
  const totalMemory = 4194304; // 4GB in KB

  useEffect(() => {
    // 1. Init Sequence
    setTimeout(() => setShowLogo(true), 100);
    
    // 2. Add Header Info
    const addLine = (text: string, delay: number) => {
        setTimeout(() => setLines(prev => [...prev, text]), delay);
    };

    addLine("AMIBIOS(C) 2025 American Megatrends, Inc.", 200);
    addLine("Shark OS Mobile Workstation BIOS v4.0", 400);
    addLine("CPU : WebAssembly Virtual Core @ 4.00GHz", 600);
    addLine("Speed : 4000 MHz", 700);
    
    // 3. Memory Check Animation
    let mem = 0;
    const memInterval = setInterval(() => {
        mem += 65536; // Increment by 64MB chunks
        if (mem >= totalMemory) {
            mem = totalMemory;
            clearInterval(memInterval);
            setMemory(mem);
            
            // 4. Run Power Check (Battery) before Hardware
            checkPowerSystem();
        } else {
            setMemory(mem);
        }
    }, 30); // Fast count

    const checkPowerSystem = async () => {
        let powerMsg = "Power Management : AC Interface (No Battery)";
        
        // Try to get real battery status
        if ('getBattery' in navigator) {
            try {
                const battery: any = await (navigator as any).getBattery();
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? "Charging" : "Discharging";
                powerMsg = `Power Management : Battery Detected [${level}% ${charging}]`;
            } catch (e) {
                powerMsg = "Power Management : Driver Error";
            }
        }

        setLines(prev => [...prev, "", "Memory Test : " + totalMemory + "K OK", powerMsg]);
        
        // Continue to hardware detection
        setTimeout(runHardwareDetection, 800);
    };

    const runHardwareDetection = () => {
        let delay = 0;
        const push = (t: string) => { delay += 400; addLine(t, delay); };

        push("");
        push("Detecting Primary Master ... SharkFS System Drive (IDB)");
        push("Detecting Primary Slave  ... Deep Vault (OPFS)");
        push("Detecting USB Device     ... None");
        push("");
        push("System Initialized.");
        push("Booting Shark Kernel...");

        setTimeout(onComplete, delay + 1500);
    };

    return () => clearInterval(memInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black text-[#a8a8a8] font-mono p-8 z-[10000] cursor-none select-none text-sm md:text-base leading-tight flex flex-col justify-between">
      <div>
        {showLogo && (
            <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                   {lines.map((line, i) => (
                       <div key={i} className="whitespace-pre-wrap">{line}</div>
                   ))}
                   {lines.length < 5 && (
                       <div className="mt-2">Memory Test : {memory}K</div>
                   )}
                </div>
                
                {/* Retro Energy Star Logo Simulation */}
                <div className="hidden md:block border-4 border-[#a8a8a8] p-2 w-32 h-32 relative">
                    <div className="absolute top-2 right-2 text-[10px] font-bold">energy</div>
                    <div className="w-16 h-16 bg-[#a8a8a8] rounded-full absolute top-8 left-4 mix-blend-difference"></div>
                    <div className="w-12 h-2 bg-black rotate-45 absolute top-12 left-4"></div>
                </div>
            </div>
        )}
      </div>

      <div className="w-full border-t-2 border-[#a8a8a8] pt-2 flex justify-between text-xs md:text-sm">
          <span>Press DEL to enter Setup</span>
          <span>SHARK-OS-VER-4.0-REL</span>
      </div>
    </div>
  );
};