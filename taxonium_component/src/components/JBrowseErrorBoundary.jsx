import React from "react";
import { toast } from "react-hot-toast";

export class JBrowseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fileError: false, otherError: false };
  }

  static getDerivedStateFromError(error) {
    if (
      error.message === "invalid SceneGraph arguments" ||
      error.message === "Invalid array length"
    ) {
      return { fileError: true };
    }
    return { otherError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (
      error.message === "invalid SceneGraph arguments" ||
      error.message === "Invalid array length"
    ) {
      toast.error(
        "Error displaying track. Please make sure your file is well-formatted (e.g., validated with https://github.com/EBIvariation/vcf-validator).",
      );
    }
  }

  render() {
    return this.state.fileError || !this.state.otherError
      ? this.props.children
      : "";
  }
}
