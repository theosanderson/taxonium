# Test configuration
enable_testing()

# Add test executable
add_executable(test_taxonium
    test_basic.cpp
)

# Add multi-part GenBank test executable
add_executable(test_genbank_multipart
    test_genbank_multipart.cpp
)

# Add GenBank integration test
add_executable(test_gb_integration
    test_gb_integration.cpp
)

# Link with the main library
target_link_libraries(test_taxonium taxoniumtools_lib)
target_link_libraries(test_genbank_multipart taxoniumtools_lib)
target_link_libraries(test_gb_integration taxoniumtools_lib)

# Register tests with CTest
add_test(NAME BasicTests COMMAND test_taxonium)
add_test(NAME GenbankMultipartTests COMMAND test_genbank_multipart)
add_test(NAME GenbankIntegrationTests COMMAND test_gb_integration)