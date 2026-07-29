import config from '../config/config.js';
import { logger } from './logger.js';
import { formatNumber } from './utils.js';

let svgCounter = 0;

function generateId() {
  svgCounter++;
  return `gs-${svgCounter}`;
}

function escapeAttr(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function wrapText(text, maxLen) {
  if (!text || text.length <= maxLen) return [text || ''];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxLen) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 2);
}

export function generateStatsCard(stats, theme) {
  const w = config.cardSizes.stats.width;
  const h = config.cardSizes.stats.height;
  const p = config.layout.cardPadding;
  const radius = config.layout.cardBorderRadius;
  const show = config.show;
  const icons = config.icons;
  const lang = config.languages;
  const langs = stats.languages || [];

  const items = [];
  if (show.followers) items.push({ icon: icons.enabled ? '👥' : '', label: 'Followers', value: formatNumber(stats.basic.followers) });
  if (show.stars) items.push({ icon: icons.enabled ? '⭐' : '', label: 'Stars', value: formatNumber(stats.basic.stars) });
  if (show.forks) items.push({ icon: icons.enabled ? '🍴' : '', label: 'Forks', value: formatNumber(stats.basic.forks) });
  if (show.contributionsThisYear) items.push({ icon: icons.enabled ? '🔥' : '', label: 'Contributions', value: formatNumber(stats.basic.contributionsThisYear) });
  if (show.prsOpened) items.push({ icon: icons.enabled ? '📥' : '', label: 'PRs', value: formatNumber(stats.activity.prsOpened) });
  if (show.issuesOpened) items.push({ icon: icons.enabled ? '📝' : '', label: 'Issues', value: formatNumber(stats.activity.issuesOpened) });

  const cols = Math.max(1, Math.min(3, items.length));
  const rows = Math.ceil(items.length / cols);

  const usableW = w - p * 2;
  const usableH = h - p * 2 - 40;
  const gap = 12;
  const boxW = (usableW - gap * (cols - 1)) / cols;
  const boxH = (usableH - gap * (rows - 1)) / rows;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  if (config.svg.shadows && config.svg.gradients) {
    svg += `
      <defs>
        <filter id="shadow-${generateId()}" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.25" flood-color="${theme.shadow}"/>
        </filter>
        <linearGradient id="grad-${generateId()}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${theme.gradientStart}"/>
          <stop offset="100%" stop-color="${theme.gradientEnd}"/>
        </linearGradient>
      </defs>`;
  }

  svg += `
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${theme.background}" ${config.svg.shadows ? `filter="url(#shadow-${generateId()})"` : ''}/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="none" stroke="${theme.border}" stroke-width="1"/>
    <text x="${w/2}" y="${p + 20}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.title}" font-weight="${config.fonts.weights.title}" fill="${theme.title}">${escapeXml(stats.profile.name || stats.profile.login)}</text>
  `;

  for (let i = 0; i < items.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = p + col * (boxW + gap);
    const y = p + 40 + row * (boxH + gap);

    svg += `
      <rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="8" fill="${theme.progressBackground || theme.background}" opacity="0.6"/>
      <text x="${x + boxW/2}" y="${y + boxH/2 - 8}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${icons.enabled ? 16 : 0}" fill="${theme.text}">${escapeXml(items[i].icon)}</text>
      <text x="${x + boxW/2}" y="${y + boxH/2 + 14}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statValue}" font-weight="${config.fonts.weights.value}" fill="${theme.primary || theme.text}">${escapeXml(items[i].value)}</text>
      <text x="${x + boxW/2}" y="${y + boxH/2 + 32}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statLabel}" fill="${theme.secondary || theme.text}">${escapeXml(items[i].label)}</text>
    `;
  }

  svg += '</svg>';
  return svg;
}

export function generateLanguagesCard(languages, theme) {
  const w = config.cardSizes.languages.width;
  const h = config.cardSizes.languages.height;
  const p = config.layout.cardPadding;
  const radius = config.layout.cardBorderRadius;
  const showPct = config.languages.showPercentages;
  const showBytes = config.languages.showBytes;

  const items = languages.slice(0, config.languages.count);
  const maxBytes = Math.max(...items.map(l => l.bytes), 1);

  const labelX = p;
  const barX = p + 80;
  const barW = w - p * 2 - 80 - 20;
  const itemH = 28;
  const titleH = 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  if (config.svg.shadows && config.svg.gradients) {
    svg += `
      <defs>
        <filter id="shadow-${generateId()}" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.25" flood-color="${theme.shadow}"/>
        </filter>
        <linearGradient id="grad-${generateId()}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${theme.gradientStart}"/>
          <stop offset="100%" stop-color="${theme.gradientEnd}"/>
        </linearGradient>
      </defs>`;
  }

  svg += `
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${theme.background}" ${config.svg.shadows ? `filter="url(#shadow-${generateId()})"` : ''}/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="none" stroke="${theme.border}" stroke-width="1"/>
    <text x="${w/2}" y="${p + 20}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.title}" font-weight="${config.fonts.weights.title}" fill="${theme.title}">Top Languages</text>
  `;

  items.forEach((lang, i) => {
    const y = titleH + i * itemH;
    const barY = y + 8;
    const barH = 12;
    const fillW = (lang.bytes / maxBytes) * (barW - 4);

    svg += `
      <circle cx="${labelX + 6}" cy="${barY + barH/2}" r="8" fill="${lang.color}"/>
      <text x="${labelX + 20}" y="${barY + barH/2 + 4}" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.small}" fill="${theme.text}">${escapeXml(lang.name)}</text>
      <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="3" fill="${theme.progressBackground || theme.background}"/>
      <rect x="${barX}" y="${barY}" width="${fillW}" height="${barH}" rx="3" fill="${lang.color}"/>
      <text x="${barX + barW + 5}" y="${barY + barH/2 + 4}" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.small}" fill="${theme.secondary || theme.text}">
        ${showPct ? `${lang.percentage}%` : ''}${showBytes && showPct ? ' ' : ''}${showBytes ? `${lang.bytes > 1024*1024 ? (lang.bytes/(1024*1024)).toFixed(1) + ' MB' : (lang.bytes/1024).toFixed(0) + ' KB'}` : ''}
      </text>
    `;
  });

  svg += '</svg>';
  return svg;
}

export function generateStreakCard(streakStats, stats, theme) {
  const w = config.cardSizes.streak.width;
  const h = config.cardSizes.streak.height;
  const p = config.layout.cardPadding;
  const radius = config.layout.cardBorderRadius;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  if (config.svg.shadows && config.svg.gradients) {
    svg += `
      <defs>
        <filter id="shadow-${generateId()}" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.25" flood-color="${theme.shadow}"/>
        </filter>
      </defs>`;
  }

  svg += `
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${theme.background}" ${config.svg.shadows ? `filter="url(#shadow-${generateId()})"` : ''}/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="none" stroke="${theme.border}" stroke-width="1"/>
    <text x="${w/2}" y="${p + 20}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.title}" font-weight="${config.fonts.weights.title}" fill="${theme.title}">GitHub Streak</text>
  `;

  const boxW = (w - p * 2 - 40) / 2;
  const boxH = 80;
  const box1Y = p + 50;
  const box2Y = box1Y + boxH + 20;

  svg += `
    <rect x="${p}" y="${box1Y}" width="${boxW}" height="${boxH}" rx="8" fill="${theme.progressBackground || theme.background}" opacity="0.6"/>
    <rect x="${p + boxW + 20}" y="${box1Y}" width="${boxW}" height="${boxH}" rx="8" fill="${theme.progressBackground || theme.background}" opacity="0.6"/>
    <text x="${p + boxW/2}" y="${box1Y + boxH/2 - 6}" text-anchor="middle" font-size="24" fill="${theme.primary || theme.text}">🔥</text>
    <text x="${p + boxW/2}" y="${box1Y + boxH/2 + 16}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statValue}" font-weight="${config.fonts.weights.value}" fill="${theme.primary || theme.text}">${streakStats.current}</text>
    <text x="${p + boxW/2}" y="${box1Y + boxH/2 + 34}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statLabel}" fill="${theme.secondary || theme.text}">Current Streak</text>
    <text x="${p + boxW + 20 + boxW/2}" y="${box1Y + boxH/2 - 6}" text-anchor="middle" font-size="24" fill="${theme.accent || theme.text}">🏆</text>
    <text x="${p + boxW + 20 + boxW/2}" y="${box1Y + boxH/2 + 16}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statValue}" font-weight="${config.fonts.weights.value}" fill="${theme.accent || theme.text}">${streakStats.longest}</text>
    <text x="${p + boxW + 20 + boxW/2}" y="${box1Y + boxH/2 + 34}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statLabel}" fill="${theme.secondary || theme.text}">Longest Streak</text>
  `;

  svg += `
    <rect x="${p}" y="${box2Y}" width="${w - p * 2}" height="50" rx="8" fill="${theme.progressBackground || theme.background}" opacity="0.6"/>
    <text x="${w/2}" y="${box2Y + 18}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statValue}" font-weight="${config.fonts.weights.value}" fill="${theme.primary || theme.text}">${formatNumber(streakStats.totalDays)}</text>
    <text x="${w/2}" y="${box2Y + 36}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statLabel}" fill="${theme.secondary || theme.text}">Total Contribution Days</text>
  `;

  svg += '</svg>';
  return svg;
}

export function generateContributionCard(stats, theme) {
  const w = config.cardSizes.contribution.width;
  const h = config.cardSizes.contribution.height;
  const p = config.layout.cardPadding;
  const radius = config.layout.cardBorderRadius;

  const days = Array.isArray(stats.contributionDays) ? stats.contributionDays : [];
  const totalContributions = typeof stats.basic.contributionsThisYear === 'string' ? parseInt(stats.basic.contributionsThisYear.replace(/,/g, '')) : (stats.basic.contributionsThisYear || 0);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  svg += `
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${theme.background}"/>
    <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="none" stroke="${theme.border}" stroke-width="1"/>
    <text x="${w/2}" y="${p + 20}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.title}" font-weight="${config.fonts.weights.title}" fill="${theme.title}">Contribution Summary</text>
  `;

  const statsList = [
    { label: 'Total This Year', value: formatNumber(totalContributions), color: theme.primary || theme.text },
    { label: 'PRs Opened', value: formatNumber(stats.activity.prsOpened || 0), color: theme.secondary || theme.text },
    { label: 'Issues Opened', value: formatNumber(stats.activity.issuesOpened || 0), color: theme.accent || theme.text },
    { label: 'Code Reviews', value: formatNumber(stats.activity.codeReviews || 0), color: theme.danger || theme.text },
  ];

  const boxW = (w - p * 2 - 30) / 4;
  const boxH = 80;
  const boxY = p + 50;

  statsList.forEach((item, i) => {
    const x = p + i * (boxW + 10);
    svg += `
      <rect x="${x}" y="${boxY}" width="${boxW}" height="${boxH}" rx="8" fill="${theme.progressBackground || theme.background}" opacity="0.6"/>
      <text x="${x + boxW/2}" y="${boxY + boxH/2 - 8}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statValue}" font-weight="${config.fonts.weights.value}" fill="${item.color}">${item.value}</text>
      <text x="${x + boxW/2}" y="${boxY + boxH/2 + 14}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statLabel}" fill="${theme.secondary || theme.text}">${escapeXml(item.label)}</text>
    `;
  });

  const totalPRs = String(stats.activity.prsOpened || '0');
  const mergeRate = typeof stats.activity.mergeRate === 'number' ? `${stats.activity.mergeRate}%` : '0%';

  svg += `
    <rect x="${p}" y="${boxY + boxH + 15}" width="${w - p * 2}" height="50" rx="8" fill="${theme.progressBackground || theme.background}" opacity="0.6"/>
    <text x="${w/2}" y="${boxY + boxH + 35}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statValue}" font-weight="${config.fonts.weights.value}" fill="${theme.primary || theme.text}">PR Merge Rate</text>
    <text x="${w/2}" y="${boxY + boxH + 50}" text-anchor="middle" font-family="${config.fonts.family}" font-size="${config.fonts.sizes.statLabel}" fill="${theme.secondary || theme.text}">${mergeRate} of ${totalPRs} PRs merged</text>
  `;

  svg += '</svg>';
  return svg;
}

export function resolveTheme(themeMode) {
  const mode = themeMode || config.theme.mode;
  if (mode === 'light') {
    return {
      background: config.colors.background || '#ffffff',
      border: config.colors.border || '#e1e4e8',
      title: config.colors.title || '#24292f',
      text: config.colors.text || '#57606a',
      icon: config.colors.icon || '#0969da',
      primary: config.colors.primary || '#0969da',
      secondary: config.colors.secondary || '#1a7f37',
      progressBar: config.colors.progressBar || '#0969da',
      progressBackground: config.colors.progressBackground || '#e1e4e8',
      shadow: config.colors.shadow || '#00000020',
      gradientStart: config.colors.gradientStart || '#0969da',
      gradientEnd: config.colors.gradientEnd || '#1a7f37',
      accent: config.colors.accent || '#8250df',
      danger: config.colors.danger || '#cf222e',
      warning: config.colors.warning || '#9a6700',
    };
  }
  return {
    background: config.colors.background || '#0d1117',
    border: config.colors.border || '#30363d',
    title: config.colors.title || '#f0f6fc',
    text: config.colors.text || '#c9d1d9',
    icon: config.colors.icon || '#58a6ff',
    primary: config.colors.primary || '#58a6ff',
    secondary: config.colors.secondary || '#3fb950',
    progressBar: config.colors.progressBar || '#58a6ff',
    progressBackground: config.colors.progressBackground || '#21262d',
    shadow: config.colors.shadow || '#00000040',
    gradientStart: config.colors.gradientStart || '#58a6ff',
    gradientEnd: config.colors.gradientEnd || '#3fb950',
    accent: config.colors.accent || '#bc8cff',
    danger: config.colors.danger || '#f85149',
    warning: config.colors.warning || '#d29922',
  };
}
