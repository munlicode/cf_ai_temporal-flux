import { Card } from "@/components/card/Card";
import type { TaskItem } from "@flux/shared";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";

interface BacklogViewProps {
  tasks: TaskItem[];
  onDeleteTask: (id: string) => void;
  onAddClick: () => void;
}

export function BacklogView({
  tasks,
  onDeleteTask,
  onAddClick,
}: BacklogViewProps) {
  return (
    <div className="flex flex-col h-full bg-ob-base-100 border-r border-ob-border">
      <div className="p-4 border-b border-ob-border flex justify-between items-center bg-ob-base-200/50">
        <h2 className="font-semibold text-lg text-ob-text-primary">Backlog</h2>
        <Button variant="ghost" size="sm" shape="square" onClick={onAddClick}>
          <PlusIcon size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-ob-text-secondary py-8 text-sm">
            No tasks in backlog.
            <br />
            Ask the AI to add one!
          </div>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              className="p-3 hover:border-brand-500/50 transition-colors cursor-pointer group relative"
            >
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  shape="square"
                  className="h-6 w-6 text-ob-text-secondary hover:text-red-500 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                >
                  <TrashIcon size={14} />
                </Button>
              </div>
              <div className="flex justify-between items-start mb-1 pr-6">
                <span className="font-medium text-sm text-ob-text-primary group-hover:text-brand-500 transition-colors">
                  {task.title}
                </span>
                {task.priority === "high" && (
                  <span
                    className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5"
                    title="High Priority"
                  />
                )}
              </div>
              {task.description && (
                <p className="text-xs text-ob-text-secondary line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
              {task.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 bg-ob-base-200 rounded text-ob-text-secondary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
