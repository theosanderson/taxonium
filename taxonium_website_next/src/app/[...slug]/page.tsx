"use client";

import { usePathname } from 'next/navigation';
import MainApp from '../MainApp';

export default function TreePage() {
  const pathname = usePathname();
  return <MainApp pathname={pathname} />;
}
