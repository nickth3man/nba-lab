# Task 1 Learnings

## Patterns
- Used `npx create-next-app@latest` with `--empty --yes` to bootstrap in temp dir, then moved files
- Python venv created with `python -m venv .venv`
- Dependencies installed in two phases: Python via pip, JS via npm

## Conventions
- pytest.ini goes in project root with `testpaths = tests/python`
- jest.config.js goes in project root with `testMatch` for TypeScript tests
- Evidence files go in `.sisyphus/evidence/` with naming `task-1-*.txt`
- DB path in Python tests uses `os.path.abspath` with `__file__` for relative path resolution

## Successful Approaches
- Next.js scaffolding via temp directory works when existing files would conflict
- sqlite3.connect followed by cursor.execute and fetchone is a reliable DB connectivity check
- Jest with ts-jest preset handles TypeScript tests without additional transpilation step
