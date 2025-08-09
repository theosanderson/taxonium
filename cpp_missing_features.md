# Missing Features in C++ taxonium_tools

This document lists features present in the Python version of taxonium_tools that are currently missing from the C++ implementation.

## 1. Command-line Tools and Converters

### newick_to_taxonium
- **Description**: Converter for standard Newick phylogenetic tree format
- **Python Implementation**: Full support for reading Newick files (plain or gzipped) and converting to Taxonium JSONL
- **Features Missing in C++**:
  - Newick format parsing
  - TreeSwift library integration
  - Configuration via JSON files
  - HTML overlay support for custom "About" content

### view_taxonium
- **Description**: Docker-based local visualization server
- **Python Implementation**: Launches frontend and backend containers for interactive tree viewing
- **Features Missing in C++**:
  - Complete Docker integration
  - Port management and checking
  - Automatic browser launching
  - Container lifecycle management
  - Real-time log streaming

## 2. Tree Processing Features

### Chronumental Integration
- **Description**: Time tree building using Chronumental
- **Python Implementation**: Full integration for temporal analysis
- **Features Missing in C++**:
  - Running Chronumental as subprocess
  - Time coordinate calculation
  - Reference date node specification
  - Inferred date metadata columns
  - Dated output generation

### Tree Shearing
- **Description**: Removes small branches likely representing sequencing errors
- **Python Implementation**: `--shear` flag with `--shear_threshold` parameter
- **Features Missing in C++**:
  - Complete shearing algorithm
  - Threshold-based branch removal
  - Error branch identification

### Clade Annotations
- **Description**: Annotates nodes with clade types (e.g., Nextstrain, Pango)
- **Python Implementation**: `--clade_types` parameter
- **Features Missing in C++**:
  - Clade type extraction from protobuf
  - Multiple clade system support
  - Clade metadata integration

## 3. File Format Support

### Input Formats
- **Newick Format**: C++ only supports UShER protobuf, not standard Newick files
- **Config JSON**: Python supports configuration files for search parameters
- **Flexible Input**: Python handles both gzipped and non-gzipped files seamlessly

### Output Options
- **Tree Writing**: Python can output trees in Newick format during processing
- **HTML Overlay**: Python supports embedding custom HTML in visualizations

## 4. Configuration and Customization

### Missing Options in C++
- `--title`: Set custom title for tree display
- `--remove_after_pipe`: Clean node names by removing content after "|"
- `--key_column`: Specify which metadata column matches node names (default: "strain")
- `--columns`: Select specific metadata columns to include
- JSON-based configuration files

## 5. Visualization Features

### Local Server
- Complete Docker-based visualization missing in C++
- No backend/frontend port configuration
- No memory allocation settings for backend
- No automatic browser launching

## 6. Library and API Features

### Module Structure
- Python is installable as a package with entry points
- Python provides importable `UsherMutationAnnotatedTree` class
- C++ is only available as standalone executable

### External Tool Integration
- Python integrates with external tools via subprocess
- More flexible for pipeline integration

## 7. Additional Functionality

### Progress and User Experience
- Python uses `alive-progress` for sophisticated progress bars
- Version tracking with `setuptools_scm`

### Data Processing
- Pandas-based metadata handling in Python
- More flexible column selection and filtering
- Better handling of missing or malformed data

### Tree Formats
- Python supports multiple tree formats via TreeSwift
- More robust error handling for malformed trees

## Performance Note

While the C++ version lacks these features, it offers:
- 14.5x faster processing speed
- 6.4x lower memory usage
- Better scalability for very large trees

## Recommendation

The C++ implementation focuses on high-performance conversion of UShER protobuf files to Taxonium JSONL format. For users needing:
- Newick format support
- Time tree analysis
- Local visualization
- Advanced tree processing features

The Python version remains the more feature-complete option, while C++ excels at fast, memory-efficient processing of large UShER trees.