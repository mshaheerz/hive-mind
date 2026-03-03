import { Octokit } from '@octokit/rest';

/**
 * Fetch open pull requests for a list of repositories.
 *
 * @param {{owner:string,repo:string}[]} repos
 * @param {string} token - GitHub personal access token or OAuth token
 * @returns {Promise<Array>} List of PR objects
 */
export async function fetchPullRequests(repos, token) {
  const octokit = new Octokit({ auth: token });

  const allPrs = [];

  // Run requests in parallel for speed
  await Promise.all(
    repos.map(async ({ owner, repo }) => {
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page: 50,
      });
      allPrs.push(...data);
    })
  );

  return allPrs;
}
