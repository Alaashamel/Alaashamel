const config = {
  /* ------------------------------------------------------------------ */
  /*  GITHUB                                                             */
  /* ------------------------------------------------------------------ */
  github: {
    username: 'Alaashamel',
    token: process.env.GH_STATS_TOKEN || '',
  },

  /* ------------------------------------------------------------------ */
  /*  OUTPUT PATHS                                                       */
  /* ------------------------------------------------------------------ */
  output: {
    statsCard: './generated/github-stats.svg',
    languagesCard: './generated/top-languages.svg',
    streakCard: './generated/streak.svg',
    contributionCard: './generated/contribution-summary.svg',
    readmePath: './README.md',
  },

  /* ------------------------------------------------------------------ */
  /*  CARD ORDER  —  which cards appear and in what order                */
  /* ------------------------------------------------------------------ */
  cardOrder: ['stats', 'languages', 'streak', 'contribution'],

  /* ------------------------------------------------------------------ */
  /*  CARD SIZES  —  width x height per card type                        */
  /* ------------------------------------------------------------------ */
  cardSizes: {
    stats: { width: 480, height: 200 },
    languages: { width: 480, height: 200 },
    streak: { width: 480, height: 160 },
    contribution: { width: 480, height: 160 },
  },

  /* ------------------------------------------------------------------ */
  /*  STATISTICS VISIBILITY                                              */
  /* ------------------------------------------------------------------ */
  show: {
    followers: true,
    following: true,
    repos: true,
    privateRepos: true,
    stars: true,
    forks: true,
    watchers: true,
    commits: true,
    contributionsThisYear: true,
    prsOpened: true,
    prsMerged: true,
    mergeRate: true,
    issuesOpened: true,
    issuesClosed: true,
    codeReviews: true,
    discussionsStarted: true,
    discussionsAnswered: true,
    organizations: true,
    packages: true,
    releases: true,
    topRepositories: true,
    mostStarredRepo: true,
    repoCount: true,
    totalRepoSize: true,
    averageStars: true,
    averageCommits: true,
    repoActivity: true,
    repoAge: true,
    currentStreak: true,
    longestStreak: true,
    totalContributionDays: true,
  },

  /* ------------------------------------------------------------------ */
  /*  LANGUAGE CARD SETTINGS                                             */
  /* ------------------------------------------------------------------ */
  languages: {
    count: 8,
    sortBy: 'size', // 'size' | 'name'
    showPercentages: true,
    showBytes: true,
    hideLanguages: [],
    customColors: {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Rust: '#dea584',
      Go: '#00ADD8',
    },
  },

  /* ------------------------------------------------------------------ */
  /*  THEME                                                              */
  /* ------------------------------------------------------------------ */
  theme: {
    mode: 'auto', // 'light' | 'dark' | 'auto'
    light: 'default-light',
    dark: 'default-dark',
    custom: null,
  },

  /* ------------------------------------------------------------------ */
  /*  COLORS  (used when theme mode is "custom" or as overrides)         */
  /* ------------------------------------------------------------------ */
  colors: {
    primary: '#58a6ff',
    secondary: '#8b949e',
    background: '#0d1117',
    border: '#30363d',
    title: '#f0f6fc',
    text: '#c9d1d9',
    icon: '#58a6ff',
    progressBar: '#58a6ff',
    progressBackground: '#21262d',
    shadow: '#00000040',
    gradientStart: '#58a6ff',
    gradientEnd: '#3fb950',
  },

  /* ------------------------------------------------------------------ */
  /*  FONTS                                                              */
  /* ------------------------------------------------------------------ */
  fonts: {
    family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    sizes: {
      title: 18,
      statValue: 22,
      statLabel: 13,
      small: 11,
    },
    weights: {
      title: 700,
      value: 600,
      label: 400,
    },
    lineSpacing: 1.5,
  },

  /* ------------------------------------------------------------------ */
  /*  LAYOUT                                                             */
  /* ------------------------------------------------------------------ */
  layout: {
    cardPadding: 20,
    cardBorderRadius: 12,
    spacing: 16,
    margin: 10,
    alignment: 'center',
  },

  /* ------------------------------------------------------------------ */
  /*  ICONS                                                              */
  /* ------------------------------------------------------------------ */
  icons: {
    enabled: true,
    size: 16,
    color: '#58a6ff',
  },

  /* ------------------------------------------------------------------ */
  /*  SVG OPTIONS                                                        */
  /* ------------------------------------------------------------------ */
  svg: {
    roundedCorners: true,
    shadows: true,
    animations: false,
    gradients: true,
    responsive: true,
    highDpi: true,
  },

  /* ------------------------------------------------------------------ */
  /*  README LAYOUT                                                      */
  /* ------------------------------------------------------------------ */
  readme: {
    imageWidth: '49%',
    alignment: 'center',
    spacing: '\n\n',
    sections: true,
    title: '📊 GitHub Statistics',
  },

  /* ------------------------------------------------------------------ */
  /*  CACHE                                                              */
  /* ------------------------------------------------------------------ */
  cache: {
    enabled: true,
    ttlMs: 12 * 60 * 60 * 1000, // 12 hours
    dir: './.cache',
  },

  /* ------------------------------------------------------------------ */
  /*  RATE LIMITING / RETRY                                              */
  /* ------------------------------------------------------------------ */
  retry: {
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  },
};

/* ------------------------------------------------------------------ */
/*  VALIDATION                                                         */
/* ------------------------------------------------------------------ */
export function validateConfig() {
  const errors = [];

  if (!config.github.username) {
    errors.push('config.github.username is required');
  }
  if (!config.github.token) {
    errors.push('GH_STATS_TOKEN environment variable is required');
  }

  const validCards = ['stats', 'languages', 'streak', 'contribution'];
  for (const card of config.cardOrder) {
    if (!validCards.includes(card)) {
      errors.push(`Invalid card "${card}" in cardOrder. Valid: ${validCards.join(', ')}`);
    }
  }

  if (config.languages.count < 1 || config.languages.count > 20) {
    errors.push('languages.count must be between 1 and 20');
  }

  if (!['size', 'name'].includes(config.languages.sortBy)) {
    errors.push('languages.sortBy must be "size" or "name"');
  }

  if (!['light', 'dark', 'auto', 'custom'].includes(config.theme.mode)) {
    errors.push('theme.mode must be "light", "dark", "auto", or "custom"');
  }

  const layoutValues = Object.values(config.cardSizes);
  for (const v of layoutValues) {
    if (v.width < 200 || v.width > 1200 || v.height < 100 || v.height > 800) {
      errors.push(`Card size ${v.width}x${v.height} is out of allowed range`);
    }
  }

  if (errors.length > 0) {
    throw new Error('Config validation failed:\n' + errors.map(e => `  - ${e}`).join('\n'));
  }
}

export default config;
