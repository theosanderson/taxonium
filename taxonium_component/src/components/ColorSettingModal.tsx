import React from "react";
import TaxoniumModal from "./TaxoniumModal";
import ColorPicker from "./ColorPicker";

interface ColorSettingModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  color: number[];
  setColor: (color: number[]) => void;
  title: string;
}

const modalStyle = {
  content: {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fafafa",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "400px",
  },
  overlay: {
    backgroundColor: "rgba(100, 100, 100, 0.3)",
    zIndex: 1000,
  },
};

const ColorSettingModal = ({
  isOpen,
  setIsOpen,
  color,
  setColor,
  title,
}: ColorSettingModalProps) => {
  return (
    <TaxoniumModal
      isOpen={isOpen}
      style={modalStyle}
      onRequestClose={() => setIsOpen(false)}
      contentLabel={title}
    >
      <h2 className="font-medium mb-5 text-lg">{title}</h2>

      <div className="space-y-3">
        <div>
          <label>
            Select Color:
            <ColorPicker color={color} setColor={setColor} />
          </label>
        </div>
      </div>
    </TaxoniumModal>
  );
};

export default ColorSettingModal;
