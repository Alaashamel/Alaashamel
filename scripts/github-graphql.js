import { graphql } from '@octokit/graphql';
import { logger } from './logger.js';
import { withRetry } from './retry.js';
import { globalCache } from './cache.js';

export class GitHubGraphQLClient {
  constructor(token) {
    this.token = token;
    this.headers = { authorization: `Bearer ${token}` };
  }

  async run(query, variables = {}) {
    return withRetry(
      () => graphql({ query, variables, headers: this.headers }),
      { maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 30000 }
    );
  }

  async fetchUserStats(username) {
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const from = yearAgo.toISOString();
    const to = now.toISOString();

    const cacheKey = `user-stats:${username}:${from.split('T')[0]}`;
    const cached = await globalCache.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached user stats');
      return cached;
    }

    const query = `
      query ($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          login
          name
          avatarUrl
          bio
          location
          company
          email
          websiteUrl
          twitterUsername
          followers { totalCount }
          following { totalCount }
          repositories(first: 100, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }) {
            totalCount
            nodes {
              name
              description
              url
              stargazerCount
              forkCount
              watchers { totalCount }
              isPrivate
              primaryLanguage { name color }
              createdAt
              updatedAt
              object(expression: "HEAD:") {
                ... on Tree {
                  entries { object { ... on Blob { byteSize } } }
                }
              }
            }
            pageInfo { endCursor hasNextPage }
          }
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            restrictedContributionsCount
            totalPullRequestContributions
            totalIssueContributions
            totalRepositoryContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  weekday
                }
              }
            }
          }
          pullRequests(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
            totalCount
            nodes {
              merged
              createdAt
              mergedAt
              title
            }
          }
          issues(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
            totalCount
            nodes {
              closedAt
              createdAt
              state
              title
            }
          }
          organizations(first: 10) { totalCount nodes { login name } }
          packages(first: 10) { totalCount }
        }
      }
    `;

    logger.info('Fetching user stats from GitHub GraphQL API');
    const data = await this.run(query, { login: username, from, to });

    await globalCache.set(cacheKey, data);
    logger.info('User stats fetched successfully');
    return data;
  }

  async fetchContributionCalendar(username, year = new Date().getFullYear() - 1) {
    const cacheKey = `contributions:${username}:${year}`;
    const cached = await globalCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      query ($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    logger.info('Fetching contribution calendar');
    const data = await this.run(query, { login: username });
    await globalCache.set(cacheKey, data);
    return data;
  }

  async fetchTopRepositories(username, count = 10) {
    const cacheKey = `top-repos:${username}:${count}`;
    const cached = await globalCache.get(cacheKey);
    if (cached) return cached;

    const query = `
      query ($login: String!, $count: Int!) {
        user(login: $login) {
          repositories(first: $count, orderBy: { field: STARGAZERS, direction: DESC }, ownerAffiliations: OWNER) {
            nodes {
              name
              description
              url
              stargazerCount
              forkCount
              primaryLanguage { name }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    logger.info('Fetching top repositories');
    const data = await this.run(query, { login: username, count });
    await globalCache.set(cacheKey, data);
    return data;
  }
}
