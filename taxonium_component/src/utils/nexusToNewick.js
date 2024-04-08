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

  // translate the taxon labels in the Newick string
  const translatedNewickString = newickString.replace(
    /([^:\,\(\)]+)/gims,
    (match) => {
      return translations[match] || match;
    },
  );

  return { newick: translatedNewickString };
}

export default nexusToNewick;
