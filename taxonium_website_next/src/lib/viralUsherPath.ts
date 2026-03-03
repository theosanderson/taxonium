export function getViralUsherPath(organism: string, accession: string): string {
  const organismPath = organism.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').toLowerCase();
  return `viral-usher/${organismPath}/${accession}`;
}
