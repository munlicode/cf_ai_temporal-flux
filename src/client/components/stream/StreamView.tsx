import { Card } from "@/components/card/Card";
import type { StreamBlock } from "@shared";
import {
  ClockIcon,
  CalendarDotsIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/button/Button";
import { useEffect, useState, useMemo } from "react";
import { WorkflowProgressBar } from "./WorkflowProgressBar";
import type { WorkflowStatus } from "@shared";

interface StreamViewProps {
  blocks: StreamBlock[];
  workflow?: WorkflowStatus;
  onDeleteBlock: (id: string) => void;
}

export function StreamView({
  blocks,
  workflow,
  onDeleteBlock,
}: StreamViewProps) {
  const [now, setNow] = useState(new Date());

  // Update 'now' every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [blocks],
  );

  const blocksWithNowLine = useMemo(() => {
    const result: (StreamBlock | { type: "now-line"; time: Date })[] = [
      ...sortedBlocks,
    ];

    // Find where to insert the "Now" line
    const nowTime = now.getTime();
    let inserted = false;

    for (let i = 0; i < sortedBlocks.length; i++) {
      const blockTime = new Date(sortedBlocks[i].startTime).getTime();
      if (blockTime > nowTime) {
        result.splice(i, 0, { type: "now-line", time: now });
        inserted = true;
        break;
      }
    }

    if (!inserted && sortedBlocks.length > 0) {
      result.push({ type: "now-line", time: now });
    }

    return result;
  }, [sortedBlocks, now]);

  const [dismissedWorkflowId, setDismissedWorkflowId] = useState<string | null>(
    null,
  );

  const shouldShowProgressBar =
    workflow &&
    workflow.status !== "idle" &&
    workflow.id !== dismissedWorkflowId;

  return (
    <div className="flex flex-col h-full bg-ob-base-200/30">
      <div className="p-4 border-b border-ob-border flex justify-between items-center bg-ob-base-100/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-ob-text-primary flex items-center gap-2">
          <CalendarDotsIcon className="text-brand-500" size={20} />
          Execution Timeline
        </h2>
        <span className="text-xs text-ob-text-secondary bg-ob-base-200 px-2 py-1 rounded-full border border-ob-border">
          Roadmap
        </span>
      </div>

      {shouldShowProgressBar && (
        <WorkflowProgressBar
          workflow={workflow}
          onDismiss={() => setDismissedWorkflowId(workflow.id)}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Timeline Line */}
        <div className="absolute left-[54px] top-4 bottom-4 w-px bg-ob-border/50" />

        {sortedBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ob-text-secondary opacity-60">
            <ClockIcon size={48} className="mb-4 text-ob-base-300" />
            <p>Your timeline is empty.</p>
            <p className="text-xs mt-2">Ask the Architect to map out a goal!</p>
          </div>
        ) : (
          blocksWithNowLine.map((item, index) => {
            if ("type" in item && item.type === "now-line") {
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable
                  key={`now-${index}`}
                  className="relative pl-16 py-2 flex items-center gap-2"
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-500 bg-brand-500/10 px-1 py-0.5 rounded border border-brand-500/20 z-10 w-12 text-center tracking-tight">
                    NOW
                  </div>
                  <div className="flex-1 h-px bg-brand-500/50 relative shadow-[0_0_8px_rgba(244,129,32,0.5)]">
                    <div className="absolute -left-[12px] -top-1 w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(244,129,32,1)]" />
                  </div>
                </div>
              );
            }

            const block = item as StreamBlock;
            const startTime = new Date(block.startTime);
            const endTime = new Date(block.endTime);
            const duration = Math.round(
              (endTime.getTime() - startTime.getTime()) / 60000,
            );

            return (
              <div key={block.id} className="relative pl-16 group">
                {/* Time Indicator */}
                <div className="absolute left-0 top-0 text-[10px] font-mono text-ob-text-secondary bg-ob-base-100 px-1 rounded border border-ob-border z-10 w-12 text-center">
                  {startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>

                {/* Block Card */}
                <Card
                  className={`p-3 border-l-4 ${
                    block.status === "completed"
                      ? "border-l-green-500 opacity-60"
                      : block.status === "cancelled"
                        ? "border-l-red-500 opacity-40"
                        : "border-l-brand-500"
                  } bg-ob-base-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
                >
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      shape="square"
                      className="h-6 w-6 text-ob-text-secondary hover:text-red-500 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                      }}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                  <div className="flex justify-between items-start pr-6">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-ob-text-primary">
                        {block.title}
                      </h3>
                      {block.description && (
                        <p className="text-xs text-ob-text-secondary line-clamp-2 leading-relaxed">
                          {block.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] font-medium text-ob-text-secondary flex items-center gap-1">
                          <ClockIcon size={12} />
                          {duration} mins
                        </span>
                        {block.priority === "high" && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
