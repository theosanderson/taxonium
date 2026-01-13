"use client";

import React, { useRef, useEffect } from 'react';

interface FileOrTextInputProps {
  // File input props
  file: File | null;
  onFileChange: (file: File | null) => void;
  fileAccept: string;
  fileLabel?: string;

  // Text input props
  text: string;
  onTextChange: (text: string) => void;
  textPlaceholder?: string;
  textRows?: number;

  // Mode tracking
  mode: 'file' | 'text';
  onModeChange: (mode: 'file' | 'text') => void;
}

export default function FileOrTextInput({
  file,
  onFileChange,
  fileAccept,
  fileLabel = "Upload File",
  text,
  onTextChange,
  textPlaceholder = "",
  textRows = 6,
  mode,
  onModeChange,
}: FileOrTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevModeRef = useRef(mode);
  const hasContent = (mode === 'file' && file) || (mode === 'text' && text.trim());

  // Focus textarea only when mode changes to 'text' (not on initial mount)
  useEffect(() => {
    if (mode === 'text' && prevModeRef.current !== 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
    prevModeRef.current = mode;
  }, [mode]);

  const buttonClass = "px-3 py-1.5 rounded transition text-sm cursor-pointer bg-white border border-gray-400 text-gray-600 hover:bg-gray-50";
  const linkClass = "text-sm text-gray-500 hover:text-gray-700 cursor-pointer";

  // File selected - show file info
  if (mode === 'file' && file) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
          </div>
          <button
            onClick={() => onFileChange(null)}
            className={linkClass}
          >
            Clear
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              onFileChange(null);
              onModeChange('text');
              setTimeout(() => textareaRef.current?.focus(), 0);
            }}
            className={linkClass}
          >
            Paste text instead
          </button>
        </div>
      </div>
    );
  }

  // Text mode or initial state - show buttons and textarea
  return (
    <div className="space-y-3">
      {/* Show buttons only when no text content */}
      {!text.trim() && (
        <div className="flex items-center gap-3">
          <label className={buttonClass}>
            {fileLabel}
            <input
              type="file"
              accept={fileAccept}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                if (selectedFile) {
                  onModeChange('file');
                  onFileChange(selectedFile);
                }
              }}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              onModeChange('text');
              // Focus after state update
              setTimeout(() => textareaRef.current?.focus(), 0);
            }}
            className={buttonClass}
          >
            Paste Text
          </button>
        </div>
      )}

      {/* Show textarea when in text mode */}
      {mode === 'text' && (
        <>
          <textarea
            ref={textareaRef}
            key="textarea"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={textRows}
            placeholder={textPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none transition font-mono text-xs"
          />
          {text.trim() && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTextChange('')}
                className={linkClass}
              >
                Clear
              </button>
              <span className="text-gray-300">|</span>
              <label className={linkClass}>
                Upload file instead
                <input
                  type="file"
                  accept={fileAccept}
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    if (selectedFile) {
                      onTextChange('');
                      onModeChange('file');
                      onFileChange(selectedFile);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
