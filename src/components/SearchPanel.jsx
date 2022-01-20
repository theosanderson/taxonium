import React, { useEffect, useMemo, useState } from "react";
import SearchItem from "./SearchItem";
import { FaSearch } from "react-icons/fa";
import { RiAddCircleLine } from "react-icons/ri";
import { BiPalette } from "react-icons/bi";
import { BsInfoCircle } from "react-icons/bs";
import { DebounceInput } from "react-debounce-input";
import { IoMdSettings } from "react-icons/io";
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function get_epi_isl_url(epi_isl) {
  if (epi_isl.length > 4) {
    return (
      "https://www.epicov.org/acknowledgement/" +
      epi_isl.slice(-4, -2) +
      "/" +
      epi_isl.slice(-2) +
      "/" +
      epi_isl +
      ".json"
    );
  }
}
get_epi_isl_url("");
function numberWithCommas(x) {
  const internationalNumberFormat = new Intl.NumberFormat("en-US");
  return internationalNumberFormat.format(x);
}

function SearchPanel() {
  return (
    <div className="overflow-y-auto" style={{ height: "calc(100vh - 5em)" }}>
      Search panel to go here
    </div>
  );
}

export default SearchPanel;
