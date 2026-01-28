import { useState } from "react";
import {
  Info,
  X,
  MagicWand,
  CalendarPlus,
  Trash,
  ArrowsLeftRight,
  PlusCircle,
} from "@phosphor-icons/react";
import { Button } from "../button/Button";

export function CommandInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const commandGroups = [
    {
      title: "Strategy",
      icon: <MagicWand size={16} className="text-purple-500" />,
      items: [
        {
          label: "Architect a goal",
          command: "'Architect my goal to learn German'",
        },
      ],
    },
    {
      title: "Timeline",
      icon: <CalendarPlus size={16} className="text-brand-500" />,
      items: [
        {
          label: "Schedule task",
          command: "'Schedule workout tomorrow at 8am'",
        },
        { label: "Update task", command: "'Set workout to high priority'" },
        { label: "Delete task", command: "'Delete the first task'" },
      ],
    },
    {
      title: "Contexts (Plans)",
      icon: <ArrowsLeftRight size={16} className="text-blue-500" />,
      items: [
        { label: "Create plan", command: "'Create a new plan for Fitness'" },
        { label: "Switch plan", command: "'Switch to my Vacation plan'" },
      ],
    },
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        shape="square"
        className="text-ob-text-secondary hover:text-brand-500 hover:bg-brand-500/10"
        onClick={() => setIsOpen(true)}
      >
        <Info size={18} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/5 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-10 right-0 w-80 bg-ob-base-100 border border-ob-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-ob-border flex justify-between items-center bg-ob-base-200/50">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <MagicWand size={18} className="text-brand-500" />
                How to talk to Flux
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-ob-text-secondary hover:text-ob-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
              {commandGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-ob-text-secondary uppercase tracking-widest px-1">
                    {group.icon}
                    {group.title}
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="p-2.5 bg-ob-base-200 rounded-lg border border-ob-border/50 hover:border-brand-500/30 transition-colors group"
                      >
                        <div className="text-[10px] text-ob-text-secondary mb-1 font-medium">
                          {item.label}
                        </div>
                        <div className="text-xs font-mono text-ob-text-primary group-hover:text-brand-500 transition-colors">
                          {item.command}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-brand-500/5 border-t border-ob-border text-center">
              <p className="text-[10px] text-ob-text-secondary">
                Flux understands natural language. Just tell it what you want.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
