import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle, Clock, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface TasksSectionProps {
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration";
  entityId: number;
}

export default function TasksSection({ entityType, entityId }: TasksSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const utils = trpc.useUtils();

  // Fetch tasks
  const { data: tasks = [], isLoading } = trpc.followUpTasks.getByEntity.useQuery({
    entityType,
    entityId,
  });

  // Create task mutation
  const createTaskMutation = trpc.followUpTasks.create.useMutation({
    onSuccess: () => {
      utils.followUpTasks.getByEntity.invalidate({ entityType, entityId });
      utils.followUpTasks.getCount.invalidate({ entityType, entityId });
      toast.success("تم إنشاء المهمة بنجاح");
      setIsDialogOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
    },
    onError: (error) => {
      toast.error("فشل إنشاء المهمة: " + error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.followUpTasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.followUpTasks.getByEntity.invalidate({ entityType, entityId });
      utils.followUpTasks.getCount.invalidate({ entityType, entityId });
      toast.success("تم تحديث حالة المهمة");
    },
    onError: (error) => {
      toast.error("فشل تحديث الحالة: " + error.message);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = trpc.followUpTasks.delete.useMutation({
    onSuccess: () => {
      utils.followUpTasks.getByEntity.invalidate({ entityType, entityId });
      utils.followUpTasks.getCount.invalidate({ entityType, entityId });
      toast.success("تم حذف المهمة");
    },
    onError: (error) => {
      toast.error("فشل حذف المهمة: " + error.message);
    },
  });

  const handleCreateTask = () => {
    if (!title.trim()) {
      toast.error("يرجى إدخال عنوان المهمة");
      return;
    }

    createTaskMutation.mutate({
      entityType,
      entityId,
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "in_progress":
        return "قيد التنفيذ";
      case "completed":
        return "مكتملة";
      case "cancelled":
        return "ملغية";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "عالية";
      case "medium":
        return "متوسطة";
      case "low":
        return "منخفضة";
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">مهام المتابعة</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" />
              إضافة مهمة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إنشاء مهمة متابعة جديدة</DialogTitle>
              <DialogDescription>
                أضف مهمة جديدة لمتابعة هذا السجل
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">العنوان *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: الاتصال بالعميل للمتابعة"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الوصف</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تفاصيل المهمة..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الأولوية</label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Circle className="h-12 w-12" />
            <p>لا توجد مهام متابعة</p>
            <p className="text-sm">أضف مهمة جديدة للبدء</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(task.status)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} ml-1`} />
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <Select
                      value={task.status}
                      onValueChange={(value: any) =>
                        updateStatusMutation.mutate({ id: task.id, status: value })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="h-7 w-auto text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                        <SelectItem value="completed">مكتملة</SelectItem>
                        <SelectItem value="cancelled">ملغية</SelectItem>
                      </SelectContent>
                    </Select>
                    {task.dueDate && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 ml-1" />
                        {formatDistanceToNow(new Date(task.dueDate), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      بواسطة: {task.createdByName}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
