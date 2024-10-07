const getSVGfunction = (layers, viewState) => {
  const accessOrConstant = (accessor, node) => {
    if (typeof accessor === "function") {
      return accessor(node);
    } else {
      return accessor;
    }
  };
  const normalise = (value, min, max) => {
    return (value - min) / (max - min);
  };

  const getSVG = (layers, viewState, svgWidth, svgHeight) => {
    const applyBounds = (point) => {
      const minY = viewState.min_y;
      const maxY = viewState.max_y;
      const minX = viewState.min_x;
      const maxX = viewState.max_x;
      const initial = point;
      const x = normalise(initial[0], minX, maxX);
      const y = normalise(initial[1], minY, maxY);
      return [x * svgWidth, y * svgHeight];
    };
    if (!viewState.min_x) {
      window.alert("Please zoom in and out a little before SVG export");
      return false;
    }
    let svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width="${svgWidth}" height="${svgHeight}">`;

    for (const layer of layers) {
      // unless layer id starts with "main"
      if (!layer.id.startsWith("main")) {
        continue;
      }

      switch (layer.layerType) {
        case "ScatterplotLayer":
          for (const point of layer.data) {
            const [x, y] = applyBounds(layer.getPosition(point));
            // if either is null, skip this point
            if (x === null || y === null) {
              continue;
            }
            const accessor = layer.getFillColor
              ? layer.getFillColor
              : layer.getColor;
            let color;
            if (!accessor) {
              // make color transparent
              color = "none";
            } else {
              const initColor = accessOrConstant(accessor, point);
              // if rgba
              if (initColor.length === 4) {
                color = `rgba(${initColor.join(",")})`;
                if (initColor[3] === 0) {
                  color = "none";
                }
              }
              // if rgb
              else if (initColor.length === 3) {
                color = `rgb(${initColor.join(",")})`;
              } else {
                console.warn("Unsupported color format");
              }
            }
            // check if stroked
            let strokeColor, strokeWidth;
            if (layer.stroked) {
              strokeColor = accessOrConstant(layer.getLineColor, point).join(
                ",",
              );
              strokeWidth = accessOrConstant(layer.getLineWidth, point);
            }

            // if getRadius is a fn call it otherwise assume it's a value
            const radius = accessOrConstant(layer.getRadius, point);
            svgContent += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"
            ${
              layer.stroked
                ? `stroke="rgb(${strokeColor})" stroke-width="${strokeWidth}"`
                : ""
            } />`;
          }
          break;

        case "LineLayer":
          for (const line of layer.data) {
            const [x1, y1] = applyBounds(layer.getSourcePosition(line));
            const [x2, y2] = applyBounds(layer.getTargetPosition(line));
            // if either is null, skip this point
            if (x1 === null || y1 === null || x2 === null || y2 === null) {
              continue;
            }
            const colorAccessor = layer.getLineColor
              ? layer.getLineColor
              : layer.getColor;
            // if colorAccessor is a function, call it with the line as an argument, otherwise assume it's an array
            const color = accessOrConstant(colorAccessor, line).join(",");
            const width = accessOrConstant(layer.getWidth, line);
            svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgb(${color})" stroke-width="${width}" />`;
          }
          break;

        case "TextLayer":
          for (const text of layer.data) {
            //const [x, y] = applyModelMatrix(layer.modelMatrix, layer.getPosition(text));
            const original = layer.getPosition(text);
            const adjusted = applyBounds(original);

            const [x, y] = adjusted;
            const size = accessOrConstant(layer.getSize, text);
            const alignment = accessOrConstant(
              layer.getAlignmentBaseline,
              text,
            );
            const anchor = accessOrConstant(layer.getTextAnchor, text);
            const pixelOffset = accessOrConstant(layer.getPixelOffset, text);

            const color = accessOrConstant(layer.getColor, text).join(",");
            const newContent = `<text x="${x}" y="${y}" font-family="${
              layer.fontFamily
            }" font-weight="${layer.fontWeight}" fill="rgb(${color})"
            font-size="${size}" text-anchor="${anchor}" alignment-baseline="${alignment}" dx="${
              pixelOffset[0]
            }" dy="${pixelOffset[1]}"
            >${layer.getText(text)}</text>`;
            svgContent += newContent;
          }
          break;

        // You can extend this with other layer types such as PolygonLayer, SolidPolygonLayer, etc.

        default:
          console.warn(`Unsupported layer type: ${layer.layerType}`);
          break;
      }
    }

    svgContent += "</svg>";
    return svgContent;
  };

  function triggerSVGdownload(deckSize) {
    if (!deckSize) {
      deckSize = { width: 600, height: 600 };
    }
    const svgWidth = deckSize.width;
    const svgHeight = deckSize.height;
    const svgContent = getSVG(layers, viewState, svgWidth, svgHeight);
    if (!svgContent) {
      return;
    }
    // Create a new blob object
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    // Create a link element, hide it, direct it towards the blob, and then 'click' it programatically
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
    // Create a DOMString representing the blob and point the link element towards it
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    const date_and_time = new Date().toISOString().replace(/:/g, "-");
    a.download = `taxonium-${date_and_time}.svg`;
    //programatically click the link to trigger the download
    a.click();
    //release the reference to the file by revoking the Object URL
    window.URL.revokeObjectURL(url);
  }

  return { triggerSVGdownload };
};

export default getSVGfunction;
