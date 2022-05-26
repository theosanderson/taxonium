/* React functional component that warns you if you are using Firefox that the page will be slow. Only shows if using firefox. */

const FirefoxWarning = () => {
  const isFirefox = typeof InstallTrigger !== "undefined";
  if (isFirefox) {
    return (
      <div className="firefox-warning text-xs font-bold">
        <p>
          <strong>Warning:</strong> Taxonium runs much more slowly in Firefox.
          Please use Chrome or Safari for optimal experience.
        </p>
      </div>
    );
  } else {
    return null;
  }
};

export default FirefoxWarning;
