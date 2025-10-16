"use client";

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import MainApp from '../MainApp';

export default function TreePage() {
  const pathname = usePathname();
  return (
    <Suspense fallback={<div></div>}>
      <MainApp pathname={pathname} />
    </Suspense>
  );
}
