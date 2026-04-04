import { format } from "date-fns";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: Date;
  action: string;
  chamber: string;
}

interface BillTimelineProps {
  events: TimelineEvent[];
}

export function BillTimeline({ events }: BillTimelineProps) {
  if (!events.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>No legislative history recorded yet.</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {sorted.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pl-10">
            <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-200">
              {index === 0 ? (
                <CheckCircle className="h-4 w-4 text-blue-600" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-400" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-900 leading-relaxed">{event.action}</p>
                <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap mt-0.5">
                  {format(new Date(event.date), "MMM d, yyyy")}
                </span>
              </div>
              {event.chamber && event.chamber !== "UNKNOWN" && (
                <span className="text-xs text-gray-500 capitalize">
                  {event.chamber.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
