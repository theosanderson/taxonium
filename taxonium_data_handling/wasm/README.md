# Memory64 tree processing

The local browser worker uses a freestanding C module compiled for `wasm64` to
process numerical batches. It accelerates point binning and duplicate removal,
ancestor collection and result ordering, numeric search predicates, and the
min/max and histogram calculations used for the initial view. The surrounding
JavaScript APIs and returned node objects are unchanged. File parsing, metadata,
and rendering remain in JavaScript.

The worker installs the accelerator only after the binary compiles successfully.
Browsers without Memory64 support use the existing JavaScript algorithms. A
declined operation or allocation failure also falls back to JavaScript with the
original tree intact. The server backend does not enable the accelerator.

## Memory

The tree stays in its existing storage. Each input batch contains at most 8,192
nodes' numerical fields; there is no second full-tree copy or persistent
per-node accelerator index. Temporary hash tables and ID buffers grow with the
query, and the module has no explicit maximum memory or wasm32 addressing cap.
Pointers use i64 and node IDs retain JavaScript's safe-integer range.

An arena reuses scratch space between operations. After a query grows the
instance above 8 MiB, the wrapper drops that instance so it can be garbage
collected; the next query starts a fresh instance of the cached compiled module.
This is a retention budget, not a limit on a query or tree. Replacing a loaded
tree also drops the instance. Typed-array views are reacquired after memory
growth, and no views into scratch memory are returned to the application.

The 4.19-million-node balanced-tree benchmark used up to 1.75 MiB of WASM scratch
space for viewport queries. This measures WASM memory, not peak JS/GPU/browser
memory. Browser allocation limits and available physical RAM still apply. The
optional browser boundary check verifies a memory larger than 4 GiB and accesses
a byte above that address; it does not prove a browser can commit all system RAM.

## Build

The generated `treeProcessingBytes.js` is committed, so normal builds need no C
compiler and deployments need no separate WASM asset. The embedded binary is
about 6 KiB. To regenerate it, use the Clang distributed with WASI SDK 34:

```sh
cd taxonium_component
WASM64_CLANG=/path/to/wasi-sdk-34.0-x86_64-linux/bin/clang npm run build:wasm64
```

The build is freestanding (`-nostdlib`), disables floating-point contraction,
and asserts 64-bit pointers at compile time. It needs the SDK compiler/linker
and shared libraries, but not the WASI sysroot. The generated file records the
C source hash. CI rebuilds with the pinned SDK and checks for an identical file.

## Validation and benchmarks

Node 24 or later runs all Memory64 unit tests. Earlier Node releases exercise the
JavaScript fallback and skip the Memory64 cases. The browser check bundles the
actual production inline worker, imports a synthetic JSONL tree, and compares
queries and configuration between native Memory64 and forced JS fallback.

```sh
cd taxonium_component
npm ci
npm test
npm run check-types
npm run build
npx playwright install chromium
npm run test:wasm64:browser
WASM64_LARGE_MEMORY_CHECK=1 npm run test:wasm64:browser
node --expose-gc ../taxonium_data_handling/wasm/benchmark.mjs
```

Set `WASM64_CHROMIUM` to use a specific Chromium executable. The optional
large-memory check requires an environment permitting a 4-GiB virtual allocation.

The benchmark compares the same code with acceleration disabled/enabled and
checks identical results. It uses a synthetic balanced tree, two warm-up runs,
and the median of nine alternating measurements. An optional depth argument
defaults to 22 (4,194,303 nodes). These are processing timings, not animation FPS.
The sparse-query improvement overlaps PR #834; the WASM changes also target
whole-tree point reduction, searches, and coordinate statistics. Numeric search
has been approximately neutral in this workload, so no speedup is claimed for it.
