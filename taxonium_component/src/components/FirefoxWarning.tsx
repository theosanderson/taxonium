/* React functional component that warns you if you are using Firefox that the
page will be slow. Only shows if using firefox. */

export interface FirefoxWarningProps {
  className?: string;
}

/**
 * Firefox exposes `InstallTrigger` as a global. Declare it so TypeScript knows
 * about it when this component checks for its presence.
 */
declare const InstallTrigger: unknown;

const FirefoxWarning = ({ className }: FirefoxWarningProps) => {
  // Feature currently disabled because Firefox works best for large trees on
  // MacOS
  return null;
  const isFirefox = typeof InstallTrigger !== "undefined";
  if (isFirefox) {
    return (
      <div className={className}>
        <p>
          Warning: Taxonium loads large files more slowly in Firefox. Please use
          Chrome or Safari for an optimal experience.
        </p>
      </div>
    );
  } else {
    return null;
  }
};

export default FirefoxWarning;
