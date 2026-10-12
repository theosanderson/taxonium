// Freestanding wasm64: no libc, filesystem, threads, or copy of the full tree.
typedef unsigned long long u64;
typedef unsigned int u32;
_Static_assert(sizeof(void *) == 8, "Compile for wasm64, not wasm32");
#define EXPORT(name) __attribute__((export_name(name)))
#define BATCH 8192
#define BINS 4096
#define EMPTY (~(u64)0)

__attribute__((import_module("tree"), import_name("parent")))
extern double parent_of(double id);
extern unsigned char __heap_base;

static double input[BATCH * 2];
static u32 indices[BATCH];
static u64 histogram[BINS];
static double minimum, maximum, finite_count;
static u64 cursor, *table, capacity, occupied, dimensions;
static double *selected;
static u64 selected_count, selected_capacity;

EXPORT("input") double *input_pointer(void) { return input; }
EXPORT("indices") u32 *indices_pointer(void) { return indices; }
EXPORT("selected") double *selected_pointer(void) { return selected; }
EXPORT("selected_count") u64 get_selected_count(void) { return selected_count; }

// Memory64 pointers and growth deliberately have no wasm32/4-GiB maximum.
// Scratch allocations are discarded together after each operation.
static void *allocate(u64 bytes) {
  if (bytes > EMPTY - cursor - 7) return 0;
  u64 end = (cursor + bytes + 7) & ~(u64)7;
  u64 pages = __builtin_wasm_memory_size(0);
  if (end > pages * 65536) {
    u64 extra = (end - pages * 65536 + 65535) / 65536;
    if (__builtin_wasm_memory_grow(0, extra) == EMPTY) return 0;
  }
  void *result = (void *)cursor;
  cursor = end;
  return result;
}

EXPORT("reset") void reset(u32 key_dimensions) {
  cursor = (u64)&__heap_base;
  table = 0;
  capacity = occupied = selected_count = selected_capacity = 0;
  selected = 0;
  dimensions = key_dimensions;
}

static u64 bits(double value) {
  union { double number; u64 bits; } converted;
  // JavaScript object keys identify both signed zeroes and every NaN alike.
  if (value == 0) value = 0;
  if (__builtin_isnan(value)) return 0x7ff8000000000000ULL;
  converted.number = value;
  return converted.bits;
}

static u64 hash(u64 key) {
  key ^= key >> 30;
  key *= 0xbf58476d1ce4e5b9ULL;
  key ^= key >> 27;
  key *= 0x94d049bb133111ebULL;
  return key ^ (key >> 31);
}

static u64 slot(u64 a, u64 b) {
  u64 at = hash(a ^ hash(b)) & (capacity - 1);
  while (table[at * dimensions] != EMPTY &&
         (table[at * dimensions] != a ||
          (dimensions == 2 && table[at * dimensions + 1] != b)))
    at = (at + 1) & (capacity - 1);
  return at;
}

static int grow_table(void) {
  u64 old_capacity = capacity;
  u64 *old = table;
  u64 new_capacity = capacity ? capacity * 2 : 1024;
  if (new_capacity > EMPTY / dimensions / sizeof(u64)) return 0;
  u64 *replacement = allocate(new_capacity * dimensions * sizeof(u64));
  if (!replacement) return 0;
  capacity = new_capacity;
  table = replacement;
  for (u64 i = 0; i < capacity; i++) table[i * dimensions] = EMPTY;
  for (u64 i = 0; i < old_capacity; i++) {
    u64 a = old[i * dimensions];
    if (a == EMPTY) continue;
    u64 b = dimensions == 2 ? old[i * dimensions + 1] : 0;
    u64 at = slot(a, b);
    table[at * dimensions] = a;
    if (dimensions == 2) table[at * dimensions + 1] = b;
  }
  return 1;
}

// 1 = new key, 0 = duplicate, -1 = allocation failure.
static int insert(u64 a, u64 b) {
  if (!capacity && !grow_table()) return -1;
  u64 at = slot(a, b);
  if (table[at * dimensions] != EMPTY) return 0;
  if ((occupied + 1) * 2 > capacity) {
    if (!grow_table()) return -1;
    at = slot(a, b);
  }
  table[at * dimensions] = a;
  if (dimensions == 2) table[at * dimensions + 1] = b;
  occupied++;
  return 1;
}

static double js_round(double value) {
  if (!__builtin_isfinite(value)) return value;
  double lower = __builtin_floor(value);
  // floor(value + .5) rounds incorrectly just below some half-integers.
  return value - lower < 0.5 ? lower : lower + 1;
}

EXPORT("reduce_points") int reduce_points(u32 count, double px, double py) {
  u32 output_count = 0;
  for (u32 i = 0; i < count; i++) {
    double x = js_round(input[i * 2] * px) / px;
    double y = js_round(input[i * 2 + 1] * py) / py;
    int added = insert(bits(x), bits(y));
    if (added < 0) return -1;
    if (added) indices[output_count++] = i;
  }
  return (int)output_count;
}

static int add_id(double id) {
  int added = insert(bits(id), 0);
  if (added <= 0) return added;
  if (selected_count == selected_capacity) {
    u64 next = selected_capacity ? selected_capacity * 2 : 1024;
    if (next > EMPTY / sizeof(double)) return -1;
    double *replacement = allocate(next * sizeof(double));
    if (!replacement) return -1;
    for (u64 i = 0; i < selected_count; i++) replacement[i] = selected[i];
    selected = replacement;
    selected_capacity = next;
  }
  selected[selected_count++] = id;
  return 1;
}

EXPORT("seed_ids") int seed_ids(u32 count) {
  for (u32 i = 0; i < count; i++) if (add_id(input[i]) < 0) return -1;
  return 0;
}

// Iterative heapsort preserves numeric node order with constant extra space.
static void sift(u64 root, u64 end) {
  while (root * 2 + 1 < end) {
    u64 child = root * 2 + 1;
    if (child + 1 < end && selected[child] < selected[child + 1]) child++;
    if (selected[root] >= selected[child]) break;
    double tmp = selected[root]; selected[root] = selected[child]; selected[child] = tmp;
    root = child;
  }
}

EXPORT("collect_parents") int collect_parents(double total_nodes) {
  for (u64 i = 0; i < selected_count; i++) {
    double parent = parent_of(selected[i]);
    if (!__builtin_isfinite(parent) || parent < 0 || parent >= total_nodes ||
        parent != __builtin_floor(parent)) return -2;
    if (add_id(parent) < 0) return -1;
  }
  u64 levels = 0;
  for (u64 count = selected_count; count > 1; count >>= 1) levels++;
  if (selected_count * levels > total_nodes) {
    // Dense selections are cheaper to emit in ID order than to sort. The hash
    // table is independent of the output vector, so the vector can be reused.
    u64 written = 0;
    for (u64 id = 0; id < (u64)total_nodes; id++) {
      u64 key = bits((double)id);
      if (table[slot(key, 0)] == key) selected[written++] = (double)id;
    }
    return 0;
  }
  for (u64 start = selected_count / 2; start > 0; start--) sift(start - 1, selected_count);
  for (u64 end = selected_count; end > 1; end--) {
    double tmp = selected[0]; selected[0] = selected[end - 1]; selected[end - 1] = tmp;
    sift(0, end - 1);
  }
  return 0;
}

EXPORT("numeric_filter") u32 numeric_filter(u32 count, u32 operation, double value) {
  u32 output_count = 0;
  for (u32 i = 0; i < count; i++) {
    double x = input[i];
    int match = operation == 0 ? x == value : operation == 1 ? x > value :
                operation == 2 ? x < value : operation == 3 ? x >= value : x <= value;
    if (match) indices[output_count++] = i;
  }
  return output_count;
}

EXPORT("range_begin") void range_begin(void) {
  minimum = __builtin_inf(); maximum = -__builtin_inf(); finite_count = 0;
}
EXPORT("range_chunk") void range_chunk(u32 count) {
  for (u32 i = 0; i < count; i++) {
    double x = input[i];
    if (!__builtin_isfinite(x)) continue;
    if (x < minimum) minimum = x;
    if (x > maximum) maximum = x;
    finite_count++;
  }
}
EXPORT("range_min") double range_min(void) { return minimum; }
EXPORT("range_max") double range_max(void) { return maximum; }
EXPORT("histogram_begin") void histogram_begin(void) {
  for (u32 i = 0; i < BINS; i++) histogram[i] = 0;
}
EXPORT("histogram_chunk") void histogram_chunk(u32 count) {
  double scale = BINS / (maximum - minimum);
  for (u32 i = 0; i < count; i++) {
    double x = input[i];
    if (!__builtin_isfinite(x)) continue;
    double bin = __builtin_floor((x - minimum) * scale);
    if (bin >= BINS) bin = BINS - 1;
    if (bin >= 0 && bin < BINS) histogram[(u32)bin]++;
  }
}
EXPORT("quantile") double quantile(double fraction) {
  double target = finite_count * fraction;
  u64 cumulative = 0;
  for (u32 bin = 0; bin < BINS; bin++) {
    cumulative += histogram[bin];
    if (cumulative >= target) return minimum + ((bin + 1.0) / BINS) * (maximum - minimum);
  }
  return maximum;
}
