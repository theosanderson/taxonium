import React from "react";
import { toast } from "react-hot-toast";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class TaxoniumErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Taxonium crashed", error, info);
    toast.error("An unexpected error occurred while rendering the tree.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 border border-red-300 bg-red-50 text-red-800">
          <h2 className="font-bold">Something went wrong.</h2>
          <p className="break-words text-sm mt-2">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
