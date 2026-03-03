import { NextResponse } from 'next/server';
import staticTrees from '../../../lib/trees.json';

const VIRAL_USHER_TSV_URL = 'https://angiehinrichs.github.io/viral_usher_trees/tree_metadata.tsv';
const VIRAL_USHER_BASE_URL = 'https://angiehinrichs.github.io/viral_usher_trees/trees';
const VIRAL_USHER_ROOT_URL = 'https://angiehinrichs.github.io/viral_usher_trees';

function parseRefFromToml(toml: string, key: string): string | null {
  const match = toml.match(new RegExp(`^${key}\\s*=\\s*'([^']+)'`, 'm'));
  return match ? match[1] : null;
}

function tomlPathToUrl(relativePath: string): string {
  // Convert ./trees/X/file.fa -> https://...github.io/viral_usher_trees/trees/X/file.fa
  return `${VIRAL_USHER_ROOT_URL}/${relativePath.replace(/^\.\//, '')}`;
}

async function fetchTreeConfig(treeName: string): Promise<{ refFasta: string | null; refGbff: string | null }> {
  try {
    const response = await fetch(`${VIRAL_USHER_BASE_URL}/${treeName}/config.toml`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) return { refFasta: null, refGbff: null };
    const text = await response.text();
    const refFastaRel = parseRefFromToml(text, 'ref_fasta');
    const refGbffRel = parseRefFromToml(text, 'ref_gbff');
    return {
      refFasta: refFastaRel ? tomlPathToUrl(refFastaRel) : null,
      refGbff: refGbffRel ? tomlPathToUrl(refGbffRel) : null,
    };
  } catch {
    return { refFasta: null, refGbff: null };
  }
}

async function fetchViralUsherTrees() {
  try {
    const response = await fetch(VIRAL_USHER_TSV_URL, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.error('Failed to fetch viral usher trees');
      return {};
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t');

    // Parse all TSV rows first
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length < headers.length) continue;
      const metadata: any = {};
      headers.forEach((header, index) => {
        metadata[header] = values[index];
      });
      rows.push(metadata);
    }

    // Fetch all config.tomls in parallel
    const configs = await Promise.all(
      rows.map(metadata => fetchTreeConfig(metadata.tree_name))
    );

    const trees: Record<string, any> = {};

    rows.forEach((metadata, i) => {
      const treeName = metadata.tree_name;
      const accession = metadata.accession;
      const organism = metadata.organism;
      const tipCount = metadata.tip_count;
      const { refFasta, refGbff } = configs[i];

      const organismPath = organism
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

      const pathKey = `viral-usher/${organismPath}/${accession}`;

      let displayTitle = organism;
      if (metadata.segment) displayTitle += ` (segment ${metadata.segment})`;
      if (metadata.serotype) displayTitle += ` [${metadata.serotype}]`;
      displayTitle += ` - ${accession}`;

      // Fall back to NCBI eutils if no rerooted file found in config.toml
      const referenceGBFF = refGbff ??
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${accession}&rettype=gb&retmode=text`;
      const referenceFasta = refFasta ??
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${accession}&rettype=fasta&retmode=text`;

      trees[pathKey] = {
        protoUrl: `${VIRAL_USHER_BASE_URL}/${treeName}/tree.jsonl.gz`,
        usherProtobuf: `${VIRAL_USHER_BASE_URL}/${treeName}/optimized.pb.gz`,
        referenceGBFF,
        referenceFasta,
        metadataUrl: `${VIRAL_USHER_BASE_URL}/${treeName}/metadata.tsv.gz`,
        title: displayTitle,
        description: `${organism} - ${tipCount} sequences`,
        icon: "/assets/usher.png",
        maintainerMessage: "Maintained by Angie Hinrichs at UCSC",
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
    });

    return trees;
  } catch (error) {
    console.error('Error fetching viral usher trees:', error);
    return {};
  }
}

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const viralUsherTrees = await fetchViralUsherTrees();
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
