import JBrowsePanel from "./JBrowsePanel";
import { JBrowseErrorBoundary } from "./JBrowseErrorBoundary";

export default function TreenomeBrowser({ state, settings }) {
  return (
    <JBrowseErrorBoundary>
      <JBrowsePanel treenomeState={state} settings={settings} />
    </JBrowseErrorBoundary>
  );
}
