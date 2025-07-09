# MindForge MCP Server - File Map

## Repository Structure

```
mindforge-mcp/
├── src/                          # Source code directory
│   └── index.ts                  # Main MCP server implementation (17.4 KB)
│                                 # - Server setup and configuration
│                                 # - Tool handlers (get_recipe, apply_recipe)
│                                 # - YAML recipe loading and formatting
│                                 # - Dynamic workflow sequence detection
│
├── dist/                         # Compiled JavaScript (git-ignored)
│   ├── index.js                  # Compiled server code
│   └── index.js.map              # Source map for debugging
│
├── recipes/                      # YAML recipe definitions (14 files)
│   ├── 01_explore_archaeologist.yaml      # Discovery & understanding mode
│   ├── 02_brainstorm_inventor.yaml        # Creative ideation mode
│   ├── 03_validate_guardian.yaml          # Risk assessment mode
│   ├── 04_refactor_craftsman.yaml         # Code transformation mode
│   ├── 05_debug_detective.yaml            # Problem investigation mode
│   ├── 06_review_inspector.yaml           # Code review mode
│   ├── 07_estimate_forecaster.yaml        # Time/effort estimation mode
│   ├── 08_architect_masterbuilder.yaml    # System design mode
│   ├── 09_simplify_minimalist.yaml        # Complexity reduction mode
│   ├── 10_cleanup_curator.yaml            # Repository maintenance mode
│   ├── 11_learn_scholar.yaml              # Knowledge extraction mode
│   ├── 12_plan_strategist.yaml            # Sprint planning mode
│   ├── 13_audit_prompt_audit.yaml         # Prompt engineering mode
│   └── 14_validation_prior_to_close.yaml  # Final validation mode
│
├── package.json                  # Node.js project configuration
│                                 # - Dependencies: @modelcontextprotocol/sdk, js-yaml
│                                 # - Scripts: build, start, dev, watch
│
├── tsconfig.json                 # TypeScript compiler configuration
│                                 # - Target: ES2022
│                                 # - Module: ES2022
│                                 # - Strict mode enabled
│
├── README.md                     # Project documentation
│                                 # - Overview and features
│                                 # - Installation instructions
│                                 # - Workflow phases explanation
│                                 # - Usage examples
│
├── FILE_MAP.md                   # This file - repository structure guide
│
├── .gitignore                    # Git ignore rules
│                                 # - node_modules/
│                                 # - dist/
│                                 # - *.log, .env, .DS_Store
│
└── mindforge-config.json         # MindForge configuration
                                  # - Recipe metadata
                                  # - Usage guidelines
                                  # - Workflow definitions

```

## Key Components

### Core Server (`src/index.ts`)
- **MindForgeServer class**: Main server implementation
- **Tool handlers**: 
  - `mindforge_get_recipe`: Returns recipe framework/template
  - `mindforge_apply_recipe`: Returns recipe template for actual analysis
- **Dynamic loading**: Scans recipes/ directory for YAML files
- **Sequence detection**: Extracts workflow order from filenames (01_, 02_, etc.)

### Recipe Files (`recipes/*.yaml`)
Each YAML file contains:
- **Persona definition**: Name, mindset, philosophy, approach
- **Core mission**: The recipe's primary purpose
- **Behavioral guidelines**: Step-by-step instructions
- **Output format**: Expected structure of analysis
- **Mode variants**: Lite/Standard/Full analysis depths
- **Usage context**: When to use, primary use cases

### Configuration (`mindforge-config.json`)
- Recipe metadata and descriptions
- Workflow phase definitions
- Usage guidelines and patterns
- Integration notes

## Workflow Phases

1. **Discovery Phase** (Recipes 1-3)
   - explore → brainstorm → validate

2. **Planning Phase** (Recipes 7-8, 12)
   - estimate → architect → plan

3. **Implementation Phase** (Recipes 4-6, 9-10)
   - refactor → debug → review → simplify → cleanup

4. **Quality Phase** (Recipe 14)
   - commit (final validation)

5. **Special Purpose** (Recipe 13)
   - prompt_engineer (for prompt quality)

## Recent Changes
- Updated tool descriptions to clarify they return templates, not analysis
- Added workflow phases to MCP server description for better discoverability
- All TypeScript compiled and ready for production use