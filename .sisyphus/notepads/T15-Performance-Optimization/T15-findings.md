# T15: Performance Optimization + Mobile Detection

## Implementation Summary

### Files Created/Modified

1. **`src/lib/performance.ts`** (NEW) - Performance utilities module
   - `isMobileDevice()` - Detects mobile via navigator.userAgent or screen width < 768px
   - `filterModernPlayers(data)` - Filters to players with draft_year >= 1980
   - `debounce(fn, delay)` - 100ms debounce utility for handlers
   - `throttle(fn, delay)` - Throttle utility
   - `createViewportCuller(sigma)` - Viewport-based edge culling
   - `createLODManager(sigma)` - Level-of-detail management
   - `calculateRenderedEdgeReduction()` - Calculates percentage reduction
   - `PerformanceMonitor` class - Tracks render times and FPS
   - `SearchWorker` class - Web Worker for off-main-thread search

2. **`src/components/NetworkGraph.tsx`** (MODIFIED) - Enhanced with:
   - Mobile detection on mount
   - Automatic data filtering on mobile (post-1980 players)
   - Debounced zoom/pan handlers (100ms)
   - LOD management (node size reduction + label hiding at zoom < 0.5)
   - Viewport culling integration

3. **`tests/js/test-performance.test.ts`** (NEW) - 28 TDD tests covering:
   - Mobile detection (4 tests)
   - filterModernPlayers (3 tests)
   - debounce (3 tests)
   - throttle (3 tests)
   - Viewport culling (3 tests)
   - LOD management (3 tests)
   - calculateRenderedEdgeReduction (3 tests)
   - PerformanceMonitor (6 tests)

## Key Implementation Details

### Mobile Detection
```typescript
// Uses both userAgent and screen width for detection
export function isMobileDevice(): boolean {
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  if (isMobileUA) return true;
  return window.innerWidth < 768;
}
```

### Viewport Culling
- Uses camera position and container dimensions to calculate visible bounds
- Only nodes within the projected viewport are returned
- Edges filtered to only those connecting visible nodes

### Level of Detail (LOD)
- HIGH level (zoom >= 0.75): Full node size, labels shown
- MEDIUM level (0.5 <= zoom < 0.75): 75% node size
- LOW level (zoom < 0.5): 50% node size, labels hidden

### Debounced Handlers
- 100ms debounce on zoom/pan events
- Prevents re-render spam during rapid interactions

## Test Results
- 28/28 tests passing
- 149/149 total project tests passing

## Notes
- Web Worker implemented for search filtering (SearchWorker class)
- PerformanceMonitor tracks actual render times for debugging
- SigmaInstance interface adapted for sigma v3 API compatibility
