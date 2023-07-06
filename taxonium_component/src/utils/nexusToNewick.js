function nexusToNewick(nexusString) {
  // get Translate section if present
  const translateBlock = nexusString.match(/Translate(.*?);/gims);

  let translations = {};

  // get all the translations

  if (translateBlock) {
    const translate = translateBlock[0];
    translate.split("\n").forEach((line) => {
      line = line.trim();
      const parts = line.split(" ");
      if (parts.length === 2) {
        const key = parts[0];
        const value = parts[1].replace(",", "");
        translations[key] = value;
      }
    });
  }

  // get all the trees

  const treeBlock = nexusString.match(/tree .+ ?= ?(.*?;)/gims);

  // get the Newick string from the tree block
  const newickString = treeBlock[0].match(/\((.*?)\).+;/gims)[0];

  let nodeProperties = {};

  // extract properties, which are indicated by [&key=value] or [&key={value1,value2,...}]
  newickString.replace(
    /\[&?(.*?)\]/gims,
    (match, contents, offset, inputString) => {
      let nodeId = inputString.slice(0, offset).match(/[^,\(\):]+$/g)[0];
      // use a regular expression to split on commas not inside curly brackets
      let properties = contents.split(/,(?![^{]*})/g);
      let propertyDict = {};
      for (let prop of properties) {
        let [key, value] = prop.split("=");
        propertyDict["meta_" + key] = value;
      }
      nodeProperties[nodeId] = propertyDict;
    }
  );

  // remove comments, which are indicated by [...]

  const newick = newickString.replace(/\[(.*?)\]/gims, "");

  // translate the taxon labels in the Newick string
  const translatedNewickString = newick.replace(
    /([^:\,\(\)]+)/gims,
    (match) => {
      return translations[match] || match;
    }
  );

  return { newick: translatedNewickString, nodeProperties };
}

export default nexusToNewick;
