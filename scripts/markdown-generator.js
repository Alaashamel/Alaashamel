import config from '../config/config.js';
import { escapeXml, truncate } from './utils.js';

export function generateMarkdown(stats) {
  const width = config.readme.imageWidth;
  const alignment = config.readme.alignment || 'center';
  const spacing = config.readme.spacing || '\n\n';
  const title = config.readme.title || '';

  const cards = config.cardOrder.map((type) => {
    const path = config.output[`${type}Card`] || config.output[`${type}card`];
    return `<img src="${path}" width="${width}" align="${alignment}">`;
  });

  let md = `<p align="${alignment}">${cards[0]}${config.cardOrder.length > 1 ? '<br>' : ''}${cards[1] || ''}</p>`;

  if (config.cardOrder.length > 2) {
    md += `<p align="${alignment}">${cards[2]}${config.cardOrder.length > 3 ? '<br>' : ''}${cards[3] || ''}</p>`;
  }

  if (title) {
    md = `<p align="${alignment}"><h2>${title}</h2></p>\n\n${md}`;
  }

  return md;
}

export function getStatsSummary(stats) {
  const lines = [];
  lines.push(`📊 GitHub Statistics for **${stats.profile.name || stats.profile.login}**`);
  lines.push('');
  lines.push(`- ⭐ **${stats.basic.stars ?? 'N/A'}** total stars earned`);
  lines.push(`- 🍴 **${stats.basic.forks ?? 'N/A'}** total forks`);
  lines.push(`- 🔀 **${stats.activity.prsOpened ?? 'N/A'}** pull requests opened`);
  lines.push(`- 📝 **${stats.activity.issuesOpened ?? 'N/A'}** issues opened`);
  lines.push(`- 🌍 **${stats.profile.followers ?? 0}** followers`);
  return lines.join('\n');
}

export function generateCardMarkdown(type, path) {
  const width = config.readme.imageWidth;
  const alignment = config.readme.alignment || 'center';
  return `<p align="${alignment}"><img src="${path}" width="${width}" align="${alignment}"></p>`;
}
