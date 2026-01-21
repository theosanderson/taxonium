cmake_minimum_required(VERSION 3.14)
project(taxoniumtools_cpp VERSION 0.1.0 LANGUAGES CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Set default build type if not specified
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Compiler flags
option(PORTABLE_BUILD "Build portable binaries without -march=native" OFF)

if(MSVC)
    # MSVC compiler flags
    set(CMAKE_CXX_FLAGS_DEBUG "/Od /Zi /W4")
    set(CMAKE_CXX_FLAGS_RELEASE "/O2 /DNDEBUG")
else()
    # GCC/Clang compiler flags
    set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -Wall -Wextra -Wpedantic")
    if(PORTABLE_BUILD)
        set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
    else()
        set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -march=native")
    endif()
endif()

# Find required packages
find_package(Protobuf REQUIRED)
find_package(Threads REQUIRED)
find_package(ZLIB REQUIRED)

# Add yyjson (high-performance JSON library)
include(FetchContent)
FetchContent_Declare(
    yyjson
    GIT_REPOSITORY https://github.com/ibireme/yyjson.git
    GIT_TAG 0.10.0
)
FetchContent_MakeAvailable(yyjson)

# Find TBB
find_package(TBB QUIET)
if(NOT TBB_FOUND)
    message(STATUS "TBB not found, will use std::thread")
    set(USE_TBB OFF)
else()
    set(USE_TBB ON)
    message(STATUS "Found TBB: ${TBB_VERSION}")
endif()

# Find Boost (for gzip support)
find_package(Boost COMPONENTS iostreams QUIET)
if(NOT Boost_FOUND)
    message(WARNING "Boost not found, gzip support will be limited")
endif()

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_BINARY_DIR}) # For generated protobuf headers

# Generate protobuf sources
protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS proto/parsimony.proto)

# Source files (excluding main for library)
set(LIB_SOURCES
    src/tree.cpp
    src/mutation.cpp
    src/node.cpp
    src/protobuf_parser.cpp
    src/jsonl_writer.cpp
    src/metadata_reader.cpp
    src/genbank_parser.cpp
    src/utils.cpp
    src/codon_table.cpp
    ${PROTO_SRCS}
)

# Create static library for tests
add_library(taxoniumtools_lib STATIC ${LIB_SOURCES})
target_link_libraries(taxoniumtools_lib
    ${Protobuf_LIBRARIES}
    Threads::Threads
    ZLIB::ZLIB
    yyjson
)

if(USE_TBB)
    target_link_libraries(taxoniumtools_lib TBB::tbb)
    target_compile_definitions(taxoniumtools_lib PRIVATE USE_TBB=1)
endif()

if(Boost_FOUND)
    target_link_libraries(taxoniumtools_lib Boost::iostreams)
    target_compile_definitions(taxoniumtools_lib PRIVATE USE_BOOST=1)
endif()

# Create executable
add_executable(taxoniumtools_cpp src/main.cpp)

# Link libraries
target_link_libraries(taxoniumtools_cpp taxoniumtools_lib)

# Install target
install(TARGETS taxoniumtools_cpp DESTINATION bin)

# Add subdirectories
enable_testing()
add_subdirectory(test)

# Optionally add benchmarks
option(BUILD_BENCHMARKS "Build benchmarks" OFF)
if(BUILD_BENCHMARKS)
    add_subdirectory(benchmark)
endif()