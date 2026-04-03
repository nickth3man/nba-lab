# NBA Teammate Network

Interactive visualization of NBA player teammate relationships (1946-2026) using network graph analysis. Built with Next.js 16, Sigma.js, Graphology, and Python data pipeline.

## Tech Stack

| Layer           | Technologies                         |
| --------------- | ------------------------------------ |
| Frontend        | Next.js 16, React 19, TypeScript 5.x |
| Graph rendering | Sigma.js 3.x, Graphology             |
| Data pipeline   | Python 3.12+, NetworkX, NumPy, uv    |
| Testing         | Jest, Pytest, Playwright             |
| CI/CD           | GitHub Actions                       |

## Quick Start

**Prerequisites:** Node.js 20+, Python 3.12+, [uv](https://docs.astral.sh/uv/)

```bash
# Install dependencies
npm install
uv sync

# Start development server
npm run dev
```

Open http://localhost:3000

```bash
# Build for production (static export)
npm run build
```

Output is written to `out/` for deployment to Vercel/Netlify.

## Project Structure

```
src/app/          → Next.js pages (static export)
src/components/   → React components (graph, filters, search, tooltips)
src/lib/          → Graph data loading, types, performance utilities
src/config/       → Team colors configuration
scripts/          → Python data pipeline scripts
tests/            → JS unit tests, Python tests, E2E tests
schemas/          → JSON validation schemas (nodes, edges)
data/             → Generated JSON data files
db/               → SQLite source database
```

## Data Pipeline

Scripts run in sequence to generate the graph data:

1. `extract_teammates` — Parse raw data into teammate relationships
2. `build_graph` — Construct graph structure from relationships
3. `compute_metrics` — Calculate centrality and graph metrics
4. `compute_layout` — Generate node positions and community colors
5. `export_json` — Export to frontend-compatible format
6. `validate_json_schema` — Validate against schemas

```bash
# Run individual scripts
uv run python scripts/extract_teammates.py
uv run python scripts/build_graph.py
uv run python scripts/compute_metrics.py
uv run python scripts/compute_layout.py
uv run python scripts/export_json.py
uv run python scripts/validate_json_schema.py
```

## Available Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start development server      |
| `npm run build`     | Build static export           |
| `npm run start`     | Start production server       |
| `npm run lint`      | Lint TypeScript/JavaScript    |
| `npm run lint:py`   | Lint Python with Ruff         |
| `npm run format`    | Format code with Prettier     |
| `npm run format:py` | Format Python with Ruff       |
| `npm run test:js`   | Run Jest tests                |
| `npm run test:py`   | Run Pytest tests              |
| `npm run test:e2e`  | Run Playwright E2E tests      |
| `npm run typecheck` | Run TypeScript compiler check |

## Architecture Note

Uses npm for the frontend app and uv for the Python data pipeline. Both have lockfiles (`package-lock.json`, `uv.lock`).

## License

MIT
