import time
from pathlib import Path

from taxoniumtools import usher_to_taxonium


def benchmark_basic():
    """Benchmark usher_to_taxonium on the provided test dataset."""
    data_dir = Path(__file__).resolve().parent.parent / "test_data"
    input_file = data_dir / "tfci.pb"
    metadata_file = data_dir / "tfci.meta.tsv.gz"
    genbank_file = data_dir / "hu1.gb"
    out_file = Path("/tmp/taxonium_test.jsonl.gz")

    start = time.perf_counter()
    usher_to_taxonium.do_processing(
        str(input_file),
        str(out_file),
        metadata_file=str(metadata_file),
        genbank_file=str(genbank_file),
        columns="genbank_accession,country,date,pangolin_lineage",
        clade_types="nextstrain,pango",
    )
    return time.perf_counter() - start


def main():
    runtime = benchmark_basic()
    print(f"Runtime: {runtime:.2f}s")


if __name__ == "__main__":
    main()
