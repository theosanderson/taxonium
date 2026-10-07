import Modal from "react-modal";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  isOpen?: boolean;
  onRequestClose?: () => void;
  style?: {
    content?: React.CSSProperties;
    overlay?: React.CSSProperties;
  };
  ariaHideApp?: boolean;
  parentSelector?: () => HTMLElement;
  contentLabel?: string;
  [key: string]: any;
}

export default function TaxoniumModal({
  children,
  parentSelector = () =>
    document.getElementById("taxonium-root") as HTMLElement,
  style,
  ...props
}: Props) {
  // Ensure modals render above the tree, buttons and key unless a caller
  // explicitly sets its own z-index.
  const mergedStyle = {
    content: style?.content,
    overlay: { zIndex: 1000, ...style?.overlay },
  };
  return (
    <Modal parentSelector={parentSelector} style={mergedStyle} {...props}>
      {children}
    </Modal>
  );
}
