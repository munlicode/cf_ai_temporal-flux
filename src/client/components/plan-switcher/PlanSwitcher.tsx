import { useState } from "react";
import { Button } from "@/components/button/Button";
import { CaretDown, CaretUp, Plus, Trash, Check } from "@phosphor-icons/react";
import type { Plan } from "@shared";

interface PlanSwitcherProps {
  plans: Record<string, Plan>;
  activePlanId: string | null;
  onSwitchPlan: (id: string) => void;
  onCreatePlan: (title: string) => void;
  onDeletePlan: (id: string) => void;
}

export function PlanSwitcher({
  plans,
  activePlanId,
  onSwitchPlan,
  onCreatePlan,
  onDeletePlan,
}: PlanSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  const activePlan = activePlanId ? plans[activePlanId] : null;
  const plansList = Object.values(plans);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    onCreatePlan(newPlanName);
    setNewPlanName("");
    setIsCreating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <Button
        variant="ghost"
        className="flex items-center gap-2 font-medium text-sm px-2 h-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate max-w-[80px] md:max-w-[150px] hidden min-[400px]:inline">
          {activePlan ? activePlan.title : "Select Plan"}
        </span>
        {isOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute top-10 left-0 w-64 bg-ob-base-100 border border-ob-border rounded-lg shadow-lg z-50 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-ob-border bg-ob-base-200/50">
              <span className="text-xs font-semibold text-ob-text-secondary uppercase tracking-wider px-2">
                Your Plans
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {plansList.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-ob-base-200 transition-colors ${
                    plan.id === activePlanId
                      ? "bg-brand-500/10 text-brand-500"
                      : "text-ob-text-primary"
                  }`}
                  onClick={() => {
                    onSwitchPlan(plan.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-sm truncate">
                      {plan.title}
                    </span>
                    <span className="text-[10px] text-ob-text-secondary">
                      {plan.stream.length} blocks
                    </span>
                  </div>

                  {plan.id === activePlanId && (
                    <Check size={14} weight="bold" />
                  )}

                  {plan.id !== activePlanId && (
                    <button
                      className="p-1 text-ob-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete plan "${plan.title}"?`)) {
                          onDeletePlan(plan.id);
                        }
                      }}
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-ob-border bg-ob-base-200/50">
              {isCreating ? (
                <form onSubmit={handleCreate} className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Plan name..."
                    autoFocus
                    className="w-full text-xs px-2 py-1.5 rounded border border-ob-border bg-ob-base-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1 h-6 text-xs bg-brand-500 text-white hover:bg-brand-600"
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs text-ob-text-secondary hover:text-brand-500"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus size={14} className="mr-2" /> Create New Plan
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
