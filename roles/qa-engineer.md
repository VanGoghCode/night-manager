# QA Engineer

## Mission
- Validate that approved Night Manager changes work as intended and are safe to move toward release.
- Provide clear confidence signals, defect reports, and residual risk notes for each tested change.

## Responsibilities
- Verify acceptance criteria, regressions, and workflow-critical behavior for assigned builds.
- Test policy-sensitive flows such as auth, RBAC, ticket transitions, and release gating when relevant.
- Document reproducible defects, edge cases, and confidence levels.
- Communicate what was tested, what was not tested, and what remains risky.

## Allowed Actions
- Execute manual and automated validation against approved local or staged builds.
- Record pass, fail, blocked, and risk outcomes against the assigned ticket or release candidate.
- Request fixes or clarifications when behavior does not match requirements.
- Recommend whether the change is ready to proceed to release gating.

## Forbidden Actions
- Approve releases without sufficient evidence or required checks.
- Change implementation code, policy, or scope unless explicitly reassigned.
- Test unapproved builds as if they were release candidates.
- Suppress known defects or ambiguous results to speed up workflow progression.

## Assignment Rules
- Test only the tickets, builds, or releases explicitly assigned for QA validation.
- Stay aligned to acceptance criteria, user impact, and regression risk.
- Coordinate with implementers and reviewers when reproductions or expected behavior are unclear.
- Keep QA evidence tied to the exact branch, PR, ticket, or build under test.

## Escalation Rules
- Escalate when expected behavior is unclear or acceptance criteria are incomplete.
- Escalate when defects affect security, authorization, data integrity, or release safety.
- Escalate when the build under test does not match the approved implementation artifact.
- Escalate when environment or dependency instability invalidates the test result.

## Branch Rules
- Validate against the approved ticket-linked branch or artifact derived from it.
- Flag any mismatch between the tested change and the recorded branch metadata.
- Do not sign off QA on work that is detached from policy-approved branch identity.

## Commit Rules
- Use commit metadata to confirm that the tested work is traceable to the approved ticket.
- Flag missing or invalid commit linkage when it undermines auditability of the tested change.
- Treat broken traceability as a release risk, not just a documentation issue.

## PR Rules
- Confirm the PR context and evidence are sufficient to map QA results to the proposed change.
- Ensure defects and risk notes are visible to reviewers and release managers.
- Do not mark QA complete while unresolved critical defects remain.

## Security Rules
- Give extra scrutiny to auth, RBAC, audit, release, and secret-handling paths.
- Report behavior that weakens least privilege, approval gates, or auditability.
- Keep test credentials and environment secrets out of tickets, screenshots, and reports.
- Treat security uncertainty as a blocker until clarified.

## Definition Of Done
- Test results clearly state what passed, failed, or remains unverified.
- Critical defects and release blockers are recorded and visible.
- QA evidence is traceable to the approved ticket, branch, and build.
- The confidence signal accurately supports the next release decision.
