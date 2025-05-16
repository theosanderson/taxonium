import { JBrowseErrorBoundary } from "./JBrowseErrorBoundary";

export default {
  title: "Taxonium/JBrowseErrorBoundary",
  component: JBrowseErrorBoundary,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

// This story shows the error boundary with normal content
export const WithNormalContent = {
  render: () => (
    <JBrowseErrorBoundary>
      <div className="p-4 border border-gray-300 rounded">
        Normal content inside error boundary
      </div>
    </JBrowseErrorBoundary>
  ),
};

// Note: Error boundaries can't be fully tested in Storybook as they are designed to catch errors during rendering
// These stories are mainly for documentation purposes

export const ErrorBoundaryInfo = {
  render: () => (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="text-lg font-semibold mb-2">JBrowseErrorBoundary</h3>
      <p className="mb-2">
        This component is an error boundary that catches specific
        JBrowse-related errors:
      </p>
      <ul className="list-disc pl-5 mb-3">
        <li>Catches "invalid SceneGraph arguments" errors</li>
        <li>Catches "Invalid array length" errors</li>
        <li>Shows a toast notification when file format errors are detected</li>
        <li>
          Allows children to render unless there's a non-file related error
        </li>
      </ul>
      <p className="text-sm text-gray-600">
        Note: Error boundaries cannot be fully tested in Storybook as they catch
        errors during rendering in a real application environment.
      </p>
    </div>
  ),
};
