import { useState, useMemo, useCallback } from 'react';

function BrowserOptionsPanel({ browserState, setNtBounds, config }) {
  const [focusNt, setFocusNt] = useState(-1);
  const [focusGene, setFocusGene] = useState("");
  const genes = useMemo(() => {
    return { // [start, end, [color]]
    'ORF1a': [266, 13469, [142, 188, 102]],
    'ORF1b': [13468, 21556, [229, 150, 5]],
    'ORF1ab': [266, 21556, [255, 255, 255]],
    'S': [21563, 25385, [80, 151, 186]],
    'ORF3a': [25393, 26221, [170, 189, 82]],
    'E': [26245, 26473, [217, 173, 61]],
    'M': [26523, 27192, [80, 151, 186]],
    'ORF6': [27202, 27388, [223, 67, 39]],
    'ORF7a': [27394, 27760, [196, 185, 69]],
    'ORF7b': [27756, 27888, [117, 182, 129]],
    'ORF8': [27894, 28260, [96, 170, 1158]],
    'N': [28274, 29534, [230, 112, 48]],
    'ORF10': [29558, 29675, [90, 200, 216]]
    }
}, []);

  return (
    <div className="overflow-y-auto" style={{ }}>
      <div className="text-sm mt-3 text-gray-700 mb-1">
      </div>
      <hr />

      <h2 className="text-lg text-gray-500 mt-5">
        Browser Options
      </h2>

      <button
        className="block bg-gray-100 text-sm mx-auto p-1 rounded border-gray-300 border m-5 text-gray-700"
        style={{ marginLeft: 0 }}
      >
        Select Tracks
      </button>

    </div>
  );
}

export default BrowserOptionsPanel;