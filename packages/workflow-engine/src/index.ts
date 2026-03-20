export type WorkflowState =
  | "draft"
  | "approved"
  | "assigned"
  | "in_progress"
  | "review"
  | "qa"
  | "released";

export function createWorkflowSnapshot(): { allowedStates: WorkflowState[] } {
  return {
    allowedStates: [
      "draft",
      "approved",
      "assigned",
      "in_progress",
      "review",
      "qa",
      "released"
    ]
  };
}
