#!/usr/bin/env node
/**
 * HIVE MIND — Multi-Agent AI Workspace
 * Entry point: node hive.js [options]
 */

require('dotenv').config();
const { program } = require('commander');
const HiveOrchestrator = require('./core/orchestrator');
const chalk = require('chalk');

const BANNER = `
${chalk.cyan('╔══════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.yellow('🦾 HIVE MIND')} — Multi-Agent Workspace  ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════╝')}
`;

program
  .name('hive')
  .description('Multi-agent AI workspace')
  .version('1.0.0');

program
  .command('run')
  .description('Start the full agent pipeline on a task')
  .option('-t, --task <task>', 'Task description')
  .option('-p, --project <name>', 'Work on a specific project folder')
  .action(async (opts) => {
    console.log(BANNER);
    const hive = new HiveOrchestrator();
    if (opts.project) {
      await hive.runProject(opts.project);
    } else if (opts.task) {
      await hive.runTask(opts.task);
    } else {
      await hive.runInteractive();
    }
  });

program
  .command('review')
  .description('APEX reviews all pending proposals in the queue')
  .action(async () => {
    console.log(BANNER);
    const hive = new HiveOrchestrator();
    await hive.runApexReview();
  });

program
  .command('propose')
  .description('Submit a new project proposal to APEX')
  .requiredOption('-t, --title <title>', 'Project title')
  .option('-d, --desc <description>', 'Brief description')
  .option('--agent <agent>', 'Proposing agent (default: nova)', 'nova')
  .action(async (opts) => {
    console.log(BANNER);
    const hive = new HiveOrchestrator();
    await hive.submitProposal({
      title: opts.title,
      description: opts.desc,
      proposedBy: opts.agent,
    });
  });

program
  .command('agent <name>')
  .description('Chat directly with a specific agent')
  .action(async (name) => {
    console.log(BANNER);
    const hive = new HiveOrchestrator();
    await hive.chatWithAgent(name);
  });

program
  .command('status')
  .description('Show all project statuses and pending queue')
  .action(async () => {
    console.log(BANNER);
    const hive = new HiveOrchestrator();
    await hive.showStatus();
  });

// Default: interactive mode
if (process.argv.length === 2) {
  console.log(BANNER);
  const hive = new HiveOrchestrator();
  hive.runInteractive();
} else {
  program.parse();
}