import { useState } from "react";
import type { ToolUIPart } from "ai";
import { RobotIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { APPROVAL } from "@shared";

interface ToolResultWithContent {
  content: Array<{ type: string; text: string }>;
}

function isToolResultWithContent(
  result: unknown,
): result is ToolResultWithContent {
  return (
    typeof result === "object" &&
    result !== null &&
    "content" in result &&
    Array.isArray((result as ToolResultWithContent).content)
  );
}

interface ToolInvocationCardProps {
  toolUIPart: ToolUIPart;
  toolCallId: string;
  needsConfirmation: boolean;
  onSubmit: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: string;
  }) => void;
  addToolResult: (toolCallId: string, result: string) => void;
}

export function ToolInvocationCard({
  toolUIPart,
  toolCallId,
  needsConfirmation,
  onSubmit,
  // addToolResult
}: ToolInvocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="p-5 my-4 w-full max-w-[500px] rounded-2xl bg-ob-base-200 border-none shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <div
          className={`${needsConfirmation ? "bg-brand-500/20" : "bg-brand-500/10"} p-2 rounded-xl shrink-0`}
        >
          <RobotIcon size={18} className="text-brand-500" />
        </div>
        <h4 className="font-medium flex items-center gap-2 flex-1 text-left">
          {toolUIPart.type}
          {!needsConfirmation && toolUIPart.state === "output-available" && (
            <span className="text-xs text-brand-500/80 font-semibold px-2 py-0.5 bg-brand-500/10 rounded-full">
              ✓ Completed
            </span>
          )}
        </h4>
        <CaretDownIcon
          size={16}
          className={`text-ob-base-200 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ${isExpanded ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isExpanded ? "180px" : "0px" }}
        >
          <div className="mb-3">
            <h5 className="text-xs font-bold mb-2 text-ob-base-200 uppercase tracking-wider">
              Arguments
            </h5>
            <pre className="bg-ob-base-300 p-3 rounded-xl text-xs overflow-auto whitespace-pre-wrap wrap-break-word font-mono border border-ob-border">
              {JSON.stringify(toolUIPart.input, null, 2)}
            </pre>
          </div>

          {needsConfirmation && toolUIPart.state === "input-available" && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSubmit({ toolCallId, result: APPROVAL.NO })}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSubmit({ toolCallId, result: APPROVAL.YES })}
              >
                Approve
              </Button>
            </div>
          )}

          {!needsConfirmation && toolUIPart.state === "output-available" && (
            <div className="mt-4 border-t border-ob-border pt-4">
              <h5 className="text-xs font-bold mb-2 text-ob-base-200 uppercase tracking-wider">
                Result
              </h5>
              <pre className="bg-ob-base-300 p-3 rounded-xl text-xs overflow-auto whitespace-pre-wrap wrap-break-word font-mono border border-ob-border">
                {(() => {
                  const result = toolUIPart.output;
                  if (isToolResultWithContent(result)) {
                    return result.content
                      .map((item: { type: string; text: string }) => {
                        if (
                          item.type === "text" &&
                          item.text.startsWith("\n~ Page URL:")
                        ) {
                          const lines = item.text.split("\n").filter(Boolean);
                          return lines
                            .map(
                              (line: string) => `- ${line.replace("\n~ ", "")}`,
                            )
                            .join("\n");
                        }
                        return item.text;
                      })
                      .join("\n");
                  }
                  return JSON.stringify(result, null, 2);
                })()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
