"use client";

import React from 'react';

interface InputToggleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  // For file input variant
  fileInput?: {
    accept: string;
    onChange: (file: File | null) => void;
  };
}

export default function InputToggleButton({
  children,
  onClick,
  fileInput,
}: InputToggleButtonProps) {
  const className = "px-3 py-1.5 rounded transition text-sm cursor-pointer bg-white border border-gray-400 text-gray-600 hover:bg-gray-50";

  if (fileInput) {
    return (
      <label className={className}>
        {children}
        <input
          type="file"
          accept={fileInput.accept}
          onChange={(e) => {
            onClick?.();
            fileInput.onChange(e.target.files?.[0] || null);
          }}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
