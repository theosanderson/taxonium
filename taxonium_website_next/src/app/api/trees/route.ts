import { NextResponse } from 'next/server';
import staticTrees from '../../../lib/trees.json';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  return NextResponse.json(staticTrees);
}
