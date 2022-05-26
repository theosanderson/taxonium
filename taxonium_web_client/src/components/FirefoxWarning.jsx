/* React functional component that warns you if you are using Firefox that the page will be slow. Only shows if using firefox. */

const FirefoxWarning = ({ className }) => {
  const isFirefox = typeof InstallTrigger !== "undefined";
  if (isFirefox) {
    return (
      <div className={className}>
        <p>
          Warning: Taxonium loads large files more slowly in Firefox. Please
          use Chrome or Safari for an optimal experience.
        </p>
      </div>
    );
  } else {
    return null;
  }
};

export default FirefoxWarning;
