/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { VideoCameraIcon, GlobeAltIcon, CursorArrowRaysIcon, SparklesIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { ComputerDesktopIcon, FilmIcon, PresentationChartLineIcon } from '@heroicons/react/24/solid';

// Component that simulates drawing a wireframe then filling it with life
const DrawingTransformation = ({ 
  initialIcon: InitialIcon, 
  finalIcon: FinalIcon, 
  label,
  delay, 
  x, 
  y,
  rotation = 0
}: { 
  initialIcon: React.ElementType, 
  finalIcon: React.ElementType, 
  label: string,
  delay: number,
  x: string,
  y: string,
  rotation?: number
}) => {
  const [stage, setStage] = useState(0); // 0: Hidden, 1: Drawing, 2: Alive

  useEffect(() => {
    const cycle = () => {
      setStage(0);
      setTimeout(() => setStage(1), 500); // Start drawing
      setTimeout(() => setStage(2), 3500); // Come alive
    };

    // Initial delay
    const startTimeout = setTimeout(() => {
      cycle();
      // Repeat cycle
      const interval = setInterval(cycle, 9000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  return (
    <div 
      className="absolute transition-all duration-1000 ease-in-out z-0 pointer-events-none"
      style={{ top: y, left: x, transform: `rotate(${rotation}deg)` }}
    >
      <div className={`relative w-48 h-32 md:w-64 md:h-40 rounded-lg backdrop-blur-md transition-all duration-1000 ${stage === 2 ? 'bg-zinc-800/40 border-zinc-500/50 shadow-2xl scale-110 -translate-y-4' : 'bg-zinc-900/10 border-zinc-800 scale-100 border border-dashed'}`}>
        
        {/* Label tag that appears in stage 2 */}
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white border border-purple-400 text-[8px] md:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-500 ${stage === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {label}
        </div>

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden rounded-lg">
          
          {/* Stage 1: Wireframe / URL */}
          <div className={`absolute transition-all duration-1000 flex flex-col items-center ${stage === 1 ? 'opacity-100' : 'opacity-0'}`}>
             <InitialIcon className="w-8 h-8 md:w-10 md:h-10 text-zinc-600 stroke-1 mb-2" />
             <div className="w-32 h-2 bg-zinc-700/50 rounded animate-pulse"></div>
             <div className="mt-2 w-20 h-2 bg-zinc-700/50 rounded animate-pulse delay-75"></div>
          </div>

          {/* Stage 2: Alive/Video */}
          <div className={`absolute inset-0 transition-all duration-700 flex flex-col bg-zinc-900 rounded-md overflow-hidden ${stage === 2 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-sm'}`}>
             {/* Mock Browser Header */}
             <div className="h-6 w-full bg-zinc-800 flex items-center px-3 space-x-1.5 border-b border-white/5">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 mx-2 h-3 bg-zinc-700/50 rounded-md"></div>
             </div>
             
             {/* Mock Video Content */}
             <div className="flex-1 relative w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center group">
                 <FinalIcon className="w-10 h-10 text-purple-500/50" />
                 
                 {/* Presenter Bubble (Loom Style) */}
                 <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 border-2 border-white/20 shadow-lg"></div>

                 {/* Cursor Animation */}
                 <CursorArrowRaysIcon className="absolute top-1/2 left-1/2 w-6 h-6 text-white drop-shadow-lg -translate-x-4 translate-y-4" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  return (
    <>
      {/* Background Transformation Elements - Fixed to Viewport */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top Left: URL -> SaaS Demo */}
        <div className="hidden lg:block">
            <DrawingTransformation 
            initialIcon={GlobeAltIcon} 
            finalIcon={ComputerDesktopIcon} 
            label="BROWSER DEMO"
            delay={0} 
            x="5%" 
            y="15%"
            rotation={-2} 
            />
        </div>

        {/* Bottom Right: Sketch -> App Promo */}
        <div className="hidden md:block">
            <DrawingTransformation 
            initialIcon={VideoCameraIcon} 
            finalIcon={FilmIcon} 
            label="SCREENCAST"
            delay={3000} 
            x="75%" 
            y="60%"
            rotation={2} 
            />
        </div>
      </div>

      {/* Hero Text Content */}
      <div className="text-center relative z-10 max-w-5xl mx-auto px-4 pt-4 md:pt-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6 animate-fade-in-up">
            <VideoCameraIcon className="w-3.5 h-3.5" />
            <span>AI Screencast Generator</span>
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
          Product Demos <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Reimagined</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
          Turn screenshots and URLs into <span className="text-white font-medium">Loom-style video demos</span>. <br/>
          Includes cursor movement, scrolling, and AI narration.
        </p>
      </div>
    </>
  );
};