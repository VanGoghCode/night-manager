const branchPattern =
  /^(feature|fix|chore|hotfix)\/[a-z0-9-]+\/[A-Z]+-\d+-[a-z0-9-]+$|^release\/[a-z0-9.-]+$/;
const commitPattern =
  /^(feat|fix|chore|docs|refactor|test)\([a-z0-9-]+\): .+ \[[A-Z]+-\d+\]$/;
const prTitlePattern = /^\[[A-Z]+-\d+\]\[[a-z0-9-]+\] .+$/;

export function isValidBranchName(branchName: string): boolean {
  return branchPattern.test(branchName);
}

export function isValidCommitMessage(commitMessage: string): boolean {
  return commitPattern.test(commitMessage);
}

export function isValidPullRequestTitle(title: string): boolean {
  return prTitlePattern.test(title);
}
