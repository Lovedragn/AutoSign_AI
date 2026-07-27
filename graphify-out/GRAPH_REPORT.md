# Graph Report - .  (2026-07-27)

## Corpus Check
- Corpus is ~9,142 words - fits in a single context window. You may not need a graph.

## Summary
- 73 nodes · 76 edges · 19 communities (6 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- UI & Core Libraries
- React App Components & Routing
- Package Scripts & Metadata
- ESLint & React Refresh Config
- Autoprefixer Styling Plugin
- Babel Core Transpilation
- React Compiler Optimization
- ESLint Core Linter
- ESLint JavaScript Parser
- React Hooks Lint Rules
- PostCSS Stylesheet Processing
- Rolldown Babel Plugin
- Tailwind CSS Design System
- React Type Definitions
- React DOM Type Definitions
- Vite Build Tooling
- Vite React Plugin Integration

## God Nodes (most connected - your core abstractions)
1. `scripts` - 5 edges
2. `@react-oauth/google` - 2 edges
3. `@tailwindcss/postcss` - 2 edges
4. `@tailwindcss/vite` - 2 edges
5. `gsap` - 2 edges
6. `lucide-react` - 2 edges
7. `react` - 2 edges
8. `react-dom` - 2 edges
9. `@babel/core` - 2 edges
10. `@eslint/js` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (19 total, 13 thin omitted)

### Community 0 - "UI & Core Libraries"
Cohesion: 0.13
Nodes (15): gsap, lucide-react, dependencies, gsap, lucide-react, react, react-dom, @react-oauth/google (+7 more)

### Community 1 - "React App Components & Routing"
Cohesion: 0.20
Nodes (7): App(), AuthPage(), DashboardPage(), Header(), HistoryPage(), LandingPage(), PreviewPage()

### Community 2 - "Package Scripts & Metadata"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 3 - "ESLint & React Refresh Config"
Cohesion: 0.40
Nodes (5): eslint-plugin-react-refresh, globals, devDependencies, eslint-plugin-react-refresh, globals

## Knowledge Gaps
- **30 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `ESLint & React Refresh Config` to `Package Scripts & Metadata`, `Autoprefixer Styling Plugin`, `Babel Core Transpilation`, `React Compiler Optimization`, `ESLint Core Linter`, `ESLint JavaScript Parser`, `React Hooks Lint Rules`, `PostCSS Stylesheet Processing`, `Rolldown Babel Plugin`, `Tailwind CSS Design System`, `React Type Definitions`, `React DOM Type Definitions`, `Vite Build Tooling`, `Vite React Plugin Integration`?**
  _High betweenness centrality (0.458) - this node is a cross-community bridge._
- **Why does `dependencies` connect `UI & Core Libraries` to `Package Scripts & Metadata`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI & Core Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._