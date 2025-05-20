import React from "react";
import { toast } from "react-hot-toast";
import { FaCircle, FaRegCircle } from "react-icons/fa";

const SearchDisplayToggle = ({ settings }) => {
  const { displaySearchesAsPoints, setDisplaySearchesAsPoints } = settings;
  const toggleDisplay = () => {
    // Toggle the displaySearchesAsPoints value
    setDisplaySearchesAsPoints(!displaySearchesAsPoints);

    // Show a toast message based on the new value
    if (!displaySearchesAsPoints) {
      toast.success("Displaying searches as points");
    } else {
      toast.success("Displaying searches as circles");
    }
  };

  return (
    <button onClick={toggleDisplay} aria-label="Toggle Display Mode">
      {displaySearchesAsPoints ? <FaCircle /> : <FaRegCircle />}
    </button>
  );
};

export default SearchDisplayToggle;
