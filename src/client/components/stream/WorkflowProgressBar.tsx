import type { WorkflowStatus } from "@shared";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { X as XIcon } from "@phosphor-icons/react/dist/ssr/X";

interface WorkflowProgressBarProps {
  workflow: WorkflowStatus;
  onDismiss?: () => void;
}

export function WorkflowProgressBar({
  workflow,
  onDismiss,
}: WorkflowProgressBarProps) {
  const { status, progress, message } = workflow;

  if (status === "idle") return null;

  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const canDismiss = isCompleted || isFailed;

  return (
    <div className="w-full bg-ob-base-100 border-b border-ob-border p-4 animate-in fade-in slide-in-from-top duration-300 relative group">
      {canDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 p-1 text-ob-text-secondary hover:text-ob-text-primary hover:bg-ob-base-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Dismiss"
        >
          <XIcon size={14} />
        </button>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-medium">
          <div className="flex items-center gap-2">
            {!isCompleted && !isFailed && (
              <CircleNotch size={14} className="animate-spin text-brand-500" />
            )}
            <span
              className={isFailed ? "text-red-500" : "text-ob-text-primary"}
            >
              {message || (isCompleted ? "Goal decomposed!" : "Processing...")}
            </span>
          </div>
          <span className="text-ob-text-secondary">{progress}%</span>
        </div>

        <div className="w-full h-1.5 bg-ob-base-300 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              isFailed
                ? "bg-red-500"
                : isCompleted
                  ? "bg-green-500"
                  : "bg-brand-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
