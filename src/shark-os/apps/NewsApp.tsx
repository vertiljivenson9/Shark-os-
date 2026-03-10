import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { kernel } from '../services/kernel';

interface Story {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
}

export const NewsApp: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setStories([]);
    setProgress(0);

    try {
      // 1. Get Top Story IDs
      const idsRaw = await kernel.net.request('https://hacker-news.firebaseio.com/v0/topstories.json');
      const ids = JSON.parse(idsRaw).slice(0, 25); // Get top 25
      
      const fetchedStories: Story[] = [];
      const batchSize = 5;

      // 2. Fetch in batches to avoid choking the Network Stack
      for (let i = 0; i < ids.length; i += batchSize) {
          const chunk = ids.slice(i, i + batchSize);
          
          const chunkPromises = chunk.map(async (id: number) => {
              try {
                  const itemRaw = await kernel.net.request(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                  return JSON.parse(itemRaw);
              } catch (e) {
                  console.warn(`Failed to fetch story ${id}`, e);
                  return null;
              }
          });

          const chunkResults = await Promise.all(chunkPromises);
          const validStories = chunkResults.filter(s => s && !s.deleted && !s.dead);
          
          fetchedStories.push(...validStories);
          setStories([...fetchedStories]); // Incremental update
          setProgress(Math.min(100, Math.round(((i + batchSize) / ids.length) * 100)));
      }

    } catch (e: any) {
      setError(`Connection Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openStory = (url: string) => {
    if (url) {
        kernel.launchApp('search', { args: url });
    } else {
        alert("This story has no URL (it might be a text post).");
    }
  };

  return (
    <div className="h-full bg-white text-gray-800 flex flex-col font-sans">
      <div className="bg-[#ff6600] p-4 flex items-center justify-between shadow-md z-10">
         <h1 className="text-white font-bold text-lg flex items-center gap-2">
             <span className="border-2 border-white px-1 text-sm">Y</span> Hacker News
         </h1>
         <button onClick={fetchNews} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      {loading && progress < 100 && (
          <div className="h-1 w-full bg-orange-100">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
      )}

      <div className="flex-1 overflow-y-auto">
         {error && (
             <div className="p-8 text-center text-red-600 bg-red-50 m-4 rounded-xl border border-red-100">
                 <AlertCircle className="mx-auto mb-2" size={32} />
                 <p className="font-bold">{error}</p>
                 <button onClick={fetchNews} className="mt-4 px-4 py-2 bg-white border border-red-200 rounded shadow-sm hover:bg-gray-50 text-sm">Retry Connection</button>
             </div>
         )}
         
         {loading && stories.length === 0 && (
             <div className="p-8 space-y-6 opacity-50">
                 {[1,2,3,4,5].map(i => (
                     <div key={i} className="animate-pulse flex gap-4">
                         <div className="w-8 h-8 bg-gray-300 rounded"></div>
                         <div className="flex-1">
                             <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                             <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                         </div>
                     </div>
                 ))}
             </div>
         )}

         <div className="divide-y divide-gray-100">
             {stories.map((story, i) => (
                 <div key={story.id} className="p-4 hover:bg-orange-50 transition-colors flex gap-4 group cursor-pointer" onClick={() => openStory(story.url)}>
                     <div className="text-gray-300 font-mono text-lg font-bold w-6 text-right pt-0.5">{i + 1}</div>
                     <div className="flex-1">
                         <h3 className="font-medium text-gray-900 leading-tight mb-1 group-hover:text-[#ff6600] transition-colors line-clamp-2">{story.title}</h3>
                         <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                             <span className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded"><ArrowUpCircle size={12}/> {story.score}</span>
                             <span>by <span className="font-medium text-gray-700">{story.by}</span></span>
                             <span>• {new Date(story.time * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             <span className="text-gray-300">|</span>
                             <span className="truncate max-w-[150px]">{story.url ? new URL(story.url).hostname.replace('www.', '') : 'text-post'}</span>
                         </div>
                     </div>
                     <button className="text-gray-300 hover:text-blue-500 self-start mt-1">
                         <ExternalLink size={18} />
                     </button>
                 </div>
             ))}
         </div>
      </div>
      
      <div className="bg-gray-50 border-t p-2 text-center text-[10px] text-gray-400 flex justify-between px-4">
          <span>API: firebaseio.com</span>
          <span>{stories.length} Stories Loaded</span>
      </div>
    </div>
  );
};