import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";

interface TaskCountProps {
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration";
  entityId: number;
}

export default function TaskCount({ entityType, entityId }: TaskCountProps) {
  const { data: count = 0 } = trpc.followUpTasks.getCount.useQuery({
    entityType,
    entityId,
  });

  if (count === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <CheckSquare className="h-3 w-3" />
        {count}
      </Badge>
    );
  }

  // Color based on count: 1-3 blue, 4+ orange
  const variant = count >= 4 ? "destructive" : "default";
  const colorClass = count >= 4 ? "bg-orange-500 hover:bg-orange-600" : "";

  return (
    <Badge variant={variant} className={`gap-1 ${colorClass}`}>
      <CheckSquare className="h-3 w-3" />
      {count}
    </Badge>
  );
}
