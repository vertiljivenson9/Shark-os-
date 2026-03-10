
import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Cloud, Sun, CloudRain, MapPin, RefreshCw, Loader } from 'lucide-react';

export const WeatherApp: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await kernel.net.request(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
        setData(JSON.parse(res));
      } catch (e) {
        setData({ current: { temperature_2m: 22, weather_code: 0 } });
      }
      setLoading(false);
    }, () => {
        setData({ current: { temperature_2m: 20, weather_code: 1 } });
        setLoading(false);
    });
  };

  useEffect(() => { fetchWeather(); }, []);

  if (loading) return <div className="h-full bg-blue-500 flex items-center justify-center text-white"><Loader size={32} className="animate-spin" /></div>;

  return (
    <div className="h-full bg-gradient-to-b from-blue-400 to-blue-600 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="flex items-center gap-2 opacity-80 mb-6"><MapPin size={16} /><span className="text-xs font-black uppercase tracking-widest">Ubicación Actual</span></div>
      {data?.current.weather_code === 0 ? <Sun size={120} className="mb-6" /> : <Cloud size={120} className="mb-6" />}
      <h1 className="text-8xl font-thin tracking-tighter mb-2">{Math.round(data?.current.temperature_2m || 0)}°</h1>
      <p className="text-xl font-medium mb-8">Cielos Despejados</p>
      <button onClick={fetchWeather} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"><RefreshCw size={20} /></button>
    </div>
  );
};
