import { NextResponse } from 'next/server';
import staticTrees from '../../../lib/trees.json';

const VIRAL_USHER_TSV_URL = 'https://angiehinrichs.github.io/viral_usher_trees/tree_metadata.tsv';
const VIRAL_USHER_BASE_URL = 'https://angiehinrichs.github.io/viral_usher_trees/trees';

interface TreeMetadata {
  accession: string;
  tree_name: string;
  organism: string;
  isolate: string;
  strain: string;
  serotype: string;
  segment: string;
  taxonomy_id: string;
  tip_count: string;
}

async function fetchViralUsherTrees() {
  try {
    const response = await fetch(VIRAL_USHER_TSV_URL, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch viral usher trees');
      return {};
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t');

    const trees: Record<string, any> = {};

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length < headers.length) continue;

      const metadata: any = {};
      headers.forEach((header, index) => {
        metadata[header] = values[index];
      });

      const treeName = metadata.tree_name;
      const accession = metadata.accession;
      const organism = metadata.organism;
      const tipCount = metadata.tip_count;

      // Create a path-friendly organism name (replace spaces and special chars with underscores)
      const organismPath = organism
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

      // Create a path-friendly key: viral-usher/{organism}/{accession}
      const pathKey = `viral-usher/${organismPath}/${accession}`;

      // Create a descriptive title
      let displayTitle = organism;
      if (metadata.segment) {
        displayTitle += ` (segment ${metadata.segment})`;
      }
      if (metadata.serotype) {
        displayTitle += ` [${metadata.serotype}]`;
      }
      displayTitle += ` - ${accession}`;

      // Generate the tree configuration
      trees[pathKey] = {
        protoUrl: `${VIRAL_USHER_BASE_URL}/${treeName}/tree.jsonl.gz`,
        usherProtobuf: `${VIRAL_USHER_BASE_URL}/${treeName}/optimized.pb.gz`,
        referenceGBFF: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${accession}&rettype=gb&retmode=text`,
        referenceFasta: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${accession}&rettype=fasta&retmode=text`,
        metadataUrl: `${VIRAL_USHER_BASE_URL}/${treeName}/metadata.tsv.gz`,
        title: displayTitle,
        description: `${organism} - ${tipCount} sequences`,
        icon: "/assets/usher.png",
        maintainerMessage: "Maintained by the UShER viral trees repository",
        maintainerUrl: "https://github.com/AngieHinrichs/viral_usher_trees",
        metadata: {
          accession,
          treeName,
          organism,
          isolate: metadata.isolate,
          strain: metadata.strain,
          serotype: metadata.serotype,
          segment: metadata.segment,
          tipCount
        }
      };
    }

    return trees;
  } catch (error) {
    console.error('Error fetching viral usher trees:', error);
    return {};
  }
}

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    // Fetch viral usher trees
    const viralUsherTrees = await fetchViralUsherTrees();

    // Merge with static trees (static trees take precedence)
    const allTrees = {
      ...viralUsherTrees,
      ...staticTrees
    };

    return NextResponse.json(allTrees);
  } catch (error) {
    console.error('Error in trees API:', error);
    return NextResponse.json(staticTrees, { status: 500 });
  }
}
