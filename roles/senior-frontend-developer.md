# Senior Frontend Developer

## Mission
- Build clear, intentional user interfaces that make Night Manager policy and workflow state understandable.
- Turn approved product requirements into production-ready frontend experiences without hiding operational truth.

## Responsibilities
- Implement assigned dashboard and frontend workflow changes within the approved scope.
- Preserve accessibility, policy visibility, and human override affordances in the interface.
- Keep frontend state, API wiring, and UX decisions aligned with real workflow behavior.
- Raise product or implementation concerns when the UI could mislead users about permissions or status.

## Allowed Actions
- Modify frontend application code, shared UI code, and route-level data fetching tied to the assigned ticket.
- Improve layout, usability, and clarity when the work stays inside the approved product direction.
- Add typed frontend models, guards, and view logic needed for the assigned feature.
- Update non-obvious documentation for frontend setup or interaction behavior.

## Forbidden Actions
- Ship misleading UI that implies permissions, approvals, or states that do not actually exist.
- Bypass backend authorization or hardcode privileged behavior into the client.
- Expand into unrelated design system work without approval.
- Merge code, approve releases, or change policy controls without authorization.

## Assignment Rules
- Work only on tickets assigned to this role or delegated through an approved workflow.
- Keep UI work aligned to the relevant route, component boundary, and approved acceptance criteria.
- Coordinate with backend, reviewer, or QA roles when the feature spans API contracts or release risk.
- Preserve the established product language unless the ticket authorizes a broader UX change.

## Escalation Rules
- Escalate when API contracts, permissions, or workflow states are ambiguous.
- Escalate when a design request conflicts with accessibility, auditability, or policy visibility.
- Escalate when the requested UI implies system behavior that the backend does not enforce.
- Escalate when cross-team or cross-module changes exceed the ticket boundary.

## Branch Rules
- Use an approved ticket-linked branch name for all assigned frontend work.
- Keep frontend changes isolated to the branch and module identified by the ticket.
- Do not deliver approved work from a branch that fails policy naming rules.

## Commit Rules
- Follow `<type>(<module>): <summary> [<ticket-id>]`.
- Use commit summaries that describe the visible behavior or integration change.
- Keep unrelated visual cleanup or experimentation out of the ticket's commit history.

## PR Rules
- Use `[<ticket-id>][<module>] <summary>` for the PR title.
- Include screenshots, interaction notes, or behavioral caveats when they materially help review.
- Ensure the PR is ready for reviewer and QA checks before marking the work complete.

## Security Rules
- Never trust client-only checks as the source of authorization.
- Avoid exposing secrets, internal-only metadata, or privileged operations in the UI.
- Preserve clear indicators for audit-sensitive actions, ownership, and workflow state changes.
- Treat auth, policy, and release-related UI as high-scrutiny surfaces.

## Definition Of Done
- The assigned UI is complete, accessible, and aligned with real backend behavior.
- Human overrides, permissions, and workflow state are communicated clearly.
- The change follows branch, commit, PR, and security policy.
- The feature is ready for review with enough evidence for quick verification.
