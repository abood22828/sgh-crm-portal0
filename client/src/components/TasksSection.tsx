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
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration" | "all";
  entityId?: number;
}

export default function TasksSection({ entityType, entityId }: TasksSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState<number | undefined>();

  // Filter states
  const [filterAssignedTo, setFilterAssignedTo] = useState<number | "all" | "unassigned">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high">("all");
  const [filterDueDate, setFilterDueDate] = useState<"all" | "overdue" | "today" | "this_week" | "future">("all");

  const utils = trpc.useUtils();

  // Fetch active users for assignment
  const { data: users = [] } = trpc.users.getActiveUsers.useQuery();

  // Fetch tasks
  const { data: tasks = [], isLoading } = trpc.followUpTasks.getByEntity.useQuery(
    entityType === "all" 
      ? { entityType: "appointment", entityId: 0 } // Dummy query, will be replaced with getAll
      : { entityType, entityId: entityId! },
    { enabled: entityType !== "all" }
  );

  // Fetch all tasks when entityType is "all"
  const { data: allTasks = [] } = trpc.followUpTasks.getAll.useQuery(undefined, {
    enabled: entityType === "all"
  });

  const displayTasks = entityType === "all" ? allTasks : tasks;

  // Create task mutation
  const createTaskMutation = trpc.followUpTasks.create.useMutation({
    onSuccess: () => {
      if (entityType !== "all") {
        utils.followUpTasks.getByEntity.invalidate({ entityType, entityId: entityId! });
        utils.followUpTasks.getCount.invalidate({ entityType, entityId: entityId! });
      }
      utils.followUpTasks.getAll.invalidate();
      toast.success("تم إنشاء المهمة بنجاح");
      setIsDialogOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setAssignedToId(undefined);
    },
    onError: (error) => {
      toast.error("فشل إنشاء المهمة: " + error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.followUpTasks.updateStatus.useMutation({
    onSuccess: () => {
      if (entityType !== "all") {
        utils.followUpTasks.getByEntity.invalidate({ entityType, entityId: entityId! });
        utils.followUpTasks.getCount.invalidate({ entityType, entityId: entityId! });
      }
      utils.followUpTasks.getAll.invalidate();
      toast.success("تم تحديث حالة المهمة");
    },
    onError: (error) => {
      toast.error("فشل تحديث الحالة: " + error.message);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = trpc.followUpTasks.delete.useMutation({
    onSuccess: () => {
      if (entityType !== "all") {
        utils.followUpTasks.getByEntity.invalidate({ entityType, entityId: entityId! });
        utils.followUpTasks.getCount.invalidate({ entityType, entityId: entityId! });
      }
      utils.followUpTasks.getAll.invalidate();
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

    const assignedUser = users.find(u => u.id === assignedToId);

    if (entityType === "all") {
      toast.error("لا يمكن إضافة مهمة من قسم جميع المهام. يرجى فتح السجل المحدد لإضافة مهمة.");
      return;
    }

    createTaskMutation.mutate({
      entityType,
      entityId: entityId!,
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      assignedToId,
      assignedToName: assignedUser ? (assignedUser.name || assignedUser.username) : undefined,
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

  // Filter tasks
  const filteredTasks = displayTasks.filter((task) => {
    // Filter by assigned user
    if (filterAssignedTo !== "all") {
      if (filterAssignedTo === "unassigned" && task.assignedToId !== null) return false;
      if (typeof filterAssignedTo === "number" && task.assignedToId !== filterAssignedTo) return false;
    }

    // Filter by priority
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;

    // Filter by due date
    if (filterDueDate !== "all" && task.dueDate) {
      const now = new Date();
      const due = new Date(task.dueDate);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      if (filterDueDate === "overdue" && due >= today) return false;
      if (filterDueDate === "today" && (due < today || due >= tomorrow)) return false;
      if (filterDueDate === "this_week" && (due < today || due > weekFromNow)) return false;
      if (filterDueDate === "future" && due <= weekFromNow) return false;
    }

    return true;
  });

  const hasActiveFilters = filterAssignedTo !== "all" || filterPriority !== "all" || filterDueDate !== "all";

  const clearFilters = () => {
    setFilterAssignedTo("all");
    setFilterPriority("all");
    setFilterDueDate("all");
  };

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
              <div className="space-y-2">
                <label className="text-sm font-medium">تعيين لـ</label>
                <Select value={assignedToId?.toString()} onValueChange={(value) => setAssignedToId(value ? parseInt(value) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستخدم (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">بدون تعيين</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">المستخدم المعين</label>
          <Select value={filterAssignedTo.toString()} onValueChange={(value) => setFilterAssignedTo(value === "all" ? "all" : value === "unassigned" ? "unassigned" : parseInt(value))}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="unassigned">غير معين</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">الأولوية</label>
          <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">تاريخ الاستحقاق</label>
          <Select value={filterDueDate} onValueChange={(value: any) => setFilterDueDate(value)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="overdue">متأخرة</SelectItem>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="this_week">هذا الأسبوع</SelectItem>
              <SelectItem value="future">مستقبلية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full h-9">
              مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground px-1">
          عرض {filteredTasks.length} من {tasks.length} مهمة
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Circle className="h-12 w-12" />
            <p>لا توجد مهام متابعة</p>
            <p className="text-sm">أضف مهمة جديدة للبدء</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
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
                    {task.assignedToName && (
                      <Badge variant="outline" className="text-xs">
                        معين لـ: {task.assignedToName}
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
