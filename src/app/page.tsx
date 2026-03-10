'use client';

import dynamic from 'next/dynamic';

const SharkOSApp = dynamic(
  () => import('@/shark-os/SharkOSApp'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-blue-500 font-mono text-lg tracking-[0.5em] animate-pulse">
          SHARK_OS...
        </div>
      </div>
    )
  }
);

export default function Home() {
  return <SharkOSApp />;
}
