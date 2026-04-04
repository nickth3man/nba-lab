# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Philosophy

- Fully design solutions conceptually before writing code. Data structures,
  algorithms, and architecture should be clear before implementation begins.
- Prioritize deep comprehension over quick implementation. Shallow
  understanding produces fragile code.
- Seek the simplest correct solution. Elegance is the byproduct of
  understanding, not cleverness.
- Consider multiple approaches, explicitly identify tradeoffs, and validate
  against edge cases before committing.

## Tech Stack

- Language: TypeScript 5.x / Python 3.12+
- Framework: Next.js 16 (App Router, static export)
- Graph rendering: Sigma.js 3.x + Graphology
- Data pipeline: Python with NetworkX, NumPy, python-louvain
- JS Package Manager: npm (not pnpm, not yarn)
- Python Package Manager: uv
- Runtime: Node.js 20
- Data source: SQLite (`db/nba_raw_data.db`)
- Testing: Jest 30 + pytest + Playwright

## Key Commands

- Install JS deps: `npm install`
- Install Python deps: `uv sync`
- Dev server: `npm run dev` (uses `--turbo`)
- Build: `npm run build` (static export to `out/`)
- Typecheck: `npm run typecheck`
- Lint JS: `npm run lint`
- Lint Python: `npm run lint:py`
- Format JS: `npm run format`
- Format Python: `npm run format:py`
- Test JS: `npm run test:js`
- Test Python: `npm run test:py`
- Test all: `npm run test:all`
- Test single JS file: `npx jest --runInBand tests/js/test-graph-data.test.ts`
- Test single Python file: `uv run pytest tests/python/test_build_graph.py`
- E2E tests: `npm run test:e2e` (builds and serves static export first)
- Run a pipeline script: `uv run python scripts/build_graph.py`

## Project Structure

- `src/app/` -- Next.js pages; single-page app with static export
- `src/components/` -- React components (graph, filters, search, tooltips)
- `src/lib/` -- Graph data loading, TypeScript types, performance utilities
- `src/config/` -- Team colors configuration
- `scripts/` -- Python data pipeline (SQLite -> NetworkX -> JSON)
- `schemas/` -- JSON validation schemas for nodes/edges
- `tests/js/` -- Jest unit tests (not alongside source files)
- `tests/python/` -- pytest tests
- `tests/e2e/` -- Playwright tests
- `data/` -- Generated JSON files (gitignored, served at runtime)
- `db/` -- SQLite source database

## Architecture

This is a two-part system:

**Python data pipeline** (`scripts/`): Reads an SQLite database of NBA roster
data, builds a NetworkX graph of teammate relationships, computes centrality
metrics and community-based layout, then exports to `data/nodes.json` and
`data/edges.json`. Scripts run in sequence:
`extract_teammates` -> `build_graph` -> `compute_metrics` -> `compute_layout`
-> `export_json` -> `validate_json_schema`.

**Next.js frontend** (`src/`): A statically exported single-page app that
loads the generated JSON at runtime via `fetch()` from `/data/` and renders an
interactive network graph using Sigma.js/Graphology. Deployed to Netlify as
static files.

## Code Style

- Source files must stay under 300 lines (ESLint `max-lines`, excludes blanks/comments)
- Line length limit: 100 characters (JS and Python)
- Python line length: 120 (Ruff config)
- Double quotes everywhere (Prettier + Ruff)
- Semicolons required in JS/TS (Prettier)
- Trailing commas everywhere (Prettier `trailingComma: "all"`)
- Path alias: `@/*` maps to `./src/*`

## Non-Obvious Patterns

- **Static export only**: `next.config.ts` sets `output: "export"`. There is no
  server-side rendering. All data is loaded client-side via fetch.
- **NetworkGraph is dynamically imported** with `ssr: false` because Sigma.js
  requires a browser DOM/WebGL context.
- **Generated data is gitignored**: `data/` is in `.gitignore`. The frontend
  expects `nodes.json` and `edges.json` to exist at `/data/` at runtime. You
  must run the Python pipeline to generate these files before the app works.
- **`python-louvain` imports as `community`**: The pip package `python-louvain`
  installs a module named `community`. In `compute_layout.py` it's imported via
  `import_module("community")` to avoid confusion.
- **Tests live in a separate `tests/` directory**, not alongside source. Jest
  config explicitly matches `tests/js/**/*.test.{ts,tsx}`. Pytest matches
  `tests/python/test_*.py`.

## Testing Rules

- Jest uses `ts-jest` with `isolatedModules: true` and `jsdom` environment
- pytest uses `pytest-xdist` for parallel execution (`-n auto --dist loadscope`)
- Coverage thresholds: 50% for branches, functions, lines, and statements
- Run the full test command before marking any task complete

## Git Hooks (Lefthook)

Git hooks are managed by Lefthook, not Husky. Run `lefthook install` after cloning.

- **pre-commit** (parallel): Prettier, ESLint, Ruff check + format
- **pre-push** (parallel): typecheck, JS tests, Python tests
- **commit-msg**: commitlint enforces conventional commits

Commit messages must follow conventional commits format: `type: subject`
where type is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `chore`, `revert`, `ci`, `build`. Header max 72 chars, body lines
max 100 chars.

## Boundaries

### Allowed without asking

- Read files, list directory contents
- Run lint, typecheck, and individual test files
- Refactor within a single module

### Ask first

- Install or remove dependencies
- Delete files
- Changes spanning more than 3 modules

### Never

- Commit secrets, `.env` files, or credentials
- Force push to main or protected branches
- Modify generated directories: `data/`, `out/`, `.next/`, `build/`
- Modify `db/nba_raw_data.db` (source of truth)
