# NBA Teammate Network Visualization

## TL;DR

> **Quick Summary**: Build an interactive network visualization of all NBA players (1946-2026) who were teammates — nodes are players, edges represent shared tenure with team/duration attributes. Pre-compute graph in Python (SQL self-join → NetworkX metrics → JSON), serve via Next.js SSG, render with Sigma.js v3 + WebGL.
>
> **Deliverables**:
> - Python pre-computation pipeline (SQL extraction, graph construction, metrics, JSON export)
> - Next.js static site with Sigma.js v3 WebGL network visualization
> - Interactive features: search, hover tooltips, click drill-down, shortest-path finder, era/team/position filters
> - Pre-computed centrality metrics, community detection, node positions
> - Vercel/Netlify deployment config
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: T1 → T2 → T3 → T5 → T7 → T8 → T9 → T10 → T12 → T15 → T18 → F1-F4

---

## Context

### Original Request
"I want to use the database in db/ to create a network of all players who were on a team at the same time, and what team, and how long they were on that team, and visualize it."

### Interview Summary
**Key Discussions**:
- Scope: All 80 seasons (1946-47 to 2025-26), ~5,115 players, ~30 teams, 23,428 roster entries
- Test strategy: TDD (tests first) — includes test infrastructure setup
- Deployment: Static site on Vercel/Netlify (Next.js SSG)
- Stack: Python (pre-computation) → Next.js (frontend) → Sigma.js v3 + Graphology + WebGL (rendering)

**Research Findings**:
- Oracle confirmed SQL self-join with CTE for date overlap computation, indexing strategy, graph data model
- Librarian confirmed Sigma.js v3 + WebGL handles 100K+ edges at 60fps; vis-network/Cytoscape cap at ~5K on Canvas
- ~60,000-100,000 unique teammate edges after self-join and aggregation
- Two-phase layout: Louvain community detection → ForceAtlas2, pre-computed in Python

### Metis Review
**Identified Gaps** (addressed):
- Data validation task added before graph computation
- Minimum overlap threshold (14 days) to filter noise from brief contracts
- JSON schema locked before implementation
- Performance budget: <50MB gzipped JSON, <3s initial render, >30 FPS at 1K visible edges
- Edge case handling: mid-season trades, team relocations, isolated nodes, WebGL fallback
- TDD scope limited to SQL/Python/data transformation — no snapshot tests for visualization

---

## Work Objectives

### Core Objective
Create an interactive, performant network visualization showing every NBA teammate relationship across 80 seasons of history, with search, filtering, and path-finding capabilities.

### Concrete Deliverables
- `scripts/build_graph.py` — Python pre-computation pipeline (SQL → graph → JSON)
- `data/nodes.json`, `data/edges.json`, `data/metrics.json` — Pre-computed graph data
- `src/app/page.tsx` — Next.js page with Sigma.js visualization
- `src/components/NetworkGraph.tsx` — Sigma.js wrapper with interactions
- `src/components/SearchBar.tsx` — Player search with autocomplete
- `src/components/Filters.tsx` — Era, team, position filters
- `src/components/ShortestPath.tsx` — Player-to-player path finder
- `src/components/PlayerTooltip.tsx` — Hover tooltip with team history
- `src/lib/graph-data.ts` — Data loading and filtering utilities
- `vercel.json` / `netlify.toml` — Deployment config

### Definition of Done
- [ ] `python scripts/build_graph.py` completes successfully, produces valid JSON
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run test` passes all tests (100% of TDD tests)
- [ ] `npm run dev` → browser opens, network renders, search works, filters work, shortest path works
- [ ] Deployed to Vercel/Netlify, accessible via URL

### Must Have
- Full 80-season data (1946-2026)
- WebGL rendering (Sigma.js v3) — no Canvas fallback as primary
- Search, hover tooltips, click drill-down
- Era/team/position filters
- Shortest path between any two players (pre-computed BFS)
- Community detection coloring (Louvain algorithm)
- TDD for all Python and data transformation code

### Must NOT Have (Guardrails)
- NO player career stats visualization (teammate relationships only)
- NO team win-loss overlays
- NO live data integration or external API calls
- NO user accounts, saved searches, or backend services
- NO export to PNG/CSV
- NO mobile native app
- NO Canvas renderer (vis-network, Cytoscape, D3 SVG)
- NO on-the-fly shortest path computation (must be pre-computed)
- NO external API for team colors (manual hex config only)
- NO snapshot tests for visualization (fragile, meaningless)
- Total JSON payload MUST NOT exceed 50MB gzipped
- Minimum 14-day overlap required to count as teammate edge

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO — will be set up in T1
- **Automated tests**: TDD (tests first)
- **Framework**: Jest (Python: pytest, JavaScript: Jest)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.

- **Python scripts**: Bash (python + pytest) — Run tests, assert outputs
- **Next.js build**: Bash (npm run build, npm run test) — Zero errors
- **Frontend/UI**: Playwright — Navigate, search, filter, interact, assert DOM, screenshot
- **Data validation**: Bash (jq, python) — Validate JSON schema, check edge counts

Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — infrastructure + data foundation):
├── T1: Test infrastructure + project scaffolding [quick]
├── T2: Database validation + data quality checks [quick]
├── T3: Teammate overlap SQL + materialized table [quick]
└── T4: Graph schema definition + JSON type contracts [quick]

Wave 2 (After Wave 1 — Python graph computation, MAX PARALLEL):
├── T5: Graph construction (NetworkX, nodes + edges) [deep]
├── T6: Centrality metrics computation [unspecified-high]
├── T7: Community detection + ForceAtlas2 layout [deep]
└── T8: JSON export + schema validation [quick]

Wave 3 (After Wave 2 — Next.js frontend):
├── T9: Next.js project setup + data loading layer [quick]
├── T10: Sigma.js visualization core + WebGL rendering [deep]
├── T11: Player search + autocomplete [quick]
├── T12: Hover tooltips + click drill-down [visual-engineering]
├── T13: Era/team/position filters [visual-engineering]
└── T14: Shortest path finder UI [unspecified-high]

Wave 4 (After Wave 3 — polish + deployment):
├── T15: Performance optimization + mobile detection [unspecified-high]
├── T16: Error handling + WebGL fallback + loading states [quick]
├── T17: Deployment config (Vercel/Netlify) [quick]
└── T18: Final integration test + end-to-end QA [deep]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

- **T1**: — — T2-T4, T9, T10
- **T2**: T1 — T3, T5
- **T3**: T1, T2 — T5
- **T4**: T1 — T5, T8, T9
- **T5**: T2, T3, T4 — T6, T7, T8
- **T6**: T5 — T8
- **T7**: T5 — T8
- **T8**: T4, T5, T6, T7 — T9, T10
- **T9**: T1, T4, T8 — T10-T14
- **T10**: T1, T9 — T12, T13, T15
- **T11**: T9 — T14
- **T12**: T9, T10 — T15
- **T13**: T9, T10 — T15
- **T14**: T9, T11 — T18
- **T15**: T10, T12, T13 — T18
- **T16**: T10 — T18
- **T17**: T15, T16 — T18
- **T18**: T14, T15, T16, T17 — F1-F4

### Agent Dispatch Summary

- **Wave 1**: **4** — T1→`quick`, T2→`quick`, T3→`quick`, T4→`quick`
- **Wave 2**: **4** — T5→`deep`, T6→`unspecified-high`, T7→`deep`, T8→`quick`
- **Wave 3**: **6** — T9→`quick`, T10→`deep`, T11→`quick`, T12→`visual-engineering`, T13→`visual-engineering`, T14→`unspecified-high`
- **Wave 4**: **4** — T15→`unspecified-high`, T16→`quick`, T17→`quick`, T18→`deep`
- **FINAL**: **4** — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

- [x] 1. Test Infrastructure + Project Scaffolding

  **What to do**:
  - Create project directory structure: `scripts/`, `data/`, `src/`, `tests/python/`, `tests/js/`
  - Initialize Python virtual environment with `pytest`, `networkx`, `python-louvain`, `igraph`
  - Initialize Next.js project: `npx create-next-app@latest` with TypeScript, App Router
  - Install frontend deps: `sigma`, `graphology`, `graphology-layout-forceatlas2`, `@react-sigma/core`
  - Create `pytest.ini` with test discovery for `tests/python/`
  - Create `jest.config.js` for `tests/js/`
  - Write first failing test: `tests/python/test_build_graph.py::test_db_connection` — asserts SQLite DB is accessible
  - Write first failing test: `tests/js/test-graph-data.test.ts` — asserts graph data module loads
  - Make tests pass with minimal implementations

  **Must NOT do**:
  - NO actual graph computation yet
  - NO visualization code
  - NO production build config

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard scaffolding, test setup, dependency installation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T2, T3, T4, T9, T10
  - **Blocked By**: None (can start immediately)

  **References**:
  - `db/nba_raw_data.db` — SQLite database to connect to
  - Official docs: `https://docs.pytest.org/` — pytest configuration
  - Official docs: `https://jestjs.io/docs/getting-started` — Jest setup

  **Acceptance Criteria**:
  - [ ] `pytest tests/python/test_build_graph.py -v` → PASS (1 test)
  - [ ] `npx jest tests/js/test-graph-data.test.ts` → PASS (1 test)
  - [ ] `python -c "import networkx; import igraph; print('OK')"` → no import errors
  - [ ] `npm run dev` → Next.js dev server starts on port 3000

  **QA Scenarios**:

  ```
  Scenario: Python test infrastructure works
    Tool: Bash
    Preconditions: Virtual environment created, dependencies installed
    Steps:
      1. Run: python -m pytest tests/python/ -v
      2. Assert: output contains "1 passed" and zero failures
    Expected Result: pytest discovers and passes the placeholder test
    Failure Indicators: "ModuleNotFoundError", "no tests ran", "FAILED"
    Evidence: .sisyphus/evidence/task-1-pytest-setup.txt

  Scenario: Next.js dev server starts
    Tool: Bash
    Preconditions: Next.js project initialized
    Steps:
      1. Run: npm run dev & (background)
      2. Wait 5s, then: curl -s http://localhost:3000 | head -20
      3. Assert: response contains "<!" (HTML doctype)
      4. Kill dev server
    Expected Result: Dev server responds with HTML on port 3000
    Evidence: .sisyphus/evidence/task-1-nextjs-dev.txt
  ```

  **Evidence to Capture**:
  - [ ] pytest output saved to `.sisyphus/evidence/task-1-pytest-setup.txt`
  - [ ] Next.js dev server response saved to `.sisyphus/evidence/task-1-nextjs-dev.txt`

  **Commit**: YES (groups with T2-T4)
  - Message: `chore(nba-network): scaffold test infrastructure and project structure`
  - Files: `pytest.ini`, `jest.config.js`, `package.json`, `tests/`, `scripts/`, `src/`
  - Pre-commit: `pytest tests/python/ -v && npx jest --passWithNoTests`

- [x] 2. Database Validation + Data Quality Checks

  **What to do**:
  - Write Python script `scripts/validate_db.py` that runs data quality checks
  - Test (TDD first): `tests/python/test_validate_db.py` with assertions for each check
  - Checks to implement:
    1. `fact_roster` has no duplicate `(player_id, team_id, season_id)` entries
    2. All `player_id` values in `fact_roster` exist in `dim_player`
    3. All `team_id` values in `fact_roster` exist in `dim_team`
    4. All `season_id` values in `fact_roster` exist in `dim_season`
    5. No rows where `end_date < start_date` (bad data)
    6. Date granularity check: sample 10 rows, confirm dates are actual calendar dates
    7. Team relocation check: verify team_id continuity across franchise moves
    8. Count total roster entries, unique players, unique teams, season range
  - Output: validation report to `data/validation_report.json`

  **Must NOT do**:
  - NO graph computation
  - NO data modification (read-only queries only)
  - NO fixing data issues (just report them)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward SQL validation queries, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4)
  - **Blocks**: T3, T5
  - **Blocked By**: T1

  **References**:
  - `db/nba_raw_data.db` — SQLite database
  - Schema: `fact_roster`, `dim_player`, `dim_team`, `dim_season` tables
  - `tests/python/test_build_graph.py` — existing test pattern to follow

  **Acceptance Criteria**:
  - [ ] `python scripts/validate_db.py` runs all 8 checks without errors
  - [ ] `data/validation_report.json` is valid JSON with pass/fail per check
  - [ ] `pytest tests/python/test_validate_db.py -v` → PASS (8 tests)
  - [ ] Report includes: total roster count, unique player count, unique team count, season range

  **QA Scenarios**:

  ```
  Scenario: All validation checks pass
    Tool: Bash
    Preconditions: DB file exists at db/nba_raw_data.db
    Steps:
      1. Run: python scripts/validate_db.py
      2. Assert: exit code 0
      3. Run: python -c "import json; r=json.load(open('data/validation_report.json')); print('Valid')"
    Expected Result: All 8 validation checks pass, report is valid JSON
    Failure Indicators: Any check returns "fail", JSON parse error, exit code != 0
    Evidence: .sisyphus/evidence/task-2-validation-report.json

  Scenario: Validation catches bad data (negative test)
    Tool: Bash
    Preconditions: Create a temporary test DB with known bad data
    Steps:
      1. Create temp DB with one row where end_date < start_date
      2. Run: python scripts/validate_db.py --db-path temp_test.db
      3. Assert: check 5 reports "fail" with details
    Expected Result: Validation correctly identifies the bad row
    Evidence: .sisyphus/evidence/task-2-negative-test.txt
  ```

  **Evidence to Capture**:
  - [ ] Validation report saved to `.sisyphus/evidence/task-2-validation-report.json`
  - [ ] Negative test output saved to `.sisyphus/evidence/task-2-negative-test.txt`

  **Commit**: YES (groups with T1, T3, T4)
  - Message: `feat(nba-network): add database validation and data quality checks`
  - Files: `scripts/validate_db.py`, `tests/python/test_validate_db.py`, `data/validation_report.json`
  - Pre-commit: `pytest tests/python/test_validate_db.py -v`

- [x] 3. Teammate Overlap SQL + Materialized Table

  **What to do**:
  - Write TDD test first: `tests/python/test_teammate_sql.py` with known fixture data
  - Create `scripts/extract_teammates.py` that:
    1. Creates index `idx_roster_team_season_player ON fact_roster(team_id, season_id, player_id)`
    2. Runs the self-join CTE query to compute teammate overlaps
    3. Applies minimum 14-day overlap filter
    4. Creates materialized table `teammate_overlaps` in the DB
    5. Creates aggregated view `v_teammate_edges` (one edge per player-pair)
    6. Creates per-team view `v_teammate_edges_by_team` (one edge per player-pair-team)
  - SQL query (the core):
    ```sql
    WITH normalized AS (
        SELECT player_id, team_id, season_id, start_date,
               COALESCE(end_date, DATE('now')) AS end_date
        FROM fact_roster
    )
    SELECT
        a.player_id AS player_a_id,
        b.player_id AS player_b_id,
        a.team_id, a.season_id,
        MAX(a.start_date, b.start_date) AS overlap_start,
        MIN(a.end_date, b.end_date)     AS overlap_end,
        CAST(JULIANDAY(MIN(a.end_date, b.end_date))
           - JULIANDAY(MAX(a.start_date, b.start_date)) AS INTEGER) AS overlap_days
    FROM normalized a
    JOIN normalized b
        ON a.team_id = b.team_id
       AND a.season_id = b.season_id
       AND a.player_id < b.player_id
    WHERE MAX(a.start_date, b.start_date) < MIN(a.end_date, b.end_date)
      AND CAST(JULIANDAY(MIN(a.end_date, b.end_date))
           - JULIANDAY(MAX(a.start_date, b.start_date)) AS INTEGER) >= 14
    ```
  - Test with fixture: create temp DB with 3 players on same team, verify correct pairs generated

  **Must NOT do**:
  - NO graph construction (that's T5)
  - NO JSON export (that's T8)
  - NO modifying original DB (use CREATE TABLE IF NOT EXISTS for materialized table)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-defined SQL query, straightforward Python wrapper
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4)
  - **Blocks**: T5
  - **Blocked By**: T1, T2

  **References**:
  - `db/nba_raw_data.db` — SQLite database with fact_roster table
  - `scripts/validate_db.py` (T2) — pattern for DB access
  - Oracle agent findings — self-join query design and indexing strategy

  **Acceptance Criteria**:
  - [ ] `python scripts/extract_teammates.py` completes in <30 seconds
  - [ ] `teammate_overlaps` table exists with correct columns
  - [ ] `v_teammate_edges` view returns aggregated player-pair edges
  - [ ] `pytest tests/python/test_teammate_sql.py -v` → PASS (fixture-based tests)
  - [ ] Edge count is in expected range: 60,000-100,000

  **QA Scenarios**:

  ```
  Scenario: Self-join produces correct teammate pairs
    Tool: Bash
    Preconditions: Extract script has run
    Steps:
      1. Run: sqlite3 db/nba_raw_data.db "SELECT COUNT(*) FROM teammate_overlaps;"
      2. Assert: count > 0 and within expected range
      3. Run: sqlite3 db/nba_raw_data.db "SELECT COUNT(*) FROM teammate_overlaps WHERE player_a_id >= player_b_id;"
      4. Assert: count = 0 (no duplicates or self-loops)
      5. Run: sqlite3 db/nba_raw_data.db "SELECT MIN(overlap_days) FROM teammate_overlaps;"
      6. Assert: min overlap_days >= 14 (filter working)
    Expected Result: Correct pair count, no duplicates, minimum overlap enforced
    Evidence: .sisyphus/evidence/task-3-sql-output.txt

  Scenario: Known teammate pair exists (LeBron + Wade on MIA 2010-14)
    Tool: Bash
    Preconditions: Extract script has run
    Steps:
      1. Run: sqlite3 db/nba_raw_data.db "SELECT * FROM v_teammate_edges_by_team WHERE player_a_id = '2544' AND player_b_id = '2548' AND team_id = '1610612748';"
      2. Assert: at least one row returned with seasons covering 2010-11 through 2013-14
    Expected Result: LeBron-Wade MIA edge exists with correct seasons
    Evidence: .sisyphus/evidence/task-3-known-pair.txt
  ```

  **Evidence to Capture**:
  - [ ] SQL output saved to `.sisyphus/evidence/task-3-sql-output.txt`
  - [ ] Known pair verification saved to `.sisyphus/evidence/task-3-known-pair.txt`

  **Commit**: YES (groups with T1, T2, T4)
  - Message: `feat(nba-network): extract teammate overlaps via SQL self-join`
  - Files: `scripts/extract_teammates.py`, `tests/python/test_teammate_sql.py`
  - Pre-commit: `pytest tests/python/test_teammate_sql.py -v`

- [x] 4. Graph Schema Definition + JSON Type Contracts

  **What to do**:
  - Write TDD test first: `tests/python/test_graph_schema.py` and `tests/js/test-graph-schema.test.ts`
  - Define TypeScript interfaces in `src/lib/graph-types.ts` (NodeData, EdgeData, TeamTenure, GraphData)
  - Define JSON schema files: `schemas/nodes.schema.json`, `schemas/edges.schema.json`
  - Write validation function `scripts/validate_json_schema.py` that validates JSON against schema
  - Write test fixtures: small sample nodes/edges JSON for schema validation tests

  **Must NOT do**:
  - NO actual graph data generation (that's T5-T7)
  - NO visualization code

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definitions and schema files, no complex logic
  - **Skills**: [`typescript-best-practices`]
    - `typescript-best-practices`: For proper TypeScript interface design and type safety

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3)
  - **Blocks**: T5, T8, T9
  - **Blocked By**: T1

  **References**:
  - Official docs: `https://json-schema.org/` — JSON Schema specification
  - Oracle findings — graph data model recommendations
  - `src/lib/` — Next.js project lib directory (created in T1)

  **Acceptance Criteria**:
  - [ ] `src/lib/graph-types.ts` exports all interfaces with zero TypeScript errors
  - [ ] `schemas/nodes.schema.json` and `schemas/edges.schema.json` are valid JSON Schema
  - [ ] `pytest tests/python/test_graph_schema.py -v` → PASS (schema validation tests)
  - [ ] `npx jest tests/js/test-graph-schema.test.ts` → PASS (TypeScript type tests)
  - [ ] Sample fixture data validates against both schemas

  **QA Scenarios**:

  ```
  Scenario: JSON schema validates correct data
    Tool: Bash
    Preconditions: Schema files and fixture data exist
    Steps:
      1. Create sample nodes.json with 3 nodes matching NodeData interface
      2. Run: python scripts/validate_json_schema.py data/sample_nodes.json schemas/nodes.schema.json
      3. Assert: exit code 0, output "Valid"
    Expected Result: Sample data passes schema validation
    Evidence: .sisyphus/evidence/task-4-schema-valid.txt

  Scenario: JSON schema rejects invalid data
    Tool: Bash
    Preconditions: Schema files exist
    Steps:
      1. Create invalid nodes.json (missing required field "label")
      2. Run: python scripts/validate_json_schema.py data/invalid_nodes.json schemas/nodes.schema.json
      3. Assert: exit code 1, output contains error message about missing field
    Expected Result: Invalid data is rejected with clear error
    Evidence: .sisyphus/evidence/task-4-schema-invalid.txt
  ```

  **Evidence to Capture**:
  - [ ] Schema validation output saved to `.sisyphus/evidence/task-4-schema-valid.txt`
  - [ ] Schema rejection output saved to `.sisyphus/evidence/task-4-schema-invalid.txt`

  **Commit**: YES (groups with T1-T3)
  - Message: `feat(nba-network): define graph schema and JSON type contracts`
  - Files: `src/lib/graph-types.ts`, `schemas/nodes.schema.json`, `schemas/edges.schema.json`, `scripts/validate_json_schema.py`, `tests/`
  - Pre-commit: `pytest tests/python/test_graph_schema.py -v && npx jest tests/js/test-graph-schema.test.ts`

- [x] 5. Graph Construction (NetworkX Nodes + Edges)

  **What to do**:
  - Write TDD test first: `tests/python/test_graph_construction.py`
  - Create `scripts/build_graph.py` function `build_graph()` that:
    1. Reads `teammate_overlaps` table from SQLite
    2. Reads `dim_player` for node attributes (full_name, position, is_active, hof, draft_year)
    3. Reads `dim_team` for team attributes (abbreviation, full_name, color_primary)
    4. Creates NetworkX Graph, adds nodes with attributes
    5. Aggregates overlaps into edges: one edge per (player_a, player_b) pair
    6. Edge attributes: weight (seasons_together), teams[] (array of TeamTenure), total_days
    7. Computes era attribute for each node based on career span
  - Test: verify graph has correct node count (~5,115), edge count (60K-100K)
  - Test: verify known edges exist (LeBron-Wade, Jordan-Pippen)
  - Test: verify isolated nodes exist (players with no teammates meeting 14-day threshold)

  **Must NOT do**:
  - NO centrality metrics (that's T6)
  - NO community detection (that's T7)
  - NO JSON export (that's T8)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core graph construction logic, data aggregation, attribute computation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T2, T3, T4)
  - **Parallel Group**: Wave 2 (with T6, T7)
  - **Blocks**: T6, T7, T8
  - **Blocked By**: T2, T3, T4

  **References**:
  - `scripts/extract_teammates.py` (T3) — teammate_overlaps table
  - `src/lib/graph-types.ts` (T4) — type contracts to match
  - Official docs: `https://networkx.org/documentation/stable/reference/classes/graph.html` — NetworkX Graph API
  - `db/nba_raw_data.db` — dim_player, dim_team tables for attributes

  **Acceptance Criteria**:
  - [ ] `pytest tests/python/test_graph_construction.py -v` → PASS (5+ tests)
  - [ ] Graph has ~5,115 nodes (±10 for data quality)
  - [ ] Graph has 60,000-100,000 edges
  - [ ] Every node has: id, label, position, era, is_active, hof attributes
  - [ ] Every edge has: weight, teams[], total_days attributes
  - [ ] Known edges exist: LeBron-Wade, Jordan-Pippen

  **QA Scenarios**:

  ```
  Scenario: Graph construction produces valid graph
    Tool: Bash
    Preconditions: teammate_overlaps table exists, dim_player/dim_team populated
    Steps:
      1. Run: python -c "from scripts.build_graph import build_graph; G = build_graph(); print(f'Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}')"
      2. Assert: nodes between 5000-5200, edges between 50000-120000
    Expected Result: Graph has expected scale
    Evidence: .sisyphus/evidence/task-5-graph-stats.txt

  Scenario: Known teammate edge has correct attributes
    Tool: Bash
    Preconditions: Graph constructed
    Steps:
      1. Run: python -c "
         from scripts.build_graph import build_graph
         G = build_graph()
         edge = G.edges.get(('2544', '2548'))
         assert edge is not None, 'LeBron-Wade edge missing'
         assert edge['weight'] >= 4, f'Expected >= 4 seasons together, got {edge[\"weight\"]}'
         print(f'LeBron-Wade: {edge[\"weight\"]} seasons, {edge[\"total_days\"]} days')
         "
      2. Assert: exit code 0, output shows correct data
    Expected Result: LeBron-Wade edge exists with correct attributes
    Evidence: .sisyphus/evidence/task-5-known-edge.txt
  ```

  **Evidence to Capture**:
  - [ ] Graph statistics saved to `.sisyphus/evidence/task-5-graph-stats.txt`
  - [ ] Known edge verification saved to `.sisyphus/evidence/task-5-known-edge.txt`

  **Commit**: YES
  - Message: `feat(nba-network): build NetworkX graph from teammate overlaps`
  - Files: `scripts/build_graph.py`, `tests/python/test_graph_construction.py`
  - Pre-commit: `pytest tests/python/test_graph_construction.py -v`

- [x] 6. Centrality Metrics Computation

  **What to do**:
  - Write TDD test first: `tests/python/test_centrality_metrics.py`
  - Create `scripts/compute_metrics.py` function `compute_centrality(G)` that:
    1. Computes degree centrality for all nodes
    2. Computes betweenness centrality (sampled for performance if >5K nodes)
    3. Computes connected components
    4. Returns dict: `{player_id: {degree, betweenness, component_id}}`
  - Test: verify degree centrality values are between 0 and 1
  - Test: verify betweenness centrality values are between 0 and 1
  - Test: verify all nodes are in the same connected component (or document isolates)
  - Test: verify top degree centrality players are reasonable (high-degree = journeymen/long careers)

  **Must NOT do**:
  - NO community detection (that's T7)
  - NO layout computation (that's T7)
  - NO JSON export (that's T8)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Performance-sensitive computation on large graph, sampling strategy needed
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7, after T5)
  - **Parallel Group**: Wave 2 (with T5, T7)
  - **Blocks**: T8
  - **Blocked By**: T5

  **References**:
  - `scripts/build_graph.py` (T5) — graph construction output
  - Official docs: `https://networkx.org/documentation/stable/reference/algorithms/centrality.html` — centrality algorithms
  - `src/lib/graph-types.ts` (T4) — NodeData.degree attribute

  **Acceptance Criteria**:
  - [ ] `pytest tests/python/test_centrality_metrics.py -v` → PASS (4+ tests)
  - [ ] All degree centrality values between 0 and 1
  - [ ] All betweenness centrality values between 0 and 1
  - [ ] Top 10 degree centrality players are reasonable (long-career players)
  - [ ] Computation completes in <5 minutes

  **QA Scenarios**:

  ```
  Scenario: Centrality metrics are valid
    Tool: Bash
    Preconditions: Graph constructed
    Steps:
      1. Run: python -c "
         from scripts.build_graph import build_graph
         from scripts.compute_metrics import compute_centrality
         G = build_graph()
         metrics = compute_centrality(G)
         for pid, m in metrics.items():
             assert 0 <= m['degree'] <= 1, f'{pid} degree out of range: {m[\"degree\"]}'
             assert 0 <= m['betweenness'] <= 1, f'{pid} betweenness out of range'
         print(f'All {len(metrics)} nodes have valid centrality metrics')
         "
      2. Assert: exit code 0
    Expected Result: All centrality values in valid range
    Evidence: .sisyphus/evidence/task-6-centrality-valid.txt
  ```

  **Evidence to Capture**:
  - [ ] Centrality validation saved to `.sisyphus/evidence/task-6-centrality-valid.txt`

  **Commit**: YES
  - Message: `feat(nba-network): compute degree and betweenness centrality metrics`
  - Files: `scripts/compute_metrics.py`, `tests/python/test_centrality_metrics.py`
  - Pre-commit: `pytest tests/python/test_centrality_metrics.py -v`

- [x] 7. Community Detection + ForceAtlas2 Layout

  **What to do**:
  - Write TDD test first: `tests/python/test_layout.py`
  - Create `scripts/compute_layout.py` function `compute_layout(G)` that:
    1. Runs Louvain community detection (`community.best_partition(G)`)
    2. Assigns community ID to each node
    3. Runs ForceAtlas2 layout (`graphology-layout-forceatlas2` or NetworkX spring_layout)
    4. Assigns x, y coordinates to each node
    5. Computes node size based on degree centrality (scale: 3-15)
    6. Assigns color based on community (use team colors from dim_team)
  - Test: verify community count is between 5 and 50
  - Test: verify all nodes have x, y coordinates
  - Test: verify coordinates are within reasonable bounds (-1000 to 1000)
  - Test: verify communities are non-empty

  **Must NOT do**:
  - NO JSON export (that's T8)
  - NO visualization code

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Graph algorithms, layout computation, color assignment logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T6, after T5)
  - **Parallel Group**: Wave 2 (with T5, T6)
  - **Blocks**: T8
  - **Blocked By**: T5

  **References**:
  - `scripts/build_graph.py` (T5) — graph construction output
  - Official docs: `https://python-louvain.readthedocs.io/` — Louvain community detection
  - Official docs: `https://networkx.org/documentation/stable/reference/generated/networkx.drawing.layout.spring_layout.html` — spring layout
  - `db/nba_raw_data.db` — dim_team.color_primary for community colors

  **Acceptance Criteria**:
  - [ ] `pytest tests/python/test_layout.py -v` → PASS (4+ tests)
  - [ ] Community count between 5 and 50
  - [ ] All nodes have x, y coordinates
  - [ ] All coordinates within -1000 to 1000
  - [ ] All communities are non-empty
  - [ ] Computation completes in <5 minutes

  **QA Scenarios**:

  ```
  Scenario: Layout produces valid coordinates
    Tool: Bash
    Preconditions: Graph constructed
    Steps:
      1. Run: python -c "
         from scripts.build_graph import build_graph
         from scripts.compute_layout import compute_layout
         G = build_graph()
         nodes_with_layout = compute_layout(G)
         for node in nodes_with_layout:
             assert 'x' in node and 'y' in node, f'{node[\"id\"]} missing coordinates'
             assert -1000 <= node['x'] <= 1000, f'{node[\"id\"]} x out of range'
             assert -1000 <= node['y'] <= 1000, f'{node[\"id\"]} y out of range'
         print(f'All {len(nodes_with_layout)} nodes have valid layout')
         "
      2. Assert: exit code 0
    Expected Result: All nodes have valid coordinates
    Evidence: .sisyphus/evidence/task-7-layout-valid.txt
  ```

  **Evidence to Capture**:
  - [ ] Layout validation saved to `.sisyphus/evidence/task-7-layout-valid.txt`

  **Commit**: YES
  - Message: `feat(nba-network): compute community detection and ForceAtlas2 layout`
  - Files: `scripts/compute_layout.py`, `tests/python/test_layout.py`
  - Pre-commit: `pytest tests/python/test_layout.py -v`

- [x] 8. JSON Export + Schema Validation

  **What to do**:
  - Write TDD test first: `tests/python/test_json_export.py`
  - Create `scripts/export_json.py` function `export_graph_data(G, metrics, layout)` that:
    1. Combines graph nodes, edges, metrics, and layout into GraphData format
    2. Exports to `data/nodes.json`, `data/edges.json`
    3. Exports metadata to `data/metadata.json`
    4. Runs schema validation against `schemas/nodes.schema.json` and `schemas/edges.schema.json`
    5. Reports file sizes (must be <50MB gzipped total)
  - Test: verify JSON files are valid and match schema
  - Test: verify node count matches graph node count
  - Test: verify edge count matches graph edge count
  - Test: verify total file size is within budget

  **Must NOT do**:
  - NO visualization code
  - NO Next.js setup (that's T9)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: JSON serialization and validation, straightforward logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T4, T5, T6, T7)
  - **Parallel Group**: Wave 2 (after T5, T6, T7)
  - **Blocks**: T9, T10
  - **Blocked By**: T4, T5, T6, T7

  **References**:
  - `scripts/build_graph.py` (T5), `compute_metrics.py` (T6), `compute_layout.py` (T7)
  - `schemas/nodes.schema.json`, `schemas/edges.schema.json` (T4)
  - `src/lib/graph-types.ts` (T4) — TypeScript interfaces to match

  **Acceptance Criteria**:
  - [ ] `pytest tests/python/test_json_export.py -v` → PASS (4+ tests)
  - [ ] `data/nodes.json` is valid JSON matching nodes schema
  - [ ] `data/edges.json` is valid JSON matching edges schema
  - [ ] Total file size < 50MB (raw), estimate < 15MB gzipped
  - [ ] Node and edge counts match graph

  **QA Scenarios**:

  ```
  Scenario: JSON export is valid and within size budget
    Tool: Bash
    Preconditions: Graph, metrics, and layout computed
    Steps:
      1. Run: python scripts/export_json.py
      2. Assert: exit code 0
      3. Run: python -c "
         import json, os
         nodes = json.load(open('data/nodes.json'))
         edges = json.load(open('data/edges.json'))
         assert len(nodes) > 5000, f'Too few nodes: {len(nodes)}'
         assert len(edges) > 50000, f'Too few edges: {len(edges)}'
         size = os.path.getsize('data/nodes.json') + os.path.getsize('data/edges.json')
         print(f'Total JSON size: {size/1024/1024:.1f} MB')
         assert size < 50 * 1024 * 1024, f'JSON too large: {size}'
         "
      4. Assert: exit code 0
    Expected Result: Valid JSON within size budget
    Evidence: .sisyphus/evidence/task-8-json-export.txt
  ```

  **Evidence to Capture**:
  - [ ] JSON export output saved to `.sisyphus/evidence/task-8-json-export.txt`

  **Commit**: YES
  - Message: `feat(nba-network): export graph data to validated JSON`
  - Files: `scripts/export_json.py`, `tests/python/test_json_export.py`
  - Pre-commit: `pytest tests/python/test_json_export.py -v`

- [x] 9. Next.js Project Setup + Data Loading Layer

  **What to do**:
  - Write TDD test first: `tests/js/test-graph-data.test.ts`
  - Create `src/lib/graph-data.ts` with:
    1. `loadGraphData(): Promise<GraphData>` — fetches nodes.json and edges.json
    2. `filterByEra(data: GraphData, era: string): GraphData` — filters nodes/edges by era
    3. `filterByTeam(data: GraphData, teamId: string): GraphData` — filters by team
    4. `filterByPosition(data: GraphData, position: string): GraphData` — filters by position
    5. `searchPlayers(data: GraphData, query: string): NodeData[]` — fuzzy search
  - Copy `data/nodes.json` and `data/edges.json` to `public/data/` for static serving
  - Write tests for each function with mock data
  - Create `src/config/team-colors.ts` with team color mapping from dim_team

  **Must NOT do**:
  - NO visualization rendering (that's T10)
  - NO search UI (that's T11)
  - NO filter UI (that's T13)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Data loading and filtering utilities, pure functions
  - **Skills**: [`typescript-best-practices`]
    - `typescript-best-practices`: For proper TypeScript patterns in data layer

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T1, T4, T8)
  - **Parallel Group**: Wave 3 (with T10-T14)
  - **Blocks**: T10, T11, T12, T13, T14
  - **Blocked By**: T1, T4, T8

  **References**:
  - `src/lib/graph-types.ts` (T4) — TypeScript interfaces
  - `data/nodes.json`, `data/edges.json` (T8) — data files
  - `db/nba_raw_data.db` — dim_team for color mapping
  - Official docs: `https://nextjs.org/docs/app` — Next.js App Router

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-graph-data.test.ts` → PASS (6+ tests)
  - [ ] `loadGraphData()` returns valid GraphData
  - [ ] `filterByEra()` correctly filters nodes and edges
  - [ ] `searchPlayers()` returns matching players for partial queries
  - [ ] TypeScript compilation passes with zero errors

  **QA Scenarios**:

  ```
  Scenario: Data loading and filtering work correctly
    Tool: Bash
    Preconditions: JSON data files in public/data/, tests written
    Steps:
      1. Run: npx jest tests/js/test-graph-data.test.ts --verbose
      2. Assert: all tests pass
      3. Run: npx tsc --noEmit
      4. Assert: zero TypeScript errors
    Expected Result: All tests pass, TypeScript compiles cleanly
    Evidence: .sisyphus/evidence/task-9-data-layer.txt
  ```

  **Evidence to Capture**:
  - [ ] Test output saved to `.sisyphus/evidence/task-9-data-layer.txt`

  **Commit**: YES
  - Message: `feat(nba-network): add Next.js data loading and filtering layer`
  - Files: `src/lib/graph-data.ts`, `src/config/team-colors.ts`, `tests/js/test-graph-data.test.ts`, `public/data/`
  - Pre-commit: `npx jest tests/js/test-graph-data.test.ts && npx tsc --noEmit`

- [x] 10. Sigma.js Visualization Core + WebGL Rendering

  **What to do**:
  - Write TDD test first: `tests/js/test-network-graph.test.tsx`
  - Create `src/components/NetworkGraph.tsx`:
    1. Uses `@react-sigma/core` with Sigma.js v3 WebGL renderer
    2. Loads graph data from `loadGraphData()`
    3. Renders nodes with pre-computed x, y positions
    4. Renders edges with weight-based opacity
    5. Configures camera with zoom limits (0.1x - 10x)
    6. Sets up container with responsive sizing
    7. Implements basic hover event handling (emits event for tooltip)
  - Create `src/app/page.tsx` as the main page with NetworkGraph component
  - Test: component renders without crashing
  - Test: component handles empty data gracefully
  - Test: WebGL renderer is active (not Canvas fallback)

  **Must NOT do**:
  - NO tooltip UI (that's T12)
  - NO search UI (that's T11)
  - NO filter UI (that's T13)
  - NO performance optimization (that's T15)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core visualization, WebGL integration, Sigma.js configuration
  - **Skills**: [`visual-engineering`]
    - `visual-engineering`: For UI/UX quality in the network visualization

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T1, T9)
  - **Parallel Group**: Wave 3 (with T11-T14)
  - **Blocks**: T12, T13, T15, T16
  - **Blocked By**: T1, T9

  **References**:
  - `src/lib/graph-data.ts` (T9) — data loading
  - `src/lib/graph-types.ts` (T4) — type definitions
  - Official docs: `https://www.sigmajs.org/docs/` — Sigma.js v3 documentation
  - Official docs: `https://github.com/graphology/graphology` — Graphology API
  - Librarian findings — Sigma.js v3 WebGL rendering patterns

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-network-graph.test.tsx` → PASS (3+ tests)
  - [ ] `npm run dev` → network graph renders on page load
  - [ ] WebGL renderer is active (check browser console for sigma WebGL init message)
  - [ ] Graph renders all nodes and edges from JSON data
  - [ ] Zoom works within 0.1x - 10x range

  **QA Scenarios**:

  ```
  Scenario: Network graph renders with WebGL
    Tool: Playwright
    Preconditions: Dev server running, JSON data loaded
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for canvas element with class "sigma-container" or "sigma-scene"
      3. Assert: canvas element exists and is visible
      4. Assert: page contains at least 1000 node elements (Sigma renders nodes as WebGL points)
      5. Take screenshot
    Expected Result: Network graph renders with WebGL on page load
    Evidence: .sisyphus/evidence/task-10-graph-renders.png

  Scenario: Graph handles empty data gracefully
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Intercept network request for nodes.json and return empty array
      2. Navigate to http://localhost:3000
      3. Assert: page shows "No data available" or similar message
      4. Assert: no JavaScript errors in console
    Expected Result: Graceful empty state with no errors
    Evidence: .sisyphus/evidence/task-10-empty-state.png
  ```

  **Evidence to Capture**:
  - [ ] Graph rendering screenshot saved to `.sisyphus/evidence/task-10-graph-renders.png`
  - [ ] Empty state screenshot saved to `.sisyphus/evidence/task-10-empty-state.png`

  **Commit**: YES
  - Message: `feat(nba-network): implement Sigma.js WebGL network visualization`
  - Files: `src/components/NetworkGraph.tsx`, `src/app/page.tsx`, `tests/js/test-network-graph.test.tsx`
  - Pre-commit: `npx jest tests/js/test-network-graph.test.tsx && npx tsc --noEmit`

- [x] 11. Player Search + Autocomplete

  **What to do**:
  - Write TDD test first: `tests/js/test-search-bar.test.tsx`
  - Create `src/components/SearchBar.tsx`:
    1. Text input with autocomplete dropdown
    2. Uses `searchPlayers()` from graph-data.ts for fuzzy matching
    3. Shows player name, position, era in dropdown
    4. On select: highlights player node in graph (emits event)
    5. Debounced input (200ms) for performance
    6. Max 100 results in dropdown
  - Integrate with NetworkGraph via event system
  - Test: search returns correct results for partial queries
  - Test: search handles no results gracefully
  - Test: debounce works correctly

  **Must NOT do**:
  - NO voice search
  - NO external API calls
  - NO search history

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard search/autocomplete component
  - **Skills**: [`visual-engineering`]
    - `visual-engineering`: For polished autocomplete UI

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10, T12, T13, T14)
  - **Parallel Group**: Wave 3 (with T9-T14)
  - **Blocks**: T14
  - **Blocked By**: T9

  **References**:
  - `src/lib/graph-data.ts` (T9) — searchPlayers function
  - `src/lib/graph-types.ts` (T4) — NodeData type
  - `src/components/NetworkGraph.tsx` (T10) — event integration

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-search-bar.test.tsx` → PASS (3+ tests)
  - [ ] Typing "james" returns players with "James" in name
  - [ ] Typing "lebron" returns LeBron James
  - [ ] Dropdown shows max 100 results
  - [ ] No results shows "No players found"

  **QA Scenarios**:

  ```
  Scenario: Search finds players by partial name
    Tool: Playwright
    Preconditions: Dev server running, graph loaded
    Steps:
      1. Navigate to http://localhost:3000
      2. Type "jordan" into search input
      3. Wait 300ms for debounce
      4. Assert: dropdown shows Michael Jordan
      5. Assert: dropdown shows DeAndre Jordan (if applicable)
      6. Take screenshot
    Expected Result: Search returns matching players
    Evidence: .sisyphus/evidence/task-11-search-results.png

  Scenario: Search handles no results
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Type "xyznonexistent" into search input
      3. Wait 300ms for debounce
      4. Assert: dropdown shows "No players found"
    Expected Result: Graceful no-results state
    Evidence: .sisyphus/evidence/task-11-no-results.png
  ```

  **Evidence to Capture**:
  - [ ] Search results screenshot saved to `.sisyphus/evidence/task-11-search-results.png`
  - [ ] No results screenshot saved to `.sisyphus/evidence/task-11-no-results.png`

  **Commit**: YES
  - Message: `feat(nba-network): add player search with autocomplete`
  - Files: `src/components/SearchBar.tsx`, `tests/js/test-search-bar.test.tsx`
  - Pre-commit: `npx jest tests/js/test-search-bar.test.tsx && npx tsc --noEmit`

- [x] 12. Hover Tooltips + Click Drill-Down

  **What to do**:
  - Write TDD test first: `tests/js/test-player-tooltip.test.tsx`
  - Create `src/components/PlayerTooltip.tsx`:
    1. Appears on node hover with 100ms delay
    2. Shows: player name, position, era, Hall of Fame status
    3. Shows: top 5 teammates by duration (team name, seasons together)
    4. Shows: degree centrality value
    5. On click: highlights all edges connected to this player
    6. On click: dims all non-connected nodes and edges
    7. Click again to reset
  - Integrate with NetworkGraph via Sigma.js hover/click events
  - Test: tooltip appears on hover
  - Test: tooltip shows correct player info
  - Test: click highlights connected edges

  **Must NOT do**:
  - NO player career stats
  - NO external data fetches

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with hover/click interactions, visual feedback
  - **Skills**: [`visual-engineering`]
    - `visual-engineering`: For polished tooltip and highlight interactions

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10, T11, T13, T14)
  - **Parallel Group**: Wave 3 (with T9-T14)
  - **Blocks**: T15
  - **Blocked By**: T9, T10

  **References**:
  - `src/components/NetworkGraph.tsx` (T10) — Sigma.js event integration
  - `src/lib/graph-data.ts` (T9) — data access
  - `src/lib/graph-types.ts` (T4) — type definitions

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-player-tooltip.test.tsx` → PASS (3+ tests)
  - [ ] Hovering a node shows tooltip within 200ms
  - [ ] Tooltip shows player name, position, era, HoF status
  - [ ] Tooltip shows top 5 teammates
  - [ ] Clicking a node highlights connected edges and dims others
  - [ ] Clicking again resets highlight

  **QA Scenarios**:

  ```
  Scenario: Hover tooltip shows player info
    Tool: Playwright
    Preconditions: Dev server running, graph loaded
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for graph to render
      3. Hover over a visible node (use first node in data)
      4. Wait 200ms
      5. Assert: tooltip element is visible
      6. Assert: tooltip contains player name
      7. Assert: tooltip contains position
      8. Assert: tooltip contains at least one teammate
      9. Take screenshot
    Expected Result: Tooltip appears with correct player info
    Evidence: .sisyphus/evidence/task-12-tooltip-hover.png

  Scenario: Click highlights connected edges
    Tool: Playwright
    Preconditions: Dev server running, graph loaded
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for graph to render
      3. Click on a visible node
      4. Assert: connected edges are highlighted (different color/opacity)
      5. Assert: non-connected nodes are dimmed
      6. Take screenshot
    Expected Result: Click highlights connections, dims rest
    Evidence: .sisyphus/evidence/task-12-click-highlight.png
  ```

  **Evidence to Capture**:
  - [ ] Tooltip hover screenshot saved to `.sisyphus/evidence/task-12-tooltip-hover.png`
  - [ ] Click highlight screenshot saved to `.sisyphus/evidence/task-12-click-highlight.png`

  **Commit**: YES
  - Message: `feat(nba-network): add hover tooltips and click drill-down`
  - Files: `src/components/PlayerTooltip.tsx`, `tests/js/test-player-tooltip.test.tsx`
  - Pre-commit: `npx jest tests/js/test-player-tooltip.test.tsx && npx tsc --noEmit`

- [x] 13. Era/Team/Position Filters

  **What to do**:
  - Write TDD test first: `tests/js/test-filters.test.tsx`
  - Create `src/components/Filters.tsx`:
    1. Era filter: dropdown with buckets (1940s-1950s, 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, 2020s)
    2. Team filter: dropdown with all 30 NBA teams (plus "All Teams")
    3. Position filter: multi-select (PG, SG, SF, PF, C, G, F)
    4. Filters combine with AND logic
    5. "Reset All" button clears all filters
    6. Filter changes trigger graph re-render with filtered data
  - Integrate with NetworkGraph via props/state
  - Test: era filter correctly filters nodes and edges
  - Test: team filter correctly filters nodes and edges
  - Test: combined filters work correctly
  - Test: reset clears all filters

  **Must NOT do**:
  - NO date range sliders (only fixed era buckets)
  - NO custom filter combinations beyond AND logic

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with multiple filter controls, visual feedback
  - **Skills**: [`visual-engineering`]
    - `visual-engineering`: For polished filter UI with proper state management

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10-T14)
  - **Parallel Group**: Wave 3 (with T9-T14)
  - **Blocks**: T15
  - **Blocked By**: T9, T10

  **References**:
  - `src/lib/graph-data.ts` (T9) — filterByEra, filterByTeam, filterByPosition
  - `src/components/NetworkGraph.tsx` (T10) — graph re-render integration
  - `db/nba_raw_data.db` — dim_team for team list, dim_season for era buckets

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-filters.test.tsx` → PASS (4+ tests)
  - [ ] Era filter shows 8 era buckets
  - [ ] Team filter shows all 30 teams
  - [ ] Position filter shows all position options
  - [ ] Applying filters reduces visible nodes and edges
  - [ ] "Reset All" restores full graph

  **QA Scenarios**:

  ```
  Scenario: Era filter reduces graph to selected era
    Tool: Playwright
    Preconditions: Dev server running, graph loaded
    Steps:
      1. Navigate to http://localhost:3000
      2. Count visible nodes (initial state)
      3. Open era filter dropdown, select "2010s"
      4. Wait for graph to update
      5. Count visible nodes (filtered state)
      6. Assert: filtered count < initial count
      7. Take screenshot
    Expected Result: Era filter reduces visible nodes
    Evidence: .sisyphus/evidence/task-13-era-filter.png

  Scenario: Combined filters work correctly
    Tool: Playwright
    Preconditions: Dev server running, graph loaded
    Steps:
      1. Navigate to http://localhost:3000
      2. Set era filter to "2010s"
      3. Set position filter to "PG"
      4. Wait for graph to update
      5. Assert: only PG players from 2010s are visible
      6. Take screenshot
    Expected Result: Combined filters show only matching players
    Evidence: .sisyphus/evidence/task-13-combined-filters.png
  ```

  **Evidence to Capture**:
  - [ ] Era filter screenshot saved to `.sisyphus/evidence/task-13-era-filter.png`
  - [ ] Combined filters screenshot saved to `.sisyphus/evidence/task-13-combined-filters.png`

  **Commit**: YES
  - Message: `feat(nba-network): add era, team, and position filters`
  - Files: `src/components/Filters.tsx`, `tests/js/test-filters.test.tsx`
  - Pre-commit: `npx jest tests/js/test-filters.test.tsx && npx tsc --noEmit`

- [x] 14. Shortest Path Finder UI

  **What to do**:
  - Write TDD test first: `tests/js/test-shortest-path.test.tsx`
  - Create `src/components/ShortestPath.tsx`:
    1. Two search inputs: "From Player" and "To Player"
    2. "Find Path" button triggers BFS on pre-computed paths
    3. Pre-computed paths loaded from `data/paths.json` (generated in build step)
    4. Displays path as ordered list of players with team connections
    5. Highlights path on graph (nodes + edges in distinct color)
    6. Shows path length (degrees of separation)
    7. "Clear Path" button resets
  - Add path pre-computation to build pipeline: BFS from top 100 players to all others
  - Test: path finding returns correct results for known pairs
  - Test: handles unreachable players gracefully
  - Test: path highlighting works on graph

  **Must NOT do**:
  - NO on-the-fly BFS computation (must use pre-computed paths)
  - NO path finding for players not in top 100 source set (show "Path not pre-computed")

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: UI component with algorithmic backing, pre-computation integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10-T13)
  - **Parallel Group**: Wave 3 (with T9-T14)
  - **Blocks**: T18
  - **Blocked By**: T9, T11

  **References**:
  - `src/components/SearchBar.tsx` (T11) — search input pattern to reuse
  - `src/lib/graph-data.ts` (T9) — data access
  - Official docs: `https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.shortest_paths.unweighted.shortest_path.html` — BFS

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-shortest-path.test.tsx` → PASS (3+ tests)
  - [ ] Path from Jordan to Pippen returns [Jordan, Pippen] (distance 1)
  - [ ] Path highlights on graph when found
  - [ ] Unreachable pair shows appropriate message
  - [ ] "Clear Path" resets graph state

  **QA Scenarios**:

  ```
  Scenario: Shortest path found for known pair
    Tool: Playwright
    Preconditions: Dev server running, graph loaded, paths pre-computed
    Steps:
      1. Navigate to http://localhost:3000
      2. In "From Player", type and select "Michael Jordan"
      3. In "To Player", type and select "Scottie Pippen"
      4. Click "Find Path"
      5. Assert: path shows [Michael Jordan, Scottie Pippen]
      6. Assert: path length shows "1 degree of separation"
      7. Assert: path edges highlighted on graph
      8. Take screenshot
    Expected Result: Direct path found and highlighted
    Evidence: .sisyphus/evidence/task-14-path-found.png

  Scenario: Path not found for unreachable pair
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Select two players from different components (if any exist)
      3. Click "Find Path"
      4. Assert: message shows "No path found" or "Path not pre-computed"
    Expected Result: Graceful handling of unreachable pairs
    Evidence: .sisyphus/evidence/task-14-path-not-found.png
  ```

  **Evidence to Capture**:
  - [ ] Path found screenshot saved to `.sisyphus/evidence/task-14-path-found.png`
  - [ ] Path not found screenshot saved to `.sisyphus/evidence/task-14-path-not-found.png`

  **Commit**: YES
  - Message: `feat(nba-network): add shortest path finder with pre-computed BFS`
  - Files: `src/components/ShortestPath.tsx`, `tests/js/test-shortest-path.test.tsx`
  - Pre-commit: `npx jest tests/js/test-shortest-path.test.tsx && npx tsc --noEmit`

- [x] 15. Performance Optimization + Mobile Detection

  **What to do**:
  - Write TDD test first: `tests/js/test-performance.test.ts`
  - Implement viewport-based edge culling: only render edges within visible viewport
  - Implement level-of-detail (LOD): reduce node size and hide labels at high zoom-out
  - Add mobile detection: if mobile device, load reduced dataset (filter to post-1980)
  - Implement debounced zoom/pan handler to prevent re-render spam
  - Add Web Worker for search filtering (move off main thread)
  - Test: initial render completes in <3 seconds
  - Test: viewport culling reduces rendered edges by >80% at default zoom
  - Test: mobile detection returns correct result

  **Must NOT do**:
  - NO lazy loading of JSON (single load, viewport culling only)
  - NO external performance monitoring services

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Performance optimization, viewport culling, mobile detection
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T10, T12, T13)
  - **Parallel Group**: Wave 4 (with T16, T17)
  - **Blocks**: T18
  - **Blocked By**: T10, T12, T13

  **References**:
  - `src/components/NetworkGraph.tsx` (T10) — Sigma.js renderer
  - Official docs: `https://www.sigmajs.org/docs/modules/settings.html` — Sigma.js performance settings
  - `data/nodes.json`, `data/edges.json` (T8) — data files

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-performance.test.ts` → PASS (3+ tests)
  - [ ] Initial render completes in <3 seconds (measured via Performance API)
  - [ ] Viewport culling reduces rendered edges by >80% at default zoom
  - [ ] Mobile detection correctly identifies mobile user agents
  - [ ] Zoom/pan maintains >30 FPS with 1000 visible edges

  **QA Scenarios**:

  ```
  Scenario: Initial render completes within performance budget
    Tool: Playwright
    Preconditions: Dev server running, production build
    Steps:
      1. Run: npm run build && npm run start &
      2. Navigate to http://localhost:3000
      3. Start performance timer
      4. Wait for graph canvas to be visible
      5. Stop timer
      6. Assert: render time < 3000ms
      7. Take screenshot
    Expected Result: Graph renders within 3-second budget
    Evidence: .sisyphus/evidence/task-15-render-time.txt

  Scenario: Viewport culling reduces edge count
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Get total edge count from data
      3. Get rendered edge count at default zoom (via Sigma.js API)
      4. Assert: rendered edges < 20% of total edges
    Expected Result: Viewport culling active at default zoom
    Evidence: .sisyphus/evidence/task-15-viewport-culling.txt
  ```

  **Evidence to Capture**:
  - [ ] Render time saved to `.sisyphus/evidence/task-15-render-time.txt`
  - [ ] Viewport culling data saved to `.sisyphus/evidence/task-15-viewport-culling.txt`

  **Commit**: YES
  - Message: `perf(nba-network): optimize rendering with viewport culling and LOD`
  - Files: `src/components/NetworkGraph.tsx`, `src/lib/performance.ts`, `tests/js/test-performance.test.ts`
  - Pre-commit: `npx jest tests/js/test-performance.test.ts && npx tsc --noEmit`

- [x] 16. Error Handling + WebGL Fallback + Loading States

  **What to do**:
  - Write TDD test first: `tests/js/test-error-handling.test.tsx`
  - Implement:
    1. Loading spinner while graph data loads
    2. Error state if JSON fails to download (retry button)
    3. WebGL detection: if not supported, show error message with graceful degradation
    4. Empty state if no data matches current filters
    5. Error boundary wrapping NetworkGraph component
  - Test: loading state shows during data fetch
  - Test: error state shows on failed fetch
  - Test: WebGL fallback message displays when WebGL unavailable

  **Must NOT do**:
  - NO Canvas fallback (show error instead — Canvas can't handle the scale)
  - NO silent failures (all errors must be visible to user)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Error states and loading UI, straightforward patterns
  - **Skills**: [`visual-engineering`]
    - `visual-engineering`: For polished error/loading states

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T15, T17)
  - **Parallel Group**: Wave 4 (with T15, T17)
  - **Blocks**: T18
  - **Blocked By**: T10

  **References**:
  - `src/components/NetworkGraph.tsx` (T10) — component to wrap with error boundary
  - `src/lib/graph-data.ts` (T9) — data loading with error handling
  - Official docs: `https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary` — error boundaries

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-error-handling.test.tsx` → PASS (3+ tests)
  - [ ] Loading spinner shows during data fetch
  - [ ] Error message with retry button shows on failed fetch
  - [ ] WebGL unsupported message displays when WebGL unavailable
  - [ ] Empty state shows when filters match no data

  **QA Scenarios**:

  ```
  Scenario: Loading state displays during data fetch
    Tool: Playwright
    Preconditions: Dev server running, slow network emulation
    Steps:
      1. Navigate to http://localhost:3000 with slow 3G throttling
      2. Assert: loading spinner is visible
      3. Wait for data to load
      4. Assert: loading spinner disappears
      5. Assert: graph renders
    Expected Result: Loading state transitions to graph
    Evidence: .sisyphus/evidence/task-16-loading-state.png

  Scenario: Error state shows on failed data fetch
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Intercept network request for nodes.json and return 500 error
      2. Navigate to http://localhost:3000
      3. Assert: error message is visible
      4. Assert: retry button is visible
      5. Take screenshot
    Expected Result: Error state with retry option
    Evidence: .sisyphus/evidence/task-16-error-state.png
  ```

  **Evidence to Capture**:
  - [ ] Loading state screenshot saved to `.sisyphus/evidence/task-16-loading-state.png`
  - [ ] Error state screenshot saved to `.sisyphus/evidence/task-16-error-state.png`

  **Commit**: YES
  - Message: `feat(nba-network): add error handling, loading states, and WebGL fallback`
  - Files: `src/components/ErrorBoundary.tsx`, `src/components/LoadingState.tsx`, `tests/js/test-error-handling.test.tsx`
  - Pre-commit: `npx jest tests/js/test-error-handling.test.tsx && npx tsc --noEmit`

- [ ] 17. Deployment Config (Vercel/Netlify)

  **What to do**:
  - Write TDD test first: `tests/js/test-deployment-config.test.ts`
  - Create `vercel.json`:
    1. Next.js framework preset
    2. Static export configuration
    3. Cache headers for JSON data files
  - Create `netlify.toml`:
    1. Build command: `npm run build`
    2. Publish directory: `out` (Next.js static export)
    3. Redirect rules for SPA routing
  - Configure Next.js for static export: `output: 'export'` in next.config.ts
  - Test: `npm run build` produces static output in `out/` directory
  - Test: `out/index.html` exists and is valid HTML
  - Test: `out/data/nodes.json` and `out/data/edges.json` exist

  **Must NOT do**:
  - NO server-side rendering (static only)
  - NO API routes (no backend needed)
  - NO environment variables (no secrets needed)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration files, straightforward setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T15, T16)
  - **Parallel Group**: Wave 4 (with T15, T16)
  - **Blocks**: T18
  - **Blocked By**: T15, T16

  **References**:
  - Official docs: `https://nextjs.org/docs/app/building-your-application/deploying/static-exports` — Next.js static export
  - Official docs: `https://vercel.com/docs/frameworks/nextjs` — Vercel Next.js config
  - Official docs: `https://docs.netlify.com/configure-builds/file-based-configuration/` — Netlify config

  **Acceptance Criteria**:
  - [ ] `npx jest tests/js/test-deployment-config.test.ts` → PASS (3+ tests)
  - [ ] `npm run build` succeeds with static export
  - [ ] `out/index.html` exists
  - [ ] `out/data/nodes.json` and `out/data/edges.json` exist
  - [ ] `vercel.json` and `netlify.toml` are valid

  **QA Scenarios**:

  ```
  Scenario: Static build produces deployable output
    Tool: Bash
    Preconditions: All frontend code complete
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
      3. Assert: out/index.html exists
      4. Assert: out/data/nodes.json exists and is valid JSON
      5. Assert: out/data/edges.json exists and is valid JSON
      6. Run: du -sh out/
      7. Assert: total size < 100MB
    Expected Result: Static build succeeds with all assets
    Evidence: .sisyphus/evidence/task-17-static-build.txt
  ```

  **Evidence to Capture**:
  - [ ] Static build output saved to `.sisyphus/evidence/task-17-static-build.txt`

  **Commit**: YES
  - Message: `chore(nba-network): add Vercel and Netlify deployment config`
  - Files: `vercel.json`, `netlify.toml`, `next.config.ts`, `tests/js/test-deployment-config.test.ts`
  - Pre-commit: `npm run build && npx jest tests/js/test-deployment-config.test.ts`

- [ ] 18. Final Integration Test + End-to-End QA

  **What to do**:
  - Write comprehensive Playwright E2E test suite: `tests/e2e/full-app.test.ts`
  - Test complete user journey:
    1. Page loads, graph renders
    2. Search for a player, select from dropdown
    3. Hover over a node, verify tooltip
    4. Click a node, verify highlight
    5. Apply era filter, verify graph updates
    6. Apply team filter, verify graph updates
    7. Apply position filter, verify graph updates
    8. Reset filters, verify full graph returns
    9. Use shortest path finder, verify path highlights
    10. Clear path, verify graph resets
  - Run Python build pipeline end-to-end: `python scripts/build_graph.py`
  - Verify all JSON outputs are valid and within size budget
  - Run full test suite: `pytest` + `jest` + `npm run build`

  **Must NOT do**:
  - NO new feature development
  - NO changes to existing code (only test additions)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive E2E testing, integration verification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T14, T15, T16, T17)
  - **Parallel Group**: Wave 4 (final task before verification)
  - **Blocks**: F1, F2, F3, F4
  - **Blocked By**: T14, T15, T16, T17

  **References**:
  - All previous tasks — this tests the complete system
  - Official docs: `https://playwright.dev/docs/intro` — Playwright E2E testing

  **Acceptance Criteria**:
  - [ ] `python scripts/build_graph.py` completes successfully
  - [ ] `pytest tests/python/ -v` → PASS (all Python tests)
  - [ ] `npx jest tests/js/` → PASS (all JS tests)
  - [ ] `npm run build` → zero errors
  - [ ] Playwright E2E suite passes all 10 user journey steps

  **QA Scenarios**:

  ```
  Scenario: Complete user journey works end-to-end
    Tool: Playwright
    Preconditions: Full build complete, dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Verify graph renders with WebGL
      3. Search for "LeBron", select LeBron James
      4. Hover over LeBron's node, verify tooltip shows teammate info
      5. Click LeBron's node, verify connected edges highlight
      6. Apply era filter "2010s", verify graph updates
      7. Apply team filter "LAL", verify graph updates
      8. Reset filters, verify full graph returns
      9. Use shortest path: LeBron to Wade, verify path found
      10. Clear path, verify graph resets
      11. Take screenshot of final state
    Expected Result: All interactions work correctly
    Evidence: .sisyphus/evidence/task-18-full-journey.png

  Scenario: Full test suite passes
    Tool: Bash
    Preconditions: All code complete
    Steps:
      1. Run: python scripts/build_graph.py
      2. Run: pytest tests/python/ -v --tb=short
      3. Run: npx jest tests/js/ --verbose
      4. Run: npm run build
      5. Assert: all commands exit with code 0
    Expected Result: Zero failures across all test suites
    Evidence: .sisyphus/evidence/task-18-full-test-suite.txt
  ```

  **Evidence to Capture**:
  - [ ] Full journey screenshot saved to `.sisyphus/evidence/task-18-full-journey.png`
  - [ ] Full test suite output saved to `.sisyphus/evidence/task-18-full-test-suite.txt`

  **Commit**: YES
  - Message: `test(nba-network): add comprehensive E2E integration tests`
  - Files: `tests/e2e/full-app.test.ts`
  - Pre-commit: `pytest tests/python/ -v && npx jest tests/js/ && npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `pytest` + `jest`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 (T1-T4)**: `chore(nba-network): scaffold infrastructure, validation, SQL extraction, and schema`
  - Files: `pytest.ini`, `jest.config.js`, `package.json`, `scripts/`, `tests/`, `src/lib/graph-types.ts`, `schemas/`
  - Pre-commit: `pytest tests/python/ -v && npx jest tests/js/ --passWithNoTests`

- **Wave 2 (T5-T8)**: `feat(nba-network): build graph pipeline — construction, metrics, layout, JSON export`
  - Files: `scripts/build_graph.py`, `scripts/compute_metrics.py`, `scripts/compute_layout.py`, `scripts/export_json.py`, `data/*.json`
  - Pre-commit: `pytest tests/python/ -v`

- **Wave 3 (T9-T14)**: `feat(nba-network): build Next.js frontend with Sigma.js visualization`
  - Files: `src/app/page.tsx`, `src/components/*.tsx`, `src/lib/graph-data.ts`, `src/config/team-colors.ts`
  - Pre-commit: `npx jest tests/js/ && npx tsc --noEmit`

- **Wave 4 (T15-T18)**: `feat(nba-network): optimize, deploy, and add E2E tests`
  - Files: `src/components/ErrorBoundary.tsx`, `vercel.json`, `netlify.toml`, `tests/e2e/`
  - Pre-commit: `npm run build && npx jest tests/js/ && pytest tests/python/ -v`

---

## Success Criteria

### Verification Commands
```bash
python scripts/build_graph.py          # Expected: "Graph built: N nodes, M edges"
pytest tests/python/ -v                # Expected: all tests pass
npx jest tests/js/                     # Expected: all tests pass
npm run build                          # Expected: zero errors, static export in out/
npx playwright test tests/e2e/         # Expected: all E2E scenarios pass
```

### Final Checklist
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" exclusions verified absent
- [ ] All Python tests pass (pytest)
- [ ] All JavaScript tests pass (jest)
- [ ] All Playwright E2E scenarios pass
- [ ] Static build succeeds with zero errors
- [ ] JSON payload < 50MB gzipped
- [ ] Initial render < 3 seconds
- [ ] Deployed to Vercel/Netlify and accessible via URL
