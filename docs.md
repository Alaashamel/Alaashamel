# GitHub Statistics Engine

Enterprise-grade, self-hosted GitHub Statistics System powered by the official GitHub GraphQL API. No third-party services. Fully configurable. Production-ready.

## Features

- Official GitHub GraphQL API only
- Beautiful SVG cards: stats, languages, streak, contribution summary
- Fully configurable via `config/config.js`
- Theme support (dark, light, custom, auto)
- GitHub Actions auto-update every 12 hours
- Caching and retry logic
- Clean architecture, SOLID principles
- Extensible card and metric system
- High-quality SVG with shadows, gradients, rounded corners

## Quick Start

1. Clone the repository
2. Create a GitHub Personal Access Token with `repo` and `read:org` scopes
3. Add it as a repository secret named `GH_STATS_TOKEN`
4. Run `npm install`
5. Run `npm run generate`

## Configuration

Everything is controlled from `config/config.js`.

### Colors

- `config.colors.primary` - Primary accent color
- `config.colors.secondary` - Secondary color
- `config.colors.background` - Card background
- `config.colors.border` - Card stroke
- `config.colors.title` - Title text color
- `config.colors.text` - Body text color
- `config.colors.icon` - Icon color
- `config.colors.progressBar` - Progress bar fill
- `config.colors.progressBackground` - Progress bar track
- `config.colors.shadow` - Shadow color
- `config.colors.gradientStart` / `gradientEnd` - Gradient stops

### Themes

```js
theme: {
  mode: 'auto', // 'light' | 'dark' | 'auto' | 'custom'
  custom: null, // or a theme object
}
```

### Statistics Visibility

Every metric can be toggled independently:

```js
show: {
  followers: true,
  stars: true,
  forks: false,
  commits: true,
  prsMerged: true,
  issuesOpened: true,
  // ... see config/config.js for all options
}
```

### Card Order

```js
cardOrder: ['stats', 'languages', 'streak', 'contribution']
```

### Language Card

```js
languages: {
  count: 8,
  sortBy: 'size', // 'size' | 'name'
  showPercentages: true,
  showBytes: true,
  hideLanguages: ['Dockerfile'],
  customColors: {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
  }
}
```

## Architecture

| File | Purpose |
|------|---------|
| `scripts/github-graphql.js` | GraphQL queries and API client |
| `scripts/github-stats.js` | Raw data to stats transformation |
| `scripts/svg-generator.js` | SVG card generation |
| `scripts/markdown-generator.js` | README markdown snippets |
| `scripts/readme-updater.js` | Diff-based README patcher |
| `scripts/index.js` | Entry point, orchestrates pipeline |
| `config/config.js` | Single source of truth for all settings |

## Extensibility

- Add new cards by creating a generator function in `svg-generator.js` and appending the card type to `cardOrder`
- Add new metrics by extending `GitHubStats` class
- Add new themes by providing custom theme objects in `config.js`
- Replace renderers by swapping `svg-generator.js` exports

## License

MIT
