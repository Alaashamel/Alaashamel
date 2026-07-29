import config from '../config/config.js';
import { validateConfig } from '../config/config.js';
import { GitHubGraphQLClient } from './github-graphql.js';
import { GitHubStats } from './github-stats.js';
import { generateStatsCard, generateLanguagesCard, generateStreakCard, generateContributionCard, resolveTheme } from './svg-generator.js';
import { ReadmeUpdater } from './readme-updater.js';
import { logger } from './logger.js';
import { writeFile, mkdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function ensureDir(pathStr) {
  if (!existsSync(pathStr)) {
    await mkdir(pathStr, { recursive: true });
  }
}

function getTheme() {
  return resolveTheme(config.theme.mode);
}

async function generateSvg(filename, svgContent) {
  const outPath = join(__dirname, '..', filename);
  await ensureDir(dirname(outPath));
  await writeFile(outPath, svgContent, 'utf-8');
  logger.info(`SVG written: ${outPath}`);
}

async function main() {
  logger.section('GitHub Statistics Engine');
  logger.info('Validating configuration...');
  validateConfig();
  logger.info('Configuration valid');

  const client = new GitHubGraphQLClient(config.github.token);
  const username = config.github.username;

  logger.section('Fetching GitHub Data');
  const rawData = await client.fetchUserStats(username);
  logger.info('Raw data received, processing...');

  const stats = new GitHubStats(rawData).getAllStats();
  logger.info(`Processing stats for: ${stats.profile.login}`);

  logger.section('Generating SVG Cards');
  const theme = getTheme();

  const generatedCards = [];

  for (const cardType of config.cardOrder) {
    let svg = '';
    switch (cardType) {
      case 'stats':
        svg = generateStatsCard(stats, theme);
        break;
      case 'languages':
        svg = generateLanguagesCard(stats.languages, theme);
        break;
      case 'streak':
        svg = generateStreakCard(stats.streak, stats, theme);
        break;
      case 'contribution':
        svg = generateContributionCard(stats, theme);
        break;
      default:
        logger.warn(`Unknown card type: ${cardType}`);
        continue;
    }

    const outFile = config.output[`${cardType}Card`];
    await generateSvg(outFile, svg);
    generatedCards.push(outFile);
  }

  logger.section('Generation Complete');
  logger.info(`Generated ${generatedCards.length} SVG cards`);
  generatedCards.forEach((c) => logger.info(`  - ${c}`));
  logger.info(`README updated: ${config.output.readmePath}`);
  logger.info('Done.');
}

main().catch((err) => {
  logger.error('Fatal error', { error: err.message, stack: err.stack });
  process.exit(1);
});
