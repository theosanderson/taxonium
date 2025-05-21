import React from "react";
import { toast } from "react-hot-toast";

interface JBrowseErrorBoundaryProps {
  children: React.ReactNode;
}

interface JBrowseErrorBoundaryState {
  fileError: boolean;
  otherError: boolean;
}

export class JBrowseErrorBoundary extends React.Component<
  JBrowseErrorBoundaryProps,
  JBrowseErrorBoundaryState
> {
  constructor(props: JBrowseErrorBoundaryProps) {
    super(props);
    this.state = { fileError: false, otherError: false };
  }

  static getDerivedStateFromError(error: Error): JBrowseErrorBoundaryState {
    if (
      error.message === "invalid SceneGraph arguments" ||
      error.message === "Invalid array length"
    ) {
      return { fileError: true, otherError: false };
    }
    return { fileError: false, otherError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (
      error.message === "invalid SceneGraph arguments" ||
      error.message === "Invalid array length"
    ) {
      toast.error(
        "Error displaying track. Please make sure your file is well-formatted (e.g., validated with https://github.com/EBIvariation/vcf-validator)."
      );
    }
  }

  render() {
    return this.state.fileError || !this.state.otherError
      ? this.props.children
      : "";
  }
}
