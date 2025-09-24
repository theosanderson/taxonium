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
  contentLabel?: string;
}

export default function TaxoniumModal({
  children,
  className,
  ...props
}: Props) {
  return (
    <Modal className={`taxonium ${className}`} {...props}>
      {children}
    </Modal>
  );
}
