# MindForge MCP Server

Recipe-based AI development assistant with numbered analytical workflow for systematic development.

## Overview

MindForge provides a systematic, sequential workflow of analytical "recipes" designed to guide development projects from exploration through completion. Instead of ad-hoc analysis, it offers structured methodologies for different phases of development.

## Key Features

- **Sequential Workflow**: 14 numbered recipes designed to be used in order (1-12 for development, 13 for prompt engineering, 14 for final validation)
- **Recipe-Based Analysis**: Clear methodologies instead of confusing "personas"
- **Dynamic Sequence Detection**: Automatically extracts workflow order from YAML filenames
- **YAML-First Architecture**: Single source of truth in YAML files
- **Mode Flexibility**: Lite (5-15min), Standard (20-40min), Full (45+min) analysis depth

## Available Recipes

1. **explore** - The Archaeologist (Discovery & Understanding)
2. **brainstorm** - The Inventor (Ideation & Creative Solutions) 
3. **validate** - The Guardian (Risk Assessment & Validation)
4. **refactor** - The Craftsman (Code Transformation & Migration)
5. **debug** - The Detective (Systematic Investigation & Problem Solving)
6. **review** - The Inspector (Quality Assessment & Code Review)
7. **estimate** - The Forecaster (Time & Complexity Assessment)
8. **architect** - The Master Builder (System Design & Architecture)
9. **simplify** - The Minimalist (Complexity Reduction & Elegance)
10. **cleanup** - The Curator (Repository Maintenance & Organization)
11. **learn** - The Scholar (Knowledge Extraction & Research)
12. **plan** - The Strategist (Sprint Planning & Task Decomposition)
13. **prompt_engineer** - The Prompt Engineer (Framework Compliance & Refinement)
14. **commit** - The Controller (Final Validation & Execution)

## Installation

```bash
npm install
npm run build
```

## Usage

MindForge provides two main tools:

### Get Recipe (Planning Phase)
```
mindforge_get_recipe
```
Use this to understand the analytical approach before applying it.

### Apply Recipe (Execution Phase)  
```
mindforge_apply_recipe
```
Use this to actually analyze your code/content using the chosen recipe.

## Workflow

The recipes are designed as a systematic workflow:

1. **Discovery Phase** (1-3): explore → brainstorm → validate
2. **Planning Phase** (7-8, 12): estimate → architect → plan  
3. **Implementation Phase** (4-6, 9-10): refactor → debug → review → simplify → cleanup
4. **Quality Phase** (14): commit
5. **Special** (13): prompt_engineer (for prompt quality assessment)

## Configuration

MindForge reads YAML recipe files from a configured directory. Each recipe is a YAML file with sequence number prefix (e.g., `01_explore_archaeologist.yaml`).

## Architecture

- **2 Tools**: Simple, focused interface instead of 14 separate tools
- **YAML-First**: All recipe data comes directly from YAML files
- **Dynamic Discovery**: Automatically scans and loads available recipes
- **Sequence-Aware**: Extracts workflow order from filenames

## License

MIT