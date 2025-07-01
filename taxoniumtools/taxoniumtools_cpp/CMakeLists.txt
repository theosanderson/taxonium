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
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -Wall -Wextra -Wpedantic")
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -march=native")

# Find required packages
find_package(Protobuf REQUIRED)
find_package(Threads REQUIRED)
find_package(ZLIB REQUIRED)

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

# Source files
set(SOURCES
    src/main.cpp
    src/tree.cpp
    src/mutation.cpp
    src/node.cpp
    src/protobuf_parser.cpp
    src/jsonl_writer.cpp
    src/metadata_reader.cpp
    src/genbank_parser.cpp
    src/utils.cpp
    ${PROTO_SRCS}
)

# Create executable
add_executable(taxoniumtools_cpp ${SOURCES})

# Link libraries
target_link_libraries(taxoniumtools_cpp
    ${Protobuf_LIBRARIES}
    Threads::Threads
    ZLIB::ZLIB
)

if(USE_TBB)
    target_link_libraries(taxoniumtools_cpp TBB::tbb)
    target_compile_definitions(taxoniumtools_cpp PRIVATE USE_TBB=1)
endif()

if(Boost_FOUND)
    target_link_libraries(taxoniumtools_cpp Boost::iostreams)
    target_compile_definitions(taxoniumtools_cpp PRIVATE USE_BOOST=1)
endif()

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