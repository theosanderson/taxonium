import { Suspense } from 'react';
import MainApp from './MainApp';
import staticTrees from '../lib/trees.json';

export default async function Home() {
  return (
    <Suspense fallback={<div></div>}>
      <MainApp
        pathname="/"
        initialTreeConfig={staticTrees}
      />
    </Suspense>
  );
}
