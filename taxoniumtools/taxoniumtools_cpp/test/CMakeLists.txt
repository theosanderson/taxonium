# Test configuration
enable_testing()

# Add test executable
add_executable(test_taxonium
    test_basic.cpp
)

# Link with the main library
target_link_libraries(test_taxonium taxoniumtools_lib)

# Register tests with CTest
add_test(NAME BasicTests COMMAND test_taxonium)