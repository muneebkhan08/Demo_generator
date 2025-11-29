/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, ClipboardDocumentListIcon, CheckIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const LoadingStep = ({ text, active, completed }: { text: string, active: boolean, completed: boolean }) => (
    <div className={`flex items-center space-x-3 transition-all duration-500 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
        <div className={`w-4 h-4 flex items-center justify-center ${completed ? 'text-green-400' : active ? 'text-purple-400' : 'text-zinc-700'}`}>
            {completed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : active ? (
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
            ) : (
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
            )}
        </div>
        <span className={`font-mono text-xs tracking-wide uppercase ${active ? 'text-zinc-200' : completed ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>{text}</span>
    </div>
);

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showSplitView, setShowSplitView] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle loading animation steps
    useEffect(() => {
        if (isLoading) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
            }, 2000); 
            return () => clearInterval(interval);
        } else {
            setLoadingStep(0);
        }
    }, [isLoading]);

    // Default to Split View when a new creation with an image is loaded
    useEffect(() => {
        if (creation?.originalImage) {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [creation]);

    const handleDownloadHtml = () => {
        if (!creation) return;
        const blob = new Blob([creation.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyPrompt = () => {
        if (!creation) return;
        const match = creation.html.match(/<script id="design-prompt-data" type="text\/plain">([\s\S]*?)<\/script>/);
        let promptText = "";
        
        if (match && match[1]) {
            promptText = match[1].trim();
        } else {
            promptText = `Create a product demo video for ${creation.name}. Include cursor animations and voiceover script.`;
        }

        navigator.clipboard.writeText(promptText).then(() => {
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
        });
    };

    const handleRecordVideo = async () => {
        if (!creation) return;
        
        try {
            // Check if recording is supported
            if (!navigator.mediaDevices?.getDisplayMedia) {
                alert("Your browser does not support screen recording.");
                return;
            }

            alert("Please select 'This Tab' (or the current window) and ensure 'Share Audio' is checked to capture the voiceover.");

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: "browser" },
                audio: true
            });

            setIsRecording(true);

            // Create media recorder
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                setIsRecording(false);
                const blob = new Blob(chunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_demo.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Stop all tracks to release resource
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();

            // Refresh the iframe to start the animation from the beginning
            if (iframeRef.current) {
                iframeRef.current.srcDoc = iframeRef.current.srcDoc;
            }

        } catch (err) {
            console.error("Error starting recording:", err);
            setIsRecording(false);
        }
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-lg overflow-hidden border border-zinc-800 bg-[#0E0E10] shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-4 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Minimal Technical Header */}
      <div className="bg-[#121214] px-4 py-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        {/* Left: Controls */}
        <div className="flex items-center space-x-3 w-32">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close Preview"
                >
                  <XMarkIcon className="w-2 h-2 text-black opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
           </div>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
                {isLoading ? 'Generating Assets...' : creation ? creation.name : 'Studio Mode'}
            </span>
            {isRecording && (
                <span className="flex items-center space-x-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-[10px] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>RECORDING</span>
                </span>
            )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-2 w-auto">
            {!isLoading && creation && (
                <>
                    {creation.originalImage && (
                         <button 
                            onClick={() => setShowSplitView(!showSplitView)}
                            title={showSplitView ? "Show Video Only" : "Compare with Input"}
                            className={`p-1.5 rounded-md transition-all ${showSplitView ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}

                    <button 
                        onClick={handleCopyPrompt}
                        title="Copy Script Prompt"
                        className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all border ${copiedPrompt ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-zinc-800 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                    >
                        {copiedPrompt ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentListIcon className="w-4 h-4" />}
                        <span className="text-xs font-medium">{copiedPrompt ? 'Copied' : 'Script'}</span>
                    </button>

                    <button 
                        onClick={handleDownloadHtml}
                        title="Download Player (HTML)"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-md hover:bg-zinc-800 flex items-center space-x-2"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span className="text-xs font-medium hidden sm:inline">HTML</span>
                    </button>

                    <button 
                        onClick={handleRecordVideo}
                        disabled={isRecording}
                        title="Download Video (Record Screen)"
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'}`}
                    >
                        {isRecording ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <VideoCameraIcon className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium hidden sm:inline">{isRecording ? 'Recording...' : 'Download Video'}</span>
                    </button>

                    <button 
                        onClick={onReset}
                        title="New Project"
                        className="flex items-center space-x-1 text-xs font-bold bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-[#09090b] flex overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full">
             {/* Technical Loading State */}
             <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 mb-6 text-purple-500 animate-spin-slow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-zinc-100 font-mono text-lg tracking-tight">Rendering Product Demo</h3>
                    <p className="text-zinc-500 text-sm mt-2">Analyzing assets, animating cursor flows, and generating script...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 animate-[loading_4s_ease-in-out_infinite] w-1/3"></div>
                </div>

                 {/* Terminal Steps */}
                 <div className="border border-zinc-800 bg-black/50 rounded-lg p-4 space-y-3 font-mono text-sm">
                     <LoadingStep text="Analyzing website layout" active={loadingStep === 0} completed={loadingStep > 0} />
                     <LoadingStep text="Extracting assets & UI elements" active={loadingStep === 1} completed={loadingStep > 1} />
                     <LoadingStep text="Animating user interactions" active={loadingStep === 2} completed={loadingStep > 2} />
                     <LoadingStep text="Synthesizing visual effects" active={loadingStep === 3} completed={loadingStep > 3} />
                     <LoadingStep text="Finalizing demo reel" active={loadingStep === 4} completed={loadingStep > 4} />
                 </div>
             </div>
          </div>
        ) : creation?.html ? (
          <>
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation.originalImage && (
                <div className="w-full md:w-1/3 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0">
                    <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800">
                        Reference Input
                    </div>
                    <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                        {creation.originalImage.startsWith('data:application/pdf') ? (
                            <PdfRenderer dataUrl={creation.originalImage} />
                        ) : (
                            <img 
                                src={creation.originalImage} 
                                alt="Original Input" 
                                className="max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* App Preview Panel - Now optimized for Video Aspect Ratio */}
            <div className={`relative h-full bg-zinc-900/50 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-500 ${showSplitView && creation.originalImage ? 'w-full md:w-2/3 h-1/2 md:h-full' : 'w-full'}`}>
                 {/* 
                    The generated HTML contains a container that might be responsive. 
                    We render it in an iframe.
                 */}
                 <div className={`w-full h-full max-w-[1600px] max-h-[900px] shadow-2xl rounded-lg overflow-hidden border border-zinc-800 bg-black relative ${isRecording ? 'ring-2 ring-red-500' : ''}`}>
                     <iframe
                        ref={iframeRef}
                        title="Product Demo Preview"
                        srcDoc={creation.html}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                    />
                 </div>
                 
                 {/* Hint */}
                 <div className="mt-4 text-zinc-600 text-xs font-mono flex items-center space-x-4">
                    <span>Interactions are auto-played.</span>
                    {isRecording && (
                        <span className="text-red-400 animate-pulse font-bold">Stop sharing via browser controls to save video.</span>
                    )}
                 </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};