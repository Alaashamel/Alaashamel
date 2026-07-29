import config from '../config/config.js';
import { logger } from './logger.js';
import { formatNumber, formatPercentage, calculateMergeRate, calculateAverage, groupBy, sortBy, daysBetween, truncate } from './utils.js';

export class GitHubStats {
  constructor(rawData) {
    this.raw = rawData;
    this.user = rawData.user || rawData.data?.user;
  }

  getProfile() {
    const u = this.user;
    return {
      login: u.login,
      name: u.name || u.login,
      avatarUrl: u.avatarUrl,
      bio: u.bio || '',
      location: u.location || '',
      company: u.company || '',
      websiteUrl: u.websiteUrl || '',
      followers: u.followers ? u.followers.totalCount : 0,
      following: u.following ? u.following.totalCount : 0,
      createdAt: u.createdAt || '',
    };
  }

  getBasicStats() {
    const s = this.user;
    const show = config.show;
    const stats = {};

    if (show.followers && s.followers) stats.followers = s.followers.totalCount;
    if (show.following && s.following) stats.following = s.following.totalCount;
    if (show.repos || show.privateRepos || show.stars || show.forks || show.watchers) {
      const repos = s.repositories?.nodes || [];
      const all = repos;
      const publicRepos = repos.filter(r => !r.isPrivate);

      if (show.repos) stats.repos = publicRepos.length;
      if (show.privateRepos) stats.privateRepos = all.length - publicRepos.length;
      if (show.stars) stats.stars = all.reduce((sum, r) => sum + (r.stargazerCount || 0), 0);
      if (show.forks) stats.forks = all.reduce((sum, r) => sum + (r.forkCount || 0), 0);
      if (show.watchers) stats.watchers = all.reduce((sum, r) => sum + (r.watchers?.totalCount || 0), 0);
    }

    const contrib = s.contributionsCollection;
    if (contrib) {
      if (show.commits) stats.commits = contrib.totalCommitContributions || 0;
      if (show.contributionsThisYear) stats.contributionsThisYear = contrib.contributionCalendar?.totalContributions || contrib.totalCommitContributions || 0;
    }

    return stats;
  }

  getActivityStats() {
    const s = this.user;
    const show = config.show;
    const stats = {};

    const contrib = s.contributionsCollection;
    if (contrib) {
      if (show.prsOpened) stats.prsOpened = contrib.totalPullRequestContributions || 0;
      if (show.issuesOpened) stats.issuesOpened = contrib.totalIssueContributions || 0;
      if (show.codeReviews) stats.codeReviews = contrib.totalPullRequestReviewContributions || 0;
    }

    if (show.prsMerged || show.mergeRate) {
      const prsTotal = s.pullRequests?.totalCount || 0;
      const merged = s.pullRequests?.nodes?.filter(p => p.merged).length || 0;
      if (show.prsMerged) stats.prsMerged = merged;
      if (show.mergeRate) stats.mergeRate = calculateMergeRate(merged, prsTotal);
    }

    if (show.issuesClosed) {
      const issuesTotal = s.issues?.totalCount || 0;
      const issues = s.issues?.nodes || [];
      stats.issuesClosed = issues.filter(i => i.closedAt !== null).length;
      if (show.issuesOpened) stats.issuesOpened = issuesTotal;
    }

    if (show.discussionsStarted || show.discussionsAnswered) {
      stats.discussions = s.discussions?.totalCount || 0;
      if (show.discussionsStarted) stats.discussionsStarted = stats.discussions;
      if (show.discussionsAnswered) stats.discussionsAnswered = 0;
    }

    return stats;
  }

  getRepoStats() {
    const s = this.user;
    const show = config.show;
    const repos = s.repositories?.nodes || [];
    const stats = {};

    if (show.organizations) stats.organizations = s.organizations?.totalCount || 0;
    if (show.packages) stats.packages = s.packages?.totalCount || 0;
    if (show.releases) stats.releases = s.releases?.totalCount || 0;
    if (show.repoCount) stats.repoCount = repos.length;
    if (show.totalRepoSize) {
      stats.totalRepoSize = repos.reduce((sum, r) => {
        const entries = r.object?.entries || [];
        const bytes = entries.reduce((s, e) => s + (e.object?.byteSize || 0), 0);
        return sum + bytes;
      }, 0);
    }
    if (show.averageStars) {
      stats.averageStars = calculateAverage(repos.map(r => r.stargazerCount || 0));
    }

    return stats;
  }

  getTopRepositories(count = 10) {
    const repos = this.user.repositories?.nodes || [];
    return sortBy(
      repos.filter(r => !r.isPrivate && r.stargazerCount > 0),
      r => r.stargazerCount || 0,
      'desc'
    ).slice(0, count).map(r => ({
      name: r.name,
      description: truncate(r.description, 60),
      url: r.url,
      stars: r.stargazerCount,
      forks: r.forkCount,
      language: r.primaryLanguage?.name || 'Unknown',
    }));
  }

  getMostStarredRepo() {
    const repos = this.user.repositories?.nodes || [];
    const top = sortBy(repos, r => r.stargazerCount || 0, 'desc')[0];
    if (!top || !top.stargazerCount) return null;
    return {
      name: top.name,
      url: top.url,
      stars: top.stargazerCount,
      language: top.primaryLanguage?.name || 'Unknown',
    };
  }

  getLanguages(count = 8) {
    const repos = this.user.repositories?.nodes || [];
    const langMap = new Map();

    for (const repo of repos) {
      if (repo.isPrivate) continue;
      const lang = repo.primaryLanguage;
      if (!lang) continue;
      const bytes = (repo.object?.entries || []).reduce((s, e) => s + (e.object?.byteSize || 0), 0);
      langMap.set(lang.name, (langMap.get(lang.name) || 0) + bytes);
    }

    let sorted = Array.from(langMap.entries()).map(([name, bytes]) => ({ name, bytes }));
    const hide = config.languages.hideLanguages || [];
    if (hide.length > 0) {
      sorted = sorted.filter(l => !hide.includes(l.name));
    }

    if (config.languages.sortBy === 'size') {
      sorted = sortBy(sorted, l => l.bytes, 'desc');
    } else {
      sorted = sortBy(sorted, l => l.name.toLowerCase(), 'asc');
    }

    const totalBytes = sorted.reduce((s, l) => s + l.bytes, 0);
    const selected = sorted.slice(0, count);

    return selected.map(l => ({
      name: l.name,
      bytes: l.bytes,
      percentage: totalBytes > 0 ? formatPercentage(l.bytes, totalBytes) : 0,
      color: config.languages.customColors?.[l.name] || this._getLanguageColor(l.name),
    }));
  }

  _getLanguageColor(language) {
    const colors = {
      JavaScript: '#F1E05A', TypeScript: '#3178C6', Python: '#3572A5',
      Java: '#B07219', Go: '#00ADD8', Rust: '#DEA584', 'C++': '#F34B7D',
      C: '#555555', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
      Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', Scala: '#C22D40',
      HTML: '#E34F26', CSS: '#563D7C', Vue: '#41B883', Svelte: '#FF3E00',
    };
    return colors[language] || '#868e96';
  }

  getContributionDays() {
    const weeks = this.user.contributionsCollection?.contributionCalendar?.weeks || [];
    const days = [];
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        days.push({
          date: day.date,
          count: day.contributionCount,
          weekday: day.weekday,
        });
      }
    }
    return days;
  }

  getStreakStats() {
    const days = this.getContributionDays();
    const sorted = days.sort((a, b) => new Date(a.date) - new Date(b.date));

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = sorted.length - 1; i >= 0; i--) {
      const d = new Date(sorted[i].date);
      if (d > today) continue;
      if (sorted[i].count > 0) {
        tempStreak++;
        if (i === sorted.length - 1 || d.getTime() - new Date(sorted[i + 1].date).getTime() <= 86400000) {
          currentStreak = tempStreak;
        } else {
          currentStreak = 0;
        }
      } else {
        tempStreak = 0;
        if (i < sorted.length - 1) break;
      }
    }

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].count > 0) {
        tempStreak++;
        if (i < sorted.length - 1 && new Date(sorted[i + 1].date).getTime() - new Date(sorted[i].date).getTime() > 86400000) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      totalDays: sorted.filter(d => d.count > 0).length,
    };
  }

  getAllStats() {
    return {
      profile: this.getProfile(),
      basic: this.getBasicStats(),
      activity: this.getActivityStats(),
      repos: this.getRepoStats(),
      topRepositories: this.getTopRepositories(),
      mostStarredRepo: this.getMostStarredRepo(),
      languages: this.getLanguages(),
      streak: this.getStreakStats(),
      contributionDays: this.getContributionDays(),
    };
  }
}
