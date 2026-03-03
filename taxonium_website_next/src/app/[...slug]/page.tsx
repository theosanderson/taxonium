import { Suspense } from 'react';
import MainApp from '../MainApp';
import staticTrees from '../../lib/trees.json';

const VIRAL_USHER_API = process.env.VIRAL_USHER_API || process.env.NEXT_PUBLIC_VIRAL_USHER_API || '';
const VIRAL_USHER_BASE_URL = 'https://angiehinrichs.github.io/viral_usher_trees/trees';

export default async function TreePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const pathname = '/' + slug.join('/');

  let initialViralUsherPathConfig: any = null;

  if (VIRAL_USHER_API && pathname.startsWith('/viral-usher/')) {
    const accession = slug[slug.length - 1];
    try {
      const listRes = await fetch(
        `${VIRAL_USHER_API}/api/viral-usher-trees?q=${encodeURIComponent(accession)}&limit=5`,
        { next: { revalidate: 3600 } }
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        const treeRow = listData.trees?.find((t: any) => t.accession === accession);

        if (treeRow) {
          const { tree_name, organism, tip_count, segment, serotype } = treeRow;
          const treeRes = await fetch(
            `${VIRAL_USHER_API}/api/viral-usher-trees/${tree_name}`,
            { next: { revalidate: 86400 } }
          );
          if (treeRes.ok) {
            const treeData = await treeRes.json();
            let displayTitle = organism;
            if (segment) displayTitle += ` (segment ${segment})`;
            if (serotype) displayTitle += ` [${serotype}]`;
            displayTitle += ` - ${accession}`;

            initialViralUsherPathConfig = {
              protoUrl: `${VIRAL_USHER_BASE_URL}/${tree_name}/tree.jsonl.gz`,
              usherProtobuf: `${VIRAL_USHER_BASE_URL}/${tree_name}/optimized.pb.gz`,
              referenceGBFF: treeData.ref_gbff_url,
              referenceFasta: treeData.ref_fasta_url,
              metadataUrl: `${VIRAL_USHER_BASE_URL}/${tree_name}/metadata.tsv.gz`,
              title: displayTitle,
              description: `${organism} - ${tip_count} sequences`,
              icon: '/assets/usher.png',
              maintainerMessage: 'Maintained by Angie Hinrichs at UCSC',
              maintainerUrl: 'https://github.com/AngieHinrichs/viral_usher_trees',
            };
          }
        }
      }
    } catch {
      // fall through — client will fetch on mount
    }
  }

  return (
    <Suspense fallback={<div></div>}>
      <MainApp
        pathname={pathname}
        initialTreeConfig={staticTrees}
        initialViralUsherPathConfig={initialViralUsherPathConfig}
      />
    </Suspense>
  );
}
