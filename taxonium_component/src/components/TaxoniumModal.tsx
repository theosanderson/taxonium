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
  ...props
}: Props) {
  return (
    <Modal parentSelector={parentSelector} {...props}>
      {children}
    </Modal>
  );
}
