import type { EventLog } from "@shared";
import { Scroll, Clock, Info } from "@phosphor-icons/react";
import { Card } from "../card/Card";

interface EventLogViewProps {
  events: EventLog[];
}

export const EventLogView = ({ events }: EventLogViewProps) => {
  // Show last 10 events, descending
  const sortedEvents = [...events].reverse().slice(0, 10);

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center opacity-40 h-full">
        <Scroll size={32} className="mb-2" />
        <p className="text-[10px] uppercase tracking-wider font-bold">
          No events recorded
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-ob-base-100">
      <div className="px-4 py-2 bg-ob-base-200 border-b border-ob-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Scroll size={14} className="text-brand-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider">
            Audit Log
          </h3>
        </div>
        <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-mono">
          {events.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedEvents.map((event) => (
          <Card
            key={event.id}
            className="p-2 border-ob-border bg-ob-base-200/50 hover:bg-ob-base-200 transition-colors shadow-none"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-[9px] font-mono font-bold bg-neutral-200 dark:bg-neutral-800 px-1 rounded text-ob-text-primary">
                {event.type}
              </span>
              <div className="flex items-center gap-1 text-[8px] text-ob-text-secondary">
                <Clock size={8} />
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>

            <div className="text-[10px] text-ob-text-secondary line-clamp-2 mb-1 font-mono break-all">
              {event.reason ||
                (typeof event.payload === "object"
                  ? JSON.stringify(event.payload)
                  : String(event.payload))}
            </div>

            {event.reason && (
              <div className="flex items-center gap-1 text-[8px] italic text-brand-500/70">
                <Info size={8} />
                Audit: {event.reason}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="p-2 border-t border-ob-border bg-ob-base-200 shrink-0">
        <p className="text-[8px] text-ob-text-secondary italic text-center leading-tight">
          Live projection of the Event-Driven State Log
          <br />
          persisted in the Durable Object.
        </p>
      </div>
    </div>
  );
};
