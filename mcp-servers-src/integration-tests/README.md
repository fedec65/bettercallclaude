# MCP Server Integration Tests

Integration test suite for BetterCallClaude MCP servers, validating cross-server workflows and multi-lingual functionality.

## Test Coverage

### Cross-Server Integration Tests
- **BGE Search → Legal Citations**: Validate citations from search results
- **Entscheidsuche → Legal Citations**: Process Swiss Federal Court decisions
- **Multi-Server Workflows**: Complete research workflows combining all servers

### Multi-Lingual Workflow Tests
- German (DE) query workflows
- French (FR) query workflows
- Italian (IT) query workflows
- Cross-language citation conversion (DE ↔ FR ↔ IT ↔ EN)

### Error Handling & Resilience Tests
- Invalid citation handling
- Empty search result handling
- Unsupported language code handling
- Partial citation component handling

### Performance & Scalability Tests
- Batch validation efficiency
- Concurrent multi-lingual conversion performance

## Test Architecture

### Mock MCP Servers
The integration tests use lightweight mock implementations of:
- `MockLegalCitationsMCP`: Simulates legal-citations MCP server tools
- `MockBGESearchMCP`: Simulates bge-search MCP server
- `MockEntscheidSucheMCP`: Simulates entscheidsuche MCP server

### Test Scenarios

#### Scenario 1: Legal Research Workflow
```
Search BGE → Validate Citations → Format Multi-Lingual → Parse Components
```

#### Scenario 2: Cross-Server Validation
```
BGE Search Results → Legal Citations Validation → Language Conversion
```

#### Scenario 3: Multi-Lingual Processing
```
Entscheidsuche (DE/FR/IT) → Legal Citations → Format to All Languages
```

## Running Tests

```bash
# Install dependencies
cd mcp-servers/integration-tests
npm install

# Run all integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Test Results

Expected output:
```
✓ Cross-Server Integration: BGE Search → Legal Citations (2 tests)
✓ Cross-Server Integration: Entscheidsuche → Legal Citations (2 tests)
✓ Complete Workflow: Search → Validate → Format → Parse (2 tests)
✓ Multi-Lingual Workflow Tests (4 tests)
✓ Error Handling and Resilience (4 tests)
✓ Performance and Scalability (2 tests)

Test Files  1 passed (1)
     Tests  16 passed (16)
```

## Integration Points

### With Legal Citations MCP
- `validate_citation`: Citation validation
- `format_citation`: Language-specific formatting
- `convert_citation`: Multi-lingual conversion with all translations
- `parse_citation`: Component extraction and analysis

### With BGE Search MCP
- Search result citation extraction
- Validation of search-returned citations
- Multi-language formatting of results

### With Entscheidsuche MCP
- Decision metadata extraction
- Citation parsing from decision data
- Multi-lingual decision processing

## Test Coverage Metrics

- **Total Tests**: 16 integration tests
- **Workflow Coverage**: 3 major cross-server workflows
- **Language Coverage**: 4 languages (DE/FR/IT/EN)
- **Error Scenarios**: 4 error handling cases
- **Performance Tests**: 2 scalability scenarios

## Mock vs Production

Current tests use **mock MCP servers** for fast, reliable integration testing without external dependencies.

**Production Integration** (Future):
- Replace mocks with actual MCP server connections
- Test with real bundesgericht.ch API responses
- Validate end-to-end network resilience
- Measure real-world performance metrics

## Error Scenarios Tested

1. **Invalid Citations**: Malformed citation strings
2. **Empty Results**: Search returning no matches
3. **Unsupported Languages**: Language codes not in [de, fr, it, en]
4. **Partial Citations**: Missing optional components (Abs., lit., etc.)

## Performance Benchmarks

- **Batch Validation**: 5 citations < 1000ms
- **Concurrent Conversion**: 4 languages < 500ms
- **Complete Workflow**: Search → Parse < 2000ms

## Future Enhancements

- [ ] Real MCP server integration tests
- [ ] Network resilience testing (timeouts, retries)
- [ ] Load testing with 100+ concurrent requests
- [ ] Integration with CI/CD pipeline
- [ ] End-to-end testing with bundesgericht.ch API
- [ ] Performance regression detection
- [ ] Cross-platform testing (macOS/Linux/Windows)

## License

Part of BetterCallClaude Framework v1.0.0-alpha

## Author

Federico Cesconi - BetterCallClaude Project
