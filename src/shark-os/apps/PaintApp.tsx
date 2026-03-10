
import React, { useRef, useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Save, Trash2, Palette, Eraser } from 'lucide-react';

const COLORS = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff'];

export const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
    }
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d')!;
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = size;
    ctx.stroke();
  };

  const save = async () => {
    const dataUrl = canvasRef.current?.toDataURL('image/png')!;
    const path = `/user/home/photos/PAINT_${Date.now()}.png`;
    await kernel.fs.write(path, dataUrl);
    kernel.notifications.push('Shark Paint', 'Dibujo guardado en fotos.');
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="h-14 bg-white border-b flex items-center justify-between px-4 z-10">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setTool('brush')} className={`p-2 rounded ${tool === 'brush' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Palette size={18}/></button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Eraser size={18}/></button>
        </div>
        <div className="flex gap-1">
          {COLORS.map(c => <button key={c} onClick={() => { setColor(c); setTool('brush'); }} className={`w-6 h-6 rounded-full border ${color === c && tool === 'brush' ? 'ring-2 ring-blue-500' : ''}`} style={{ background: c }} />)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const ctx = canvasRef.current?.getContext('2d')!; ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvasRef.current!.width,canvasRef.current!.height); }} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={20}/></button>
          <button onClick={save} className="p-2 bg-blue-600 text-white rounded-lg"><Save size={20}/></button>
        </div>
      </div>
      <canvas ref={canvasRef} onMouseDown={(e) => { setIsDrawing(true); const p=getPos(e); const ctx=canvasRef.current?.getContext('2d')!; ctx.beginPath(); ctx.moveTo(p.x, p.y); }} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={(e) => { setIsDrawing(true); const p=getPos(e); const ctx=canvasRef.current?.getContext('2d')!; ctx.beginPath(); ctx.moveTo(p.x, p.y); }} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} className="flex-1 bg-white cursor-crosshair touch-none" />
    </div>
  );
};
