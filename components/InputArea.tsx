/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { PaperClipIcon, SparklesIcon, XMarkIcon, GlobeAltIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface InputAreaProps {
  onGenerate: (url: string, instructions: string, files: File[]) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const SuggestionChip = ({ text, onClick }: { text: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="px-3 py-1.5 text-xs text-zinc-400 bg-zinc-800/50 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700 rounded-full transition-colors text-left flex items-center space-x-2"
    >
        <GlobeAltIcon className="w-3 h-3" />
        <span>{text}</span>
    </button>
);

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [url, setUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [instructions]);

  // Handle Paste Event to capture images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled || isGenerating) return;
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const newFiles = Array.from(e.clipboardData.files).filter((file: File) => file.type.startsWith('image/'));
        if (newFiles.length > 0) {
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, isGenerating]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset value so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
        setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  }, [disabled, isGenerating]);

  const removeFile = (index: number) => {
      setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
      if (!url.trim() && !instructions.trim() && attachedFiles.length === 0) return;
      onGenerate(url, instructions, attachedFiles);
      setInstructions("");
      // Keep URL maybe? No, clear it for fresh start usually.
      // setUrl(""); 
      // setAttachedFiles([]);
      // Actually, let's clear them to indicate success.
      setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };

  const fillExample = (exampleUrl: string, examplePrompt: string) => {
      setUrl(exampleUrl);
      setInstructions(examplePrompt);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative z-20">
      
      <div 
        className={`
            relative flex flex-col gap-1
            bg-zinc-900/80 backdrop-blur-xl
            rounded-2xl border transition-all duration-300
            ${isDragging ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-zinc-700 shadow-2xl'}
            ${isGenerating ? 'opacity-50 pointer-events-none' : ''}
            p-2
        `}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        
        {/* URL Input Row */}
        <div className="flex items-center space-x-2 bg-zinc-950/50 rounded-xl px-3 py-2 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
            <GlobeAltIcon className="w-5 h-5 text-zinc-500" />
            <input 
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm focus:outline-none font-mono"
            />
        </div>

        {/* Text Input Area */}
        <div className="relative px-3 py-2">
            <textarea
                ref={textareaRef}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the demo flow, animations, and paste any extra details here..."
                className="w-full bg-transparent text-white placeholder-zinc-500 text-base focus:outline-none resize-none min-h-[80px]"
                rows={2}
                disabled={isGenerating}
            />
        </div>

        {/* Attached Files Preview Grid */}
        {attachedFiles.length > 0 && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {attachedFiles.map((file, index) => (
                    <div key={index} className="relative group shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                            <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        <button 
                            onClick={() => removeFile(index)}
                            className="absolute -top-1.5 -right-1.5 bg-zinc-900 rounded-full text-zinc-400 hover:text-white border border-zinc-700 p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Toolbar */}
        <div className="px-3 pb-2 pt-1 flex items-center justify-between border-t border-white/5 mt-1">
            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group flex items-center gap-2"
                    title="Attach images (or paste from clipboard)"
                >
                    <PhotoIcon className="w-5 h-5" />
                    <span className="text-xs font-medium hidden group-hover:inline transition-all">Add Images</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={(!url.trim() && !instructions.trim() && attachedFiles.length === 0) || isGenerating}
                className={`
                    flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                    ${(!url.trim() && !instructions.trim() && attachedFiles.length === 0) 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40'
                    }
                `}
            >
                {isGenerating ? (
                    <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         <span>Generating...</span>
                    </div>
                ) : (
                    <>
                        <SparklesIcon className="w-4 h-4" />
                        <span>Generate Demo</span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Drag Overlay */}
      {isDragging && (
          <div className="absolute inset-0 m-4 rounded-xl border-2 border-dashed border-purple-500 bg-zinc-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-purple-400 pointer-events-none">
              <PhotoIcon className="w-10 h-10 mb-2" />
              <span className="font-medium">Drop images to include in demo</span>
          </div>
      )}

      {/* Suggestions */}
      {!isGenerating && !url && !instructions && attachedFiles.length === 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
            <SuggestionChip 
                text="Linear.app" 
                onClick={() => fillExample("https://linear.app", "Show the user creating a new issue, assigning it to 'Me', and then marking it as 'In Progress'.")} 
            />
            <SuggestionChip 
                text="Stripe.com" 
                onClick={() => fillExample("https://stripe.com", "Demo the payments dashboard. Scroll down to show the revenue chart, hover over the bars to show tooltips, and click 'Export'.")} 
            />
            <SuggestionChip 
                text="Airbnb.com" 
                onClick={() => fillExample("https://airbnb.com", "Search for 'Kyoto', scroll through the listing results, and click on a 'Traditional Machiya' listing.")} 
            />
        </div>
      )}

    </div>
  );
};