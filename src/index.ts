#!/usr/bin/env node

/**
 * MindForge MCP Server
 * Provides access to sophisticated YAML-based AI personas for development tasks
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - use environment variable or default to recipes directory
const CONFIG_FILE = path.join(__dirname, '..', 'mindforge-config.json');
const YAML_PROMPTS_DIR = process.env.MINDFORGE_YAML_DIR || path.join(__dirname, '..', 'recipes');

interface MindForgeConfig {
  mindforge: {
    name: string;
    description: string;
    version: string;
    workflow?: any;
    usage_guidelines?: any;
    integration_notes?: any;
  };
}

interface YamlPrompt {
  name: string;
  title: string;
  version: string;
  aliases?: string[];
  persona: {
    name: string;
    mindset: string;
    philosophy: string;
    approach: string;
  };
  core_mission: string;
  primary_use_cases?: string[];
  when_to_use?: string;
  avoid_when?: string;
  typical_inputs?: string[];
  output_style?: string;
  mode_variants?: Record<string, any>;
  behavioral_guidelines?: any;
  output_format?: string;
  [key: string]: any;
}

class MindForgeServer {
  private server: Server;
  private config!: MindForgeConfig;
  private loadedPrompts: Map<string, YamlPrompt> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'mindforge',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.loadConfiguration();
    this.loadYamlPrompts();
  }

  private loadConfiguration(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
        this.config = JSON.parse(configContent);
      } else {
        // Default configuration if file doesn't exist
        this.config = {
          mindforge: {
            name: 'MindForge',
            description: 'Recipe-based AI development assistant',
            version: '2.0.0'
          }
        };
      }
    } catch (error) {
      console.error(`Warning: Failed to load MindForge configuration: ${error}`);
      // Use default configuration
      this.config = {
        mindforge: {
          name: 'MindForge',
          description: 'Recipe-based AI development assistant',
          version: '2.0.0'
        }
      };
    }
  }

  private loadYamlPrompts(): void {
    if (!fs.existsSync(YAML_PROMPTS_DIR)) {
      console.error(`Warning: YAML prompts directory not found: ${YAML_PROMPTS_DIR}`);
      console.error('Please set MINDFORGE_YAML_DIR environment variable or create recipes directory');
      return;
    }

    const yamlFiles = fs.readdirSync(YAML_PROMPTS_DIR).filter(file => file.endsWith('.yaml'));
    
    for (const file of yamlFiles) {
      try {
        const yamlPath = path.join(YAML_PROMPTS_DIR, file);
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const promptData = yaml.load(yamlContent) as YamlPrompt;
        
        if (promptData && promptData.name) {
          const recipeKey = promptData.name;
          this.loadedPrompts.set(recipeKey, promptData);
          console.error(`✅ Loaded ${recipeKey}: ${promptData.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load YAML prompt from ${file}: ${error}`);
      }
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'mindforge_get_recipe',
            description: 'Get a specialized analytical recipe for development tasks. Use recipes 1-12 in sequence for systematic workflow. Audit (13) is for prompt engineering only.',
            inputSchema: {
              type: 'object',
              properties: {
                recipe: {
                  type: 'string',
                  enum: Array.from(this.loadedPrompts.keys()),
                  description: this.buildRecipeDescription()
                },
                context: {
                  type: 'string',
                  description: 'The code, system, or problem context to analyze'
                },
                mode: {
                  type: 'string',
                  enum: ['lite', 'standard', 'full'],
                  description: 'Analysis depth: lite (5-15min), standard (20-40min), full (45+min)',
                  default: 'standard'
                },
                focus: {
                  type: 'string',
                  description: 'Optional specific focus area or constraint'
                }
              },
              required: ['recipe', 'context']
            }
          },
          {
            name: 'mindforge_apply_recipe',
            description: 'Apply a recipe to analyze actual code/content. Use recipes 1-12 in sequence for systematic workflow. Audit (13) is for prompt engineering only.',
            inputSchema: {
              type: 'object',
              properties: {
                recipe: {
                  type: 'string',
                  enum: Array.from(this.loadedPrompts.keys()),
                  description: this.buildRecipeDescription()
                },
                target: {
                  type: 'string',
                  description: 'The actual code content, file path, or system to analyze'
                },
                mode: {
                  type: 'string',
                  enum: ['lite', 'standard', 'full'],
                  description: 'Analysis depth',
                  default: 'standard'
                },
                focus: {
                  type: 'string',
                  description: 'Optional specific focus area'
                }
              },
              required: ['recipe', 'target']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'mindforge_get_recipe') {
        return this.handleGetRecipe(args as { recipe: string; context: string; mode?: string; focus?: string });
      }
      
      if (name === 'mindforge_apply_recipe') {
        return this.handleApplyRecipe(args as { recipe: string; target: string; mode?: string; focus?: string });
      }
      
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    });
  }

  private handleGetRecipe(args: { recipe: string; context: string; mode?: string; focus?: string }) {
    const { recipe, context, mode = 'standard', focus } = args;
    
    const yamlPrompt = this.loadedPrompts.get(recipe);

    if (!yamlPrompt) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown recipe: ${recipe}`);
    }

    // Build the recipe framework using YAML data directly
    const recipeText = this.buildRecipeFramework(yamlPrompt, context, mode, focus);

    return {
      content: [
        {
          type: 'text',
          text: recipeText
        }
      ]
    };
  }

  private handleApplyRecipe(args: { recipe: string; target: string; mode?: string; focus?: string }) {
    const { recipe, target, mode = 'standard', focus } = args;
    
    const yamlPrompt = this.loadedPrompts.get(recipe);

    if (!yamlPrompt) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown recipe: ${recipe}`);
    }

    // Apply the recipe to analyze the actual target using YAML data directly
    const analysis = this.applyRecipeAnalysis(yamlPrompt, target, mode, focus);

    return {
      content: [
        {
          type: 'text',
          text: analysis
        }
      ]
    };
  }

  private getRecipeSequence(filename: string): number | null {
    // Extract sequence number from filename like "01_explore_archaeologist.yaml"
    const match = filename.match(/^(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }

  private getFilenameForRecipe(recipeName: string): string | null {
    if (!fs.existsSync(YAML_PROMPTS_DIR)) {
      return null;
    }
    
    // Find the filename that contains this recipe name
    const yamlFiles = fs.readdirSync(YAML_PROMPTS_DIR).filter(file => file.endsWith('.yaml'));
    return yamlFiles.find(file => {
      try {
        const yamlPath = path.join(YAML_PROMPTS_DIR, file);
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const promptData = yaml.load(yamlContent) as YamlPrompt;
        return promptData && promptData.name === recipeName;
      } catch {
        return false;
      }
    }) || null;
  }

  private buildRecipeDescription(): string {
    // Build dynamic recipe description with sequence numbers from filenames
    const sequencedRecipes: Array<{key: string, sequence: number, name: string}> = [];
    const specialRecipes: string[] = [];

    for (const [key, yamlPrompt] of this.loadedPrompts.entries()) {
      const filename = this.getFilenameForRecipe(key);
      const sequence = filename ? this.getRecipeSequence(filename) : null;
      const name = yamlPrompt.persona?.name || yamlPrompt.title;
      
      if (sequence !== null) {
        sequencedRecipes.push({ key, sequence, name });
      } else {
        specialRecipes.push(`${key} (${name})`);
      }
    }

    // Sort by sequence number
    sequencedRecipes.sort((a, b) => a.sequence - b.sequence);
    
    // Build description
    const workflow = sequencedRecipes
      .map(r => `${r.sequence}. ${r.key}`)
      .join(' → ');
    
    const special = specialRecipes.length > 0 
      ? `\nSpecial: ${specialRecipes.join(', ')}`
      : '';

    return `Sequential workflow: ${workflow}${special}`;
  }

  private buildRecipeFramework(
    yamlPrompt: YamlPrompt,
    context: string,
    mode: string,
    focus?: string
  ): string {
    const filename = this.getFilenameForRecipe(yamlPrompt.name);
    const sequence = filename ? this.getRecipeSequence(filename) : null;
    const sequenceInfo = sequence ? `Recipe #${sequence}` : 'Special Recipe';
    
    let recipe = `# 📋 ${sequenceInfo}: ${yamlPrompt.title}\n\n`;

    recipe += `**Selected Recipe**: ${yamlPrompt.persona.name}\n`;
    recipe += `**Sequence Position**: ${sequenceInfo}\n`;
    recipe += `**Best Used For**: ${yamlPrompt.when_to_use || 'See usage context below'}\n`;
    recipe += `**Analysis Mode**: ${mode}\n\n`;

    if (sequence) {
      recipe += `**Workflow Context**: This is step ${sequence} in the systematic MindForge workflow. `;
      if (sequence === 1) {
        recipe += `Start here for new projects or unfamiliar codebases.\n`;
      } else if (sequence <= 3) {
        recipe += `Discovery and ideation phase.\n`;
      } else if (sequence <= 8) {
        recipe += `Planning and architecture phase.\n`;
      } else if (sequence <= 12) {
        recipe += `Implementation and refinement phase.\n`;
      } else if (sequence === 14) {
        recipe += `Final validation phase.\n`;
      }
      recipe += '\n';
    }

    // Recipe overview
    recipe += `## Recipe Overview\n`;
    recipe += `**Mindset**: ${yamlPrompt.persona.mindset}\n`;
    recipe += `**Philosophy**: ${yamlPrompt.persona.philosophy}\n`;
    recipe += `**Approach**: ${yamlPrompt.persona.approach}\n\n`;

    // Step-by-step recipe
    recipe += `## Step-by-Step Recipe\n\n`;
    recipe += `### 1. Context Preparation\n`;
    recipe += `- Input: ${context}\n`;
    if (focus) recipe += `- Focus Area: ${focus}\n`;
    recipe += `- Analysis Depth: ${mode} mode\n\n`;

    // Recipe steps from behavioral guidelines
    if (yamlPrompt.behavioral_guidelines) {
      recipe += `### 2. Analysis Steps\n`;
      recipe += this.formatRecipeSteps(yamlPrompt.behavioral_guidelines);
      recipe += '\n';
    }

    // Expected outcome
    if (yamlPrompt.output_format) {
      recipe += `### 3. Expected Output Format\n`;
      recipe += yamlPrompt.output_format + '\n\n';
    }

    // Usage tips
    recipe += `### 4. Recipe Usage Tips\n`;
    if (yamlPrompt.primary_use_cases) {
      recipe += `- **Primary Use Cases**: ${yamlPrompt.primary_use_cases.join(', ')}\n`;
    }
    if (yamlPrompt.avoid_when) {
      recipe += `- **Avoid When**: ${yamlPrompt.avoid_when}\n`;
    }
    if (yamlPrompt.typical_inputs) {
      recipe += `- **Typical Inputs**: ${yamlPrompt.typical_inputs.join(', ')}\n`;
    }
    recipe += '\n';

    recipe += `---\n\n`;
    recipe += `**Next Step**: Use \`mindforge_apply_recipe\` with your actual code/content to get concrete analysis results.`;

    return recipe;
  }

  private applyRecipeAnalysis(
    yamlPrompt: YamlPrompt,
    target: string,
    mode: string,
    focus?: string
  ): string {
    // This creates the full prompt for actual analysis
    let analysis = `# 🔍 Analysis Report: ${yamlPrompt.title}\n\n`;

    // Persona Introduction
    analysis += `**Analyst**: ${yamlPrompt.persona.name}\n`;
    analysis += `**Mindset**: ${yamlPrompt.persona.mindset}\n`;
    analysis += `**Philosophy**: ${yamlPrompt.persona.philosophy}\n`;
    analysis += `**Approach**: ${yamlPrompt.persona.approach}\n\n`;

    // Core Mission
    analysis += `## Core Mission\n${yamlPrompt.core_mission}\n\n`;

    // Mode-specific instructions
    if (yamlPrompt.mode_variants && yamlPrompt.mode_variants[mode]) {
      const modeConfig = yamlPrompt.mode_variants[mode];
      analysis += `## ${mode.toUpperCase()} Mode Selected\n`;
      analysis += `**Description**: ${modeConfig.description}\n`;
      if (modeConfig.time_estimate) {
        analysis += `**Time Estimate**: ${modeConfig.time_estimate}\n`;
      }
      if (modeConfig.output) {
        analysis += `**Expected Output**: ${modeConfig.output}\n`;
      }
      analysis += '\n';
    }

    // Behavioral Guidelines
    if (yamlPrompt.behavioral_guidelines) {
      analysis += `## Behavioral Guidelines\n`;
      analysis += this.formatStructuredContent(yamlPrompt.behavioral_guidelines);
      analysis += '\n';
    }

    // Analysis Target
    analysis += `## Your Task\n`;
    analysis += `**Target to Analyze**:\n\`\`\`\n${target}\n\`\`\`\n\n`;
    
    if (focus) {
      analysis += `**Specific Focus**: ${focus}\n\n`;
    }

    // Output Format
    if (yamlPrompt.output_format) {
      analysis += `## Expected Output Format\n${yamlPrompt.output_format}\n\n`;
    }

    // Usage Context
    analysis += `## Usage Context\n`;
    if (yamlPrompt.primary_use_cases) {
      analysis += `**Primary Use Cases**: ${yamlPrompt.primary_use_cases.join(', ')}\n`;
    }
    if (yamlPrompt.when_to_use) {
      analysis += `**When to Use**: ${yamlPrompt.when_to_use}\n`;
    }
    if (yamlPrompt.output_style) {
      analysis += `**Output Style**: ${yamlPrompt.output_style}\n`;
    }
    analysis += '\n';

    // Add wisdom notes
    if (yamlPrompt.wisdom_notes) {
      analysis += `## Wisdom Notes\n${yamlPrompt.wisdom_notes}\n\n`;
    }

    // Final instructions
    analysis += `---\n\n`;
    analysis += `Now, embody ${yamlPrompt.persona.name} and analyze the provided target `;
    analysis += `using ${mode} mode depth. Apply your specialized expertise and perspective `;
    analysis += `to deliver insights that align with your persona's strengths and approach.`;

    return analysis;
  }

  private formatRecipeSteps(content: any): string {
    let steps = '';
    let stepNumber = 1;
    
    if (typeof content === 'object' && content !== null) {
      Object.entries(content).forEach(([key, value]) => {
        steps += `**Step ${stepNumber}: ${key}**\n`;
        if (Array.isArray(value)) {
          value.forEach(item => {
            steps += `- ${item}\n`;
          });
        } else if (typeof value === 'string') {
          steps += `- ${value}\n`;
        }
        steps += '\n';
        stepNumber++;
      });
    }
    
    return steps;
  }

  private formatStructuredContent(content: any, level: number = 0): string {
    const indent = '  '.repeat(level);
    let result = '';
    
    if (typeof content === 'string') {
      result += `${indent}- ${content}\n`;
    } else if (Array.isArray(content)) {
      content.forEach(item => {
        result += `${indent}- ${item}\n`;
      });
    } else if (typeof content === 'object' && content !== null) {
      Object.entries(content).forEach(([key, value]) => {
        result += `${indent}**${key}**:\n`;
        result += this.formatStructuredContent(value, level + 1);
      });
    }
    
    return result;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🔥 MindForge MCP server running on stdio');
    console.error(`📍 Config: ${CONFIG_FILE}`);
    console.error(`📁 YAML Prompts: ${YAML_PROMPTS_DIR}`);
    console.error(`✨ Loaded ${this.loadedPrompts.size} recipes`);
  }
}

// Create and run the server
const server = new MindForgeServer();
server.run().catch(console.error);

export default MindForgeServer;