function nexusToNewick(nexusString: string): { newick: string } {
  // get Translate section if present
  const translateBlock = nexusString.match(/Translate(.*?);/gims);

  const translations: Record<string, string> = {};

  // get all the translations

  if (translateBlock) {
    const translate = translateBlock[0];
    translate.split("\n").forEach((line: string) => {
      const trimmed = line.trim();
      const parts = trimmed.split(" ");
      if (parts.length === 2) {
        const key = parts[0];
        const value = parts[1].replace(",", "");
        translations[key] = value;
      }
    });
  }

  // get all the trees

  const treeBlock = nexusString.match(/tree .+ ?= ?(.*?;)/gims);

  if (!treeBlock || treeBlock.length === 0) {
    return { newick: "" };
  }

  // get the Newick string from the tree block
  const newickMatch = treeBlock[0].match(/\((.*?)\).+;/gims);
  if (!newickMatch) {
    return { newick: "" };
  }
  const newickString = newickMatch[0];

  // translate the taxon labels in the Newick string
  const translatedNewickString = newickString.replace(
    /([^:\,\(\)]+)/gims,
    (match: string) => {
      return translations[match] || match;
    }
  );

  return { newick: translatedNewickString };
}

export default nexusToNewick;
