import RawTaxonium, { TaxoniumProps } from "./Taxonium";
import TaxoniumErrorBoundary from "./components/TaxoniumErrorBoundary";

export { RawTaxonium };
export type { TaxoniumProps };

export default function Taxonium(props: TaxoniumProps) {
  return (
    <TaxoniumErrorBoundary>
      <RawTaxonium {...props} />
    </TaxoniumErrorBoundary>
  );
}
