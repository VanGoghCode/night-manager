const branchPattern =
  /^(feature|fix|chore|hotfix)\/[a-z0-9-]+\/[A-Z]+-\d+-[a-z0-9-]+$|^release\/[a-z0-9.-]+$/;
const commitPattern =
  /^(feat|fix|chore|docs|refactor|test)\([a-z0-9-]+\): .+ \[[A-Z]+-\d+\]$/;
const prTitlePattern = /^\[[A-Z]+-\d+\]\[[a-z0-9-]+\] .+$/;

export const BRANCH_NAME_POLICY =
  "feature/<module>/<ticket-id>-<slug> | fix/<module>/<ticket-id>-<slug> | chore/<module>/<ticket-id>-<slug> | hotfix/<module>/<ticket-id>-<slug> | release/<release-id>";
export const COMMIT_MESSAGE_POLICY = "<type>(<module>): <summary> [<ticket-id>]";
export const PR_TITLE_POLICY = "[<ticket-id>][<module>] <summary>";

export function isValidBranchName(branchName: string): boolean {
  return branchPattern.test(branchName);
}

export function isValidCommitMessage(commitMessage: string): boolean {
  return commitPattern.test(commitMessage);
}

export function isValidPullRequestTitle(title: string): boolean {
  return prTitlePattern.test(title);
}

export function getPolicyPatterns() {
  return {
    branchPattern: branchPattern.source,
    commitPattern: commitPattern.source,
    prTitlePattern: prTitlePattern.source
  };
}
