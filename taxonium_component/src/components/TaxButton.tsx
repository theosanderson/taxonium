import React from "react";

interface TaxButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}

const TaxButton = ({ children, onClick, title }: TaxButtonProps) => {
  return (
    <button
      className=" w-12 h-10 bg-gray-100 p-1 rounded border-gray-300 text-gray-700  opacity-70  hover:opacity-100 mr-1 z-50 mt-auto mb-1
        shadow-md "
      onClick={onClick}
      title={title}
      style={{
        pointerEvents: "auto",
      }}
    >
      {children}
    </button>
  );
};

export default TaxButton;
