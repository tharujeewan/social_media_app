# Requirements Document

## Introduction

The `graphify` feature generates and maintains a queryable knowledge graph of the social media app codebase. When a developer runs `graphify .` from the project root, the tool statically analyses the entire workspace — the Node.js/Express/Prisma backend and the Flutter/Dart frontend — and produces a structured graph stored in `graphify-out/`. The graph captures files, modules, classes, functions, routes, Prisma models, Flutter widgets, and the relationships between them (imports, calls, extends, implements, uses). Once built, developers can interrogate the graph through three CLI commands: `graphify query`, `graphify path`, and `graphify explain`, without needing to grep source files or read large architecture documents.

## Glossary

- **Graph_Builder**: The component responsible for scanning the workspace and constructing the knowledge graph.
- **Graph_Store**: The persisted output in `graphify-out/graph.json` that holds all nodes and edges.
- **Graph_Report**: The human-readable summary written to `graphify-out/GRAPH_REPORT.md`.
- **Query_Engine**: The component that accepts natural-language or keyword questions and returns a scoped subgraph.
- **Path_Finder**: The component that computes the shortest relationship path between two named entities.
- **Explainer**: The component that produces a plain-English explanation of a concept or entity found in the graph.
- **Node**: A single entity in the graph (file, module, class, function, route, Prisma model, Flutter widget, etc.).
- **Edge**: A directed relationship between two nodes (imports, calls, extends, implements, uses, defines, etc.).
- **Workspace**: The project root directory passed to `graphify .`, containing both `backend/` and `connectify/`.
- **CLI**: The `graphify` command-line interface through which all commands are invoked.
- **Subgraph**: A subset of nodes and edges returned by a query, path, or explain command.

---

## Requirements

### Requirement 1: Graph Construction

**User Story:** As a developer, I want to run `graphify .` and have the tool scan the entire codebase, so that a complete knowledge graph is built and saved to `graphify-out/`.

#### Acceptance Criteria

1. WHEN the developer runs `graphify .` from the workspace root, THE Graph_Builder SHALL traverse all source files with extensions `.js`, `.ts`, `.jsx`, `.tsx` under `backend/` and `.dart` under `connectify/lib/`, create the `graphify-out/` directory if it does not exist, and produce a `graphify-out/graph.json` file.
2. THE Graph_Builder SHALL extract nodes for each of the following entity types: source files, JavaScript/TypeScript modules, Dart files, Express route handlers, Prisma models, Dart classes, Dart widgets, and named functions — where named functions include top-level functions, class methods, and arrow functions assigned to named variables or constants.
3. THE Graph_Builder SHALL extract edges for each of the following relationship types: `imports` (file A statically imports file B), `calls` (function A invokes function B), `extends` (class A inherits from class B), `implements` (class A implements interface B), `defines` (file A declares entity B), `uses` (entity A references entity B without calling it), and `exposes_route` (router file A registers HTTP route B).
4. WHEN `graphify-out/graph.json` already exists, THE Graph_Builder SHALL overwrite it with a freshly computed graph rather than merging with the previous version.
5. IF a source file cannot be parsed due to a syntax error, THEN THE Graph_Builder SHALL log a warning to stderr identifying the file path and the parse error, and SHALL continue processing the remaining files.
6. IF writing `graphify-out/graph.json` fails due to a file system error, THEN THE Graph_Builder SHALL print an error message to stderr identifying the cause and SHALL exit with a non-zero status code.
7. WHEN graph construction completes successfully, THE Graph_Builder SHALL print a summary to stdout stating the total number of nodes, total number of edges, and elapsed time in seconds rounded to two decimal places.

---

### Requirement 2: Graph Storage Format

**User Story:** As a developer, I want the graph stored in a well-defined JSON format, so that other tools and scripts can consume it programmatically.

#### Acceptance Criteria

1. THE Graph_Store SHALL persist the graph as a JSON object with two top-level arrays: `nodes` and `edges`.
2. THE Graph_Store SHALL represent each node as a JSON object containing at minimum the fields: `id` (string, unique within the file), `type` (string, one of the defined entity types), `label` (string, human-readable name), and `file` (string, workspace-relative path using forward slashes with no leading slash, e.g. `backend/src/routes/auth.ts`).
3. THE Graph_Store SHALL represent each edge as a JSON object containing at minimum the fields: `source` (string, must reference an existing node `id`), `target` (string, must reference an existing node `id`), and `relation` (string, one of the defined relationship types).
4. THE Graph_Store SHALL write the JSON file with UTF-8 encoding, 2-space indentation, lexicographically sorted keys within each object, LF line endings, and a single trailing newline.
5. IF `graph.json` is a valid JSON file, THEN parsing the file and re-serialising it with the same formatting rules SHALL produce a byte-for-byte identical file (round-trip property).
6. IF two nodes in the same graph construction run would share the same `id`, THEN THE Graph_Builder SHALL log an error to stderr identifying the duplicate `id` and SHALL exit with a non-zero status code rather than writing a graph with duplicate node identifiers.

---

### Requirement 3: Graph Report Generation

**User Story:** As a developer, I want a human-readable architecture summary, so that I can get a broad overview of the codebase without reading individual files.

#### Acceptance Criteria

1. WHEN graph construction completes, THE Graph_Builder SHALL write a `graphify-out/GRAPH_REPORT.md` file alongside `graph.json`.
2. THE Graph_Report SHALL include a section listing all top-level modules — where a top-level module is the unique root-level directory name derived from each node's `file` path — along with the count of nodes whose `file` path begins with that directory name.
3. THE Graph_Report SHALL include a section listing nodes sorted by descending in-degree; WHEN ten or more nodes exist it SHALL list the top ten, and WHEN fewer than ten nodes exist it SHALL list all nodes sorted by descending in-degree.
4. THE Graph_Report SHALL include a section listing all Express routes with their HTTP method, path, and the handler node they map to; IF no Express route nodes exist in the graph, THEN the section SHALL explicitly state that no routes were detected.
5. THE Graph_Report SHALL include a section listing all Prisma models and their direct relationships — defined as explicit Prisma relation fields (one-to-one, one-to-many, many-to-many) declared on the model — to other models; IF no Prisma model nodes exist in the graph, THEN the section SHALL explicitly state that no Prisma models were detected.

---

### Requirement 4: Query Command

**User Story:** As a developer, I want to run `graphify query "<question>"` and receive a focused subgraph, so that I can answer architecture questions without reading the full graph or grepping source files.

#### Acceptance Criteria

1. WHEN the developer runs `graphify query "<question>"`, THE Query_Engine SHALL read `graphify-out/graph.json` and return a Subgraph consisting of all nodes that match the question terms plus all direct neighbours (one hop, both incoming and outgoing edges) of each matched node.
2. THE Query_Engine SHALL derive query terms by splitting the question string on whitespace and punctuation, discarding terms of two characters or fewer, and matching nodes whose `label`, `type`, or `file` fields contain any remaining term using case-insensitive substring matching.
3. WHEN the Subgraph contains nodes, THE Query_Engine SHALL print nodes first in the format `[<type>] <label> (<file>)`, one per line, followed by edges in the format `<sourceLabel> -[<relation>]-> <targetLabel>`, one per line.
4. WHEN the Subgraph would exceed 50 nodes, THE Query_Engine SHALL retain only the 50 nodes with the highest count of matched query terms, breaking ties by node `id` lexicographic order, and SHALL print a notice stating that results were truncated.
5. WHEN no nodes match the question terms, THE Query_Engine SHALL print a message stating that no matching entities were found and SHALL exit with a non-zero status code.
6. WHEN `graphify-out/graph.json` does not exist, THE Query_Engine SHALL print an error message instructing the developer to run `graphify .` first, and SHALL exit with a non-zero status code.
7. WHEN `graphify-out/graph.json` exists but cannot be parsed as valid JSON, THE Query_Engine SHALL print an error message identifying the parse failure and SHALL exit with a non-zero status code.

---

### Requirement 5: Path Command

**User Story:** As a developer, I want to run `graphify path "<A>" "<B>"` and see how two entities are connected, so that I can trace dependency chains and understand coupling.

#### Acceptance Criteria

1. WHEN the developer runs `graphify path "<A>" "<B>"`, THE Path_Finder SHALL read `graphify-out/graph.json` and compute the shortest directed path from the node matching `<A>` to the node matching `<B>`.
2. THE Path_Finder SHALL match node names using case-insensitive substring matching against the `label` field.
3. WHEN a path exists, THE Path_Finder SHALL print each step of the path to stdout in the format `<NodeLabel> --[relation]--> <NodeLabel>`, one step per line, and SHALL exit with status code `0`.
4. WHEN no directed path exists between the two matched nodes, THE Path_Finder SHALL print a message stating that no path was found between the two entities and SHALL exit with status code `0`.
5. IF the name provided for `<A>` or `<B>` matches zero nodes, THEN THE Path_Finder SHALL print an error to stderr identifying which name was not found and SHALL exit with a non-zero status code.
6. IF the name provided for `<A>` or `<B>` matches more than one node, THEN THE Path_Finder SHALL print to stderr the list of ambiguous matches in the format `[<type>] <label> (<file>)`, one per line, with a message instructing the developer to provide a more specific name, and SHALL exit with a non-zero status code.
7. WHEN `graphify-out/graph.json` does not exist or cannot be parsed as valid JSON, THE Path_Finder SHALL print an error message to stderr and SHALL exit with a non-zero status code.

---

### Requirement 6: Explain Command

**User Story:** As a developer, I want to run `graphify explain "<concept>"` and receive a plain-English description of an entity, so that I can quickly understand what a module, class, or route does without reading its source.

#### Acceptance Criteria

1. WHEN the developer runs `graphify explain "<concept>"`, THE Explainer SHALL locate the node in `graphify-out/graph.json` whose `label` contains the concept string using case-insensitive substring matching; WHEN multiple nodes match, THE Explainer SHALL select the node whose `label` is shortest (fewest characters), breaking ties by node `id` lexicographic order.
2. THE Explainer SHALL produce an explanation that includes: the entity type, the file it is defined in, a list of entities it depends on (outgoing edges), and a list of entities that depend on it (incoming edges).
3. WHEN the matched node is an Express route handler, THE Explainer SHALL additionally include the HTTP method and route path in the explanation.
4. WHEN the matched node is a Prisma model, THE Explainer SHALL additionally include the model's fields and relations as extracted from the schema.
5. WHEN the matched node is a Dart class or widget, THE Explainer SHALL additionally include the class's supertype and any interfaces it implements.
6. IF no node matches the concept string, THEN THE Explainer SHALL print a message to stderr stating that the concept was not found and SHALL exit with a non-zero status code.
7. WHEN `graphify-out/graph.json` does not exist or cannot be parsed as valid JSON, THE Explainer SHALL print an error message to stderr and SHALL exit with a non-zero status code.

---

### Requirement 7: Incremental Update

**User Story:** As a developer, I want the graph to reflect the current state of the codebase after I make changes, so that queries remain accurate without requiring a full rebuild every time.

#### Acceptance Criteria

1. WHEN the developer runs `graphify update <file>`, THE Graph_Builder SHALL re-parse only the specified file — resolved relative to the current working directory — update the nodes declared in that file and the edges where that file is the source in `graphify-out/graph.json`, and leave all other nodes and edges unchanged; IF the file was not previously in the graph, THE Graph_Builder SHALL treat it as an add operation.
2. WHEN `graphify update <file>` completes, THE Graph_Builder SHALL print to stdout the number of nodes added, nodes updated, nodes removed, edges added, edges updated, and edges removed as separate labelled counts.
3. IF the specified file does not exist at the resolved path, THEN THE Graph_Builder SHALL print an error to stderr identifying the missing file and SHALL exit with a non-zero status code.
4. IF `graphify-out/graph.json` does not exist when `graphify update <file>` is run, THEN THE Graph_Builder SHALL print an error to stderr instructing the developer to run `graphify .` first and SHALL exit with a non-zero status code.
5. WHILE an incremental update is writing to `graphify-out/graph.json`, THE Graph_Store SHALL write to a temporary file first and then atomically replace the existing file, so that a concurrent read never observes a partially written graph.

---

### Requirement 8: CLI Usability

**User Story:** As a developer, I want clear help text and consistent exit codes from the CLI, so that I can integrate `graphify` into scripts and CI pipelines reliably.

#### Acceptance Criteria

1. WHEN the developer runs `graphify --help` or `graphify <command> --help`, THE CLI SHALL print to stdout a synopsis line, a description of each positional argument, a description of each available flag, and a one-line description for each command.
2. WHEN a command completes successfully, THE CLI SHALL exit with status code `0`.
3. WHEN a command fails due to a user error — including missing arguments, entity not found, graph not built, or any other invalid user input — THE CLI SHALL exit with status code `1`.
4. WHEN a command fails due to an internal error (file I/O failure, parse crash), THE CLI SHALL print a diagnostic message to stderr indicating the error cause and SHALL exit with status code `2`.
5. THE CLI SHALL accept a `--output json` flag on `query`, `path`, and `explain` commands.
6. WHEN the `--output json` flag is provided, THE CLI SHALL print the result as a valid JSON object to stdout instead of formatted text.
