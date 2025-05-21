import { useState, useEffect, PropsWithChildren } from "react";
import ColorSettingModal from "./ColorSettingModal";
import { Button } from "./Basic";

export default {
  title: "Taxonium/ColorSettingModal",
  component: ColorSettingModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// Set up Modal for Storybook
// This is needed for react-modal to work properly in Storybook
import Modal from "react-modal";

const ModalWrapper = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    // Set the app element for accessibility
    Modal.setAppElement("#storybook-root");
    return () => {
      // Clean up
    };
  }, []);

  return <>{children}</>;
};

// Wrapper component to manage state for the ColorSettingModal
interface ColorSettingModalWithStateProps {
  initialColor: number[];
  title: string;
  initiallyOpen?: boolean;
}

const ColorSettingModalWithState = ({
  initialColor,
  title,
  initiallyOpen = false,
}: ColorSettingModalWithStateProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [color, setColor] = useState(initialColor);

  return (
    <ModalWrapper>
      <div className="flex flex-col items-center gap-4">
        <Button onClick={() => setIsOpen(true)}>Open Color Modal</Button>
        <div
          className="w-20 h-10 rounded"
          style={{
            backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
          }}
        ></div>
        <ColorSettingModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          color={color}
          setColor={setColor}
          title={title}
        />
      </div>
    </ModalWrapper>
  );
};

export const DefaultClosed = {
  render: () => (
    <ColorSettingModalWithState
      initialColor={[100, 150, 200]}
      title="Select Background Color"
    />
  ),
};

export const InitiallyOpen = {
  render: () => (
    <ColorSettingModalWithState
      initialColor={[255, 100, 100]}
      title="Select Highlight Color"
      initiallyOpen={true}
    />
  ),
};

export const GreenExample = {
  render: () => (
    <ColorSettingModalWithState
      initialColor={[50, 200, 100]}
      title="Select Tree Color"
    />
  ),
};
