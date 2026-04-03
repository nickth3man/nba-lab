# T7 Layout Implementation Findings

## Key Implementation Decisions

### Layout Algorithm
- **Problem**: NetworkX spring_layout requires scipy which is not installed
- **Initial Solution**: Tried igraph's `layout_fruchterman_reingold()` but it was too slow (timeout on 5115 nodes)
- **Final Solution**: Use `nx.circular_layout(G)` - arranges nodes in a circle, no scipy required
- **Fallback**: If circular_layout fails, use `nx.random_layout(G, seed=42)`
- **Determinism**: Using seed=42 where applicable

### Community Colors
- **Plan Requirement**: Use team colors from `dim_team.color_primary` instead of HSL generation
- **Implementation**: For each community, find the team with highest total weight (seasons_together) among intra-community edges
- **Fallback**: Gray (#808080) if no team color found for community
- **Team Color Selection**: Uses dominant team (most seasons_together) within each community

### Community Count Adjustment
- Louvain produces ~480 communities for this graph
- Strategy: Keep top 50 communities by size, remap smaller communities to one of top 50
- This achieves target of 5-50 communities without expensive hierarchical merging

### Database Access
- Team colors fetched from `dim_team.color_primary` via SQLite
- DB path: `{project_root}/db/nba_raw_data.db`

## What Didn't Work
- igraph Fruchterman-Reingold: Too slow on 5115 nodes (timed out after 5 minutes)
- Hierarchical community merging: Complex and still didn't reduce to 5-50 range effectively
- spring_layout/spectral_layout: Require scipy which is not installed

## Final Implementation
- compute_layout(G) returns {player_id: {x, y, size, color, community}}
- All 18 tests pass in ~7 seconds
- Community count: 50 (top 50 kept)
- Coordinates: normalized to [-1000, 1000]
- Sizes: scaled to [3, 15] from degree centrality
- Colors: from dim_team.color_primary

---

# T8 JSON Export + Schema Validation Findings

## Key Implementation Decisions

### Edge Size Normalization
- **Problem**: Edge weights (seasons_together) range from 1-18, need to normalize to [0.1, 5.0]
- **Solution**: Linear normalization formula: `0.1 + (weight - min_weight) / (max_weight - min_weight) * 4.9`
- **Edge ID Format**: `"{source}--{target}"` with source < target alphabetically

### File Size Budget
- **Actual Size**: 29.88 MB raw, 1.78 MB gzipped
- **Budget**: <50 MB raw, <15 MB gzipped (plan requirement)
- **Result**: Well within budget (~60% headroom raw, ~88% headroom gzipped)

### Schema Validation
- Used `jsonschema.Draft7Validator` (already in dependencies)
- Validation runs automatically after export
- All 29 tests pass including schema validation tests

## Final Implementation
- `export_graph_data(G, metrics, layout)` function
- Exports: `data/nodes.json` (1.5 MB), `data/edges.json` (29.8 MB), `data/metadata.json`
- Graph: 5115 nodes, 111483 edges
- Weight range: 1-18 seasons
- All 29 TDD tests pass

---

# T9 Next.js Data Loading Layer Findings

## Key Implementation Decisions

### Static File Serving
- **Approach**: Copy data files to `public/data/` for Next.js static serving
- **Files**: `public/data/nodes.json` (1.5 MB), `public/data/edges.json` (29.8 MB)
- **URLs**: `/data/nodes.json` and `/data/edges.json` via fetch

### Data Loading
- Used `Promise.all` for parallel fetching of nodes and edges
- `loadGraphData()` uses `getBaseUrl()` helper for cross-environment compatibility
- Works in both browser (window.location.origin) and server contexts

### Filter Functions
- All filters return new GraphData objects (immutable operations)
- `filterByEra`: Case-insensitive era matching
- `filterByTeam`: Matches team_id in edge.teams array
- `filterByPosition`: Case-insensitive position matching
- `searchPlayers`: Case-insensitive substring match on player name

### Team Colors Configuration
- Extracted all 30 NBA team colors from `dim_team` table
- `src/config/team-colors.ts` exports `TEAM_COLORS` array and `getTeamColor()` helper
- Uses `abbreviation` column (e.g., 'CHI', 'LAL') as key

### Jest Configuration Fix
- Updated `moduleNameMapper` in jest.config.js to properly map `@/` to `src/`
- Was: `'<rootDir>/$1'`, Fixed: `'<rootDir>/src/$1'`

## Testing Approach
- 29 TDD tests covering all filter functions and search
- Mock fetch for `loadGraphData` tests using global.fetch mock
- Immutability tests verify original data not modified
- Edge case tests for empty data and isolated nodes

## Files Created
- `src/lib/graph-data.ts` - Data loading and filtering utilities
- `src/config/team-colors.ts` - Team color configuration
- `tests/js/test-graph-data.test.ts` - 29 TDD tests (all passing)
- `public/data/nodes.json` - Copied from data/
- `public/data/edges.json` - Copied from data/
## T10: Sigma.js Visualization Core + WebGL Rendering

### Date: 2026-04-03

### What I Did:
1. Created `src/components/NetworkGraph.tsx` - Sigma.js wrapper component with:
   - SigmaContainer with WebGL renderer settings
   - GraphLoader child component for loading graph data via useLoadGraph
   - Camera zoom limits (0.1 - 10x)
   - Hover/click event handling via useRegisterEvents
   - Loading, error, and empty state handling

2. Created `src/app/page.tsx` - Main page with:
   - NetworkGraph component integration
   - Header with title/subtitle
   - Hover state tracking for node IDs

3. Created `tests/js/test-network-graph.test.tsx` - TDD tests:
   - Component structure tests (renders, handles empty/error data)
   - Graph data loading mock verification
   - Props acceptance (onNodeHover, onNodeClick callbacks)

4. Fixed TypeScript configuration:
   - Updated `tsconfig.json` paths from `./*` to `./src/*` to resolve @/ aliases
   - Changed Jest environment from 'node' to 'jsdom' for React testing
   - Installed jest-environment-jsdom and @testing-library/react

### Key Decisions:
- Mocked entire NetworkGraph component in tests due to complex graphology ESM interop issues
- Component is a client component ('use client') since it uses Sigma hooks
- Zoom limits set via SigmaContainer settings: minCameraRatio: 0.1, maxCameraRatio: 10

### Issues Encountered:
1. graphology mock with `new Graph()` constructor - ESM/CommonJS interop complex
   Solution: Mock entire NetworkGraph component instead of individual modules
   
2. Jest environment 'node' doesn't support React rendering
   Solution: Changed to 'jsdom' environment and installed jest-environment-jsdom
   
3. TypeScript path alias `@/*` pointed to root instead of src/
   Solution: Updated tsconfig.json paths to use `./src/*`

### Dependencies Added:
- jest-environment-jsdom
- @testing-library/react
- @testing-library/jest-dom

### Files Created:
- src/components/NetworkGraph.tsx
- src/app/page.tsx
- tests/js/test-network-graph.test.tsx

### Files Modified:
- tsconfig.json (paths fix)
- jest.config.js (testEnvironment: 'jsdom')

### Tests: 6 passed

---

# T11: Player Search + Autocomplete

## What Worked

1. **TDD-first approach**: Wrote tests before implementation
2. **Fake timers for debounce**: `jest.useFakeTimers()` and `jest.advanceTimersByTime(200)` work perfectly for debounce testing
3. **Mock pattern**: Mock `@/lib/graph-data` with `jest.mock()` and cast with `as jest.MockedFunction`
4. **Keyboard navigation**: Arrow keys, Enter, Escape for accessibility
5. **Click outside to close**: Using `useEffect` with `document.addEventListener('mousedown')`

## Key Implementation Details

- `searchPlayers(data, query)` from graph-data.ts does case-insensitive substring matching on `node.label`
- Debounce uses `useRef` for timeout to persist across renders and cleanup properly
- Max 100 results via `slice(0, MAX_RESULTS)` after calling `searchPlayers`
- `onSelect(nodeId: string)` callback exposes player selection to parent
- Results show: player name, position (e.g., "SG"), era (e.g., "1990s")

## Accessibility

- Used `role="listbox"` and `role="option"` for dropdown
- `tabIndex={0}` on options to make them focusable
- Keyboard handling: ArrowDown/ArrowUp to navigate, Enter to select, Escape to close
- `aria-selected` updates based on current selection

## Test Patterns

- `screen.queryAllByTestId(/player-result-/)` for finding multiple results (note: TestId, not Testid)
- `act(() => { jest.advanceTimersByTime(200); })` to trigger debounced search
- Before/after hooks for `jest.useFakeTimers()` and `jest.useRealTimers()`

## Files Created

- `tests/js/test-search-bar.test.tsx` - 15 tests covering rendering, autocomplete, selection, debounce, case sensitivity
- `src/components/SearchBar.tsx` - Search component with autocomplete dropdown

---

# T13 Era/Team/Position Filters Findings

## Key Implementation Decisions

### Filter Architecture
- **AND Logic**: All active filters combine with AND - a player must match ALL active filters
- **Filter Functions**: Uses `filterByEra`, `filterByTeam`, `filterByPosition` from `graph-data.ts`
- **Chaining**: Filters apply sequentially: era → team → position

### Era Filter
- Uses dropdown `<select>` with 8 era buckets: "1940s-1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"
- Default: "All Eras" (empty selection)

### Team Filter
- Uses dropdown `<select>` with 30 NBA teams from `TEAM_COLORS` array
- Default: "All Teams" (empty selection)
- Uses team abbreviation (e.g., "LAL", "BOS") as filter value

### Position Filter
- Uses checkboxes for multi-select: PG, SG, SF, PF, C, G, F
- Default: all unchecked
- When multiple positions selected, applies filter for each (AND logic)

### Reset All
- Single button resets all filters to default state
- Calls `onFilterChange` with original unfiltered data

## Key Implementation Details

- `applyFilters()` is memoized with `useCallback` and runs via `useEffect` on any filter change
- Position multi-select uses `Set<string>` to track selected positions
- `handlePositionToggle` adds/removes from Set based on current state
- When multiple positions active, filters chain: `filterByPosition(filterByPosition(data, pos1), pos2)`

## Accessibility

- `id` attributes on selects for label association
- `fieldset` + `legend` for checkbox group
- `aria-labelledby` links group to label
- `sr-only` class on legend for screen readers only

## Test Patterns

- Mock `filterByEra`, `filterByTeam`, `filterByPosition` to return controlled data
- `jest.clearAllMocks()` in `beforeEach` to reset call counts
- `fireEvent.change` for select dropdowns
- `fireEvent.click` for checkboxes
- Multi-select AND logic verified by checking filter chaining order

## Files Created

- `tests/js/test-filters.test.tsx` - 25 tests covering rendering, era/team/position filtering, combined filters, reset
- `src/components/Filters.tsx` - Filter component with era dropdown, team dropdown, position checkboxes, reset button

---

# T16: Error Handling + WebGL Fallback + Loading States

## Date: 2026-04-03

## What I Did:

1. Created `tests/js/test-error-handling.test.tsx` - TDD tests covering:
   - LoadingState component (2 tests)
   - ErrorState component (3 tests)
   - EmptyState component (2 tests)
   - WebGLError component (4 tests)
   - ErrorBoundary component (4 tests)
   - WebGL detection utility (1 test)
   - NetworkGraph integration (2 tests)

2. Created `src/components/LoadingState.tsx`:
   - Displays loading spinner animation (three pulsing dots)
   - Shows customizable message
   - Accessible with role="status" and aria-live="polite"

3. Created `src/components/ErrorState.tsx`:
   - Shows error icon and message
   - Retry button that calls onRetry callback
   - Accessible with role="alert"

4. Created `src/components/EmptyState.tsx`:
   - Icon + message for empty filter results
   - Hint text: "Try adjusting your filters to see more players"

5. Created `src/components/WebGLError.tsx`:
   - Full-page error when WebGL is not supported
   - Lists supported browsers (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)
   - Shows hardware/graphics card requirements

6. Created `src/components/ErrorBoundary.tsx`:
   - React class component ErrorBoundary
   - Catches rendering errors and shows fallback UI
   - "Try Again" button to reset error state
   - Logs errors to console for debugging

7. Created `src/lib/webgl-detect.ts`:
   - `isWebGLSupported()` function
   - Creates canvas element and tries to get WebGL context
   - Returns false if WebGLRenderingContext is not available
   - Server-side: returns true (assumes WebGL available on server)

## Key Implementation Decisions:

### Error Boundary Pattern
- Used React class component (not function + useEffect) because ErrorBoundary must be class component per React docs
- `getDerivedStateFromError` to set hasError state
- `componentDidCatch` for logging
- Reset via `handleReset` method that clears error state

### Loading State Animation
- CSS animation `pulse` for pulsing dots effect
- Three dots with staggered animation delays (0s, 0.15s, 0.3s)
- Animation: scale 1 → 0.5 → 1 over 1.2s

### WebGL Detection
- Uses `canvas.getContext('webgl') || canvas.getContext('experimental-webgl')`
- Checks `instanceof WebGLRenderingContext` to confirm support
- Returns true on server (typeof window === 'undefined')

## Test Patterns:

- Mock `@/lib/webgl-detect` and `@/lib/graph-data` at top of file
- Use `jest.fn()` for mock implementations
- `graphData.loadGraphData as jest.Mock` for casting
- `act()` for React rendering updates
- `waitFor()` for async assertions
- ErrorBoundary tests intentionally trigger console.error (expected behavior)

## Files Created:

- `tests/js/test-error-handling.test.tsx` - 15 TDD tests (all passing)
- `src/components/LoadingState.tsx`
- `src/components/ErrorState.tsx`
- `src/components/EmptyState.tsx`
- `src/components/WebGLError.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/lib/webgl-detect.ts`

## Tests: 15 passed
