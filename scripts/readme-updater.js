import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { logger } from './logger.js';
import { generateMarkdown, getStatsSummary } from './markdown-generator.js';

const START = '<!--START_STATS-->';
const END = '<!--END_STATS-->';

export class ReadmeUpdater {
  constructor(readmePath) {
    this.readmePath = readmePath;
  }

  async load() {
    if (!existsSync(this.readmePath)) {
      logger.warn('README.md not found, will create new file');
      return `# ${config.github.username}\n\n<!--START_STATS-->${START}${END}<!--END_STATS-->\n`;
    }
    const content = await readFile(this.readmePath, 'utf-8');
    if (!content.includes(START) || !content.includes(END)) {
      logger.warn('README.md missing stats markers, appending to end');
      return content + `\n${START}${END}<!--END_STATS-->\n`;
    }
    return content;
  }

  async update(stats) {
    const oldContent = await this.load();

    const newBlock = generateMarkdown(stats);

    const regex = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`, 'g');
    const newContent = oldContent.replace(regex, `${START}\n${newBlock}\n${END}`);

    await writeFile(this.readmePath, newContent, 'utf-8');
    logger.info('README.md updated successfully');
    return newContent;
  }

  async getDiff(stats) {
    const oldContent = await this.load();
    const newBlock = generateMarkdown(stats);
    const regex = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`, 'g');
    const newContent = oldContent.replace(regex, `${START}\n${newBlock}\n${END}`);
    return newContent !== oldContent;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
