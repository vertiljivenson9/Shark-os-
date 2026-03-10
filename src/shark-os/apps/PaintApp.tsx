'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { kernel } from '../services/kernel';
import { soundSystem } from '../services/media/SoundSystem';
import { toast } from '../components/Toast';
import { 
  Paintbrush, Eraser, Square, Circle, Minus, Type, 
  Move, Undo, Redo, Save, Trash2, Download, Palette,
  Paintbrush2, PenTool, Highlighter, SprayCan
} from 'lucide-react';

type Tool = 'brush' | 'pen' | 'eraser' | 'spray' | 'line' | 'rect' | 'circle' | 'fill' | 'text';

interface BrushSettings {
  size: number;
  color: string;
  opacity: number;
}

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#FF6B00', '#FFFF00', '#00FF00',
  '#00FFFF', '#0066FF', '#9900FF', '#FF00FF', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

const PRESETS = [
  { name: 'Pincel', tool: 'brush', size: 8 },
  { name: 'Pluma', tool: 'pen', size: 2 },
  { name: 'Marcador', tool: 'brush', size: 20, opacity: 0.5 },
  { name: 'Spray', tool: 'spray', size: 30 },
  { name: 'Borrador', tool: 'eraser', size: 20 },
];

export const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('brush');
  const [brush, setBrush] = useState<BrushSettings>({ size: 8, color: '#00FF00', opacity: 1 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [tempCanvas, setTempCanvas] = useState<string | null>(null);

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    
    // Save initial state
    saveToHistory();
  }, []);

  // Guardar en historial
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), dataUrl]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Deshacer
  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    loadFromHistory(history[newIndex]);
    soundSystem.play('click');
  };

  // Rehacer
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    loadFromHistory(history[newIndex]);
    soundSystem.play('click');
  };

  const loadFromHistory = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  // Obtener posición del mouse/touch
  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Iniciar dibujo
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    setLastPos(pos);
    
    if (['line', 'rect', 'circle'].includes(tool)) {
      setShapeStart(pos);
      setTempCanvas(canvasRef.current?.toDataURL() || null);
    } else if (tool === 'fill') {
      floodFill(Math.floor(pos.x), Math.floor(pos.y));
      saveToHistory();
    }
    
    soundSystem.play('click');
  };

  // Dibujar
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    
    const pos = getPos(e);

    if (tool === 'brush' || tool === 'pen') {
      ctx.globalAlpha = brush.opacity;
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = tool === 'pen' ? Math.min(brush.size, 3) : brush.size;
      ctx.beginPath();
      if (lastPos) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
      }
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brush.size;
      ctx.beginPath();
      if (lastPos) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
      }
      ctx.stroke();
    } else if (tool === 'spray') {
      ctx.globalAlpha = brush.opacity * 0.3;
      ctx.fillStyle = brush.color;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * brush.size;
        const x = pos.x + Math.cos(angle) * radius;
        const y = pos.y + Math.sin(angle) * radius;
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (['line', 'rect', 'circle'].includes(tool) && shapeStart && tempCanvas) {
      // Restaurar canvas temporal
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        ctx.globalAlpha = brush.opacity;
        ctx.strokeStyle = brush.color;
        ctx.lineWidth = brush.size;
        
        if (tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(shapeStart.x, shapeStart.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        } else if (tool === 'rect') {
          ctx.strokeRect(
            Math.min(shapeStart.x, pos.x),
            Math.min(shapeStart.y, pos.y),
            Math.abs(pos.x - shapeStart.x),
            Math.abs(pos.y - shapeStart.y)
          );
        } else if (tool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(pos.x - shapeStart.x, 2) + Math.pow(pos.y - shapeStart.y, 2)
          );
          ctx.beginPath();
          ctx.arc(shapeStart.x, shapeStart.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      };
      img.src = tempCanvas;
    }

    setLastPos(pos);
  };

  // Terminar dibujo
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      setShapeStart(null);
      setTempCanvas(null);
      saveToHistory();
    }
  };

  // Flood fill
  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const targetColor = getPixelColor(data, startX, startY, canvas.width);
    const fillColor = hexToRgb(brush.color);
    if (!fillColor) return;
    
    if (targetColor[0] === fillColor.r && targetColor[1] === fillColor.g && targetColor[2] === fillColor.b) return;
    
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    
    while (stack.length > 0 && stack.length < 100000) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      
      const currentColor = getPixelColor(data, x, y, canvas.width);
      if (!colorsMatch(currentColor, targetColor, 30)) continue;
      
      visited.add(key);
      setPixelColor(data, x, y, canvas.width, fillColor);
      
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number): [number, number, number, number] => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number, color: { r: number; g: number; b: number }) => {
    const i = (y * width + x) * 4;
    data[i] = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = 255;
  };

  const colorsMatch = (a: number[], b: number[], tolerance: number): boolean => {
    return Math.abs(a[0] - b[0]) <= tolerance &&
           Math.abs(a[1] - b[1]) <= tolerance &&
           Math.abs(a[2] - b[2]) <= tolerance;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Limpiar canvas
  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    soundSystem.play('trash');
    toast.info('Canvas limpiado');
  };

  // Guardar imagen
  const saveImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `painting_${Date.now()}.png`;
    const path = `/user/home/pictures/${filename}`;
    
    await kernel.fs.mkdir('/user/home/pictures').catch(() => {});
    await kernel.fs.write(path, dataUrl);
    
    soundSystem.play('success');
    toast.success('Guardado', `Imagen guardada en ${path}`);
  };

  // Descargar imagen
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `shark_paint_${Date.now()}.png`;
    a.click();
    
    soundSystem.play('download');
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'brush', icon: <Paintbrush size={18} />, label: 'Pincel' },
    { id: 'pen', icon: <PenTool size={18} />, label: 'Pluma' },
    { id: 'eraser', icon: <Eraser size={18} />, label: 'Borrador' },
    { id: 'spray', icon: <SprayCan size={18} />, label: 'Spray' },
    { id: 'line', icon: <Minus size={18} />, label: 'Línea' },
    { id: 'rect', icon: <Square size={18} />, label: 'Rectángulo' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Círculo' },
    { id: 'fill', icon: <Palette size={18} />, label: 'Rellenar' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-2 gap-1 overflow-x-auto no-scrollbar">
        {/* Tools */}
        <div className="flex gap-1 border-r border-gray-700 pr-2 mr-2">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => { setTool(t.id); soundSystem.play('click'); }}
              className={`p-2 rounded transition-all ${
                tool === t.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
        
        {/* Size */}
        <div className="flex items-center gap-2 border-r border-gray-700 pr-2 mr-2">
          <span className="text-[10px] text-gray-500">Size:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={brush.size}
            onChange={e => setBrush(prev => ({ ...prev, size: Number(e.target.value) }))}
            className="w-16 accent-blue-500"
          />
          <span className="text-xs text-gray-400 w-6">{brush.size}</span>
        </div>
        
        {/* Opacity */}
        <div className="flex items-center gap-2 border-r border-gray-700 pr-2 mr-2">
          <span className="text-[10px] text-gray-500">Op:</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={brush.opacity}
            onChange={e => setBrush(prev => ({ ...prev, opacity: Number(e.target.value) }))}
            className="w-16 accent-blue-500"
          />
        </div>
        
        {/* Colors */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
          {COLORS.slice(0, 8).map(color => (
            <button
              key={color}
              onClick={() => setBrush(prev => ({ ...prev, color }))}
              className={`w-5 h-5 rounded border-2 transition-all ${
                brush.color === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={brush.color}
            onChange={e => setBrush(prev => ({ ...prev, color: e.target.value }))}
            className="w-5 h-5 rounded cursor-pointer"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            title="Deshacer"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            title="Rehacer"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 text-gray-400 hover:text-red-400 transition-all"
            title="Limpiar"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={saveImage}
            className="p-2 text-gray-400 hover:text-green-400 transition-all"
            title="Guardar"
          >
            <Save size={18} />
          </button>
          <button
            onClick={downloadImage}
            className="p-2 text-gray-400 hover:text-blue-400 transition-all"
            title="Descargar"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-700">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      {/* Status bar */}
      <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center px-3 text-[10px] text-gray-500 justify-between">
        <span>Herramienta: {tools.find(t => t.id === tool)?.label}</span>
        <span>Historial: {historyIndex + 1}/{history.length}</span>
      </div>
    </div>
  );
};
