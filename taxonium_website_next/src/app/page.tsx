import { Suspense } from 'react';
import MainApp from './MainApp';
import staticTrees from '../lib/trees.json';

const VIRAL_USHER_API = process.env.VIRAL_USHER_API || process.env.NEXT_PUBLIC_VIRAL_USHER_API || '';

export default async function Home() {
  let initialViralUsherItems: any[] = [];
  let initialViralUsherTotal = 0;

  if (VIRAL_USHER_API) {
    try {
      const res = await fetch(`${VIRAL_USHER_API}/api/viral-usher-trees?limit=8`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        initialViralUsherItems = data.trees || [];
        initialViralUsherTotal = data.total || 0;
      }
    } catch {
      // fall through — client will fetch on mount
    }
  }

  return (
    <Suspense fallback={<div></div>}>
      <MainApp
        pathname="/"
        initialTreeConfig={staticTrees}
        initialViralUsherItems={initialViralUsherItems}
        initialViralUsherTotal={initialViralUsherTotal}
      />
    </Suspense>
  );
}
