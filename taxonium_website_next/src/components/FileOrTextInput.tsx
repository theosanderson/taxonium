"use client";

import React, { useRef, useEffect, useState } from 'react';

// Icons as components
const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const LinkIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

interface FileOrTextInputProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  fileAccept: string;
  fileLabel?: string;
  text: string;
  onTextChange: (text: string) => void;
  textPlaceholder?: string;
  textRows?: number;
  url?: string;
  onUrlChange?: (url: string) => void;
  urlPlaceholder?: string;
  mode: 'file' | 'text' | 'url';
  onModeChange: (mode: 'file' | 'text' | 'url') => void;
  showUrlOption?: boolean;
  showTextOption?: boolean;
}

export default function FileOrTextInput({
  file,
  onFileChange,
  fileAccept,
  fileLabel = "Upload file",
  text,
  onTextChange,
  textPlaceholder = "",
  textRows = 6,
  url = "",
  onUrlChange,
  urlPlaceholder = "https://example.com/file",
  mode,
  onModeChange,
  showUrlOption = true,
  showTextOption = true,
}: FileOrTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const prevModeRef = useRef(mode);
  const [urlDraft, setUrlDraft] = useState(url);

  useEffect(() => { setUrlDraft(url); }, [url]);

  useEffect(() => {
    if (mode === 'text' && prevModeRef.current !== 'text') textareaRef.current?.focus();
    if (mode === 'url' && prevModeRef.current !== 'url') urlInputRef.current?.focus();
    prevModeRef.current = mode;
  }, [mode]);

  const buttonClass = "px-3 py-1.5 rounded transition text-sm cursor-pointer bg-white border border-gray-400 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5";
  const linkClass = "text-sm text-gray-500 hover:text-gray-700 cursor-pointer";

  const clearAll = () => {
    onFileChange(null);
    onTextChange('');
    onUrlChange?.('');
    setUrlDraft('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      clearAll();
      onModeChange('file');
      onFileChange(selectedFile);
    }
  };

  const saveUrl = () => {
    if (urlDraft.trim() && onUrlChange) {
      onUrlChange(urlDraft.trim());
    }
  };

  // Reusable file input for "Upload file instead" links
  const FileUploadLink = ({ label = "Upload file instead" }: { label?: string }) => (
    <label className={linkClass}>
      {label}
      <input type="file" accept={fileAccept} onChange={handleFileSelect} className="hidden" />
    </label>
  );

  // Alternative options shown after content is entered
  const AlternativeOptions = ({ onClear, currentMode }: { onClear: () => void; currentMode: 'file' | 'text' | 'url' }) => (
    <div className="flex items-center gap-3 flex-wrap">
      <button onClick={() => { onClear(); onModeChange('file'); }} className={linkClass}>Clear</button>

      {currentMode !== 'file' && (
        <>
          <span className="text-gray-300">|</span>
          <FileUploadLink />
        </>
      )}

      {showTextOption && currentMode !== 'text' && (
        <>
          <span className="text-gray-300">|</span>
          <button onClick={() => { onClear(); onModeChange('text'); }} className={linkClass}>
            Paste text instead
          </button>
        </>
      )}

      {showUrlOption && currentMode !== 'url' && (
        <>
          <span className="text-gray-300">|</span>
          <button onClick={() => { onClear(); onModeChange('url'); }} className={linkClass}>
            Provide URL instead
          </button>
        </>
      )}
    </div>
  );

  // Has content - show the content with options
  const hasFile = mode === 'file' && file;
  const hasUrl = mode === 'url' && url.trim();
  const hasText = mode === 'text' && text.trim();

  if (hasFile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm w-fit">
          <FileIcon />
          <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
        </div>
        <AlternativeOptions onClear={() => onFileChange(null)} currentMode="file" />
      </div>
    );
  }

  if (hasUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 rounded text-sm">
          <LinkIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-gray-700 truncate font-mono text-xs">{url}</span>
        </div>
        <AlternativeOptions onClear={() => { onUrlChange?.(''); setUrlDraft(''); }} currentMode="url" />
      </div>
    );
  }

  if (hasText) {
    return (
      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={textRows}
          placeholder={textPlaceholder}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition font-mono text-xs"
        />
        <AlternativeOptions onClear={() => onTextChange('')} currentMode="text" />
      </div>
    );
  }

  // Initial/empty state - show action buttons
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className={buttonClass}>
          <UploadIcon />
          {fileLabel}
          <input type="file" accept={fileAccept} onChange={handleFileSelect} className="hidden" />
        </label>

        {showTextOption && (
          <button
            onClick={() => { onModeChange('text'); setTimeout(() => textareaRef.current?.focus(), 0); }}
            className={buttonClass}
          >
            <ClipboardIcon />
            Paste text
          </button>
        )}

        {showUrlOption && (
          <button
            onClick={() => { onModeChange('url'); setTimeout(() => urlInputRef.current?.focus(), 0); }}
            className={buttonClass}
          >
            <LinkIcon />
            Provide URL
          </button>
        )}
      </div>

      {mode === 'text' && (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={textRows}
          placeholder={textPlaceholder}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition font-mono text-xs"
        />
      )}

      {mode === 'url' && !url.trim() && (
        <div className="flex gap-2">
          <input
            ref={urlInputRef}
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), saveUrl())}
            placeholder={urlPlaceholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition text-sm"
          />
          <button
            onClick={saveUrl}
            disabled={!urlDraft.trim()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm cursor-pointer"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
