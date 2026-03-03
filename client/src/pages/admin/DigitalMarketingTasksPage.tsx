import { useFormatDate, formatDateUtil } from "@/hooks/useFormatDate";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  Target,
  TrendingUp,
  RefreshCw,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Types
type TaskStatus = "todo" | "in_progress" | "review" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskCategory = "content" | "design" | "ads" | "seo" | "social_media" | "analytics" | "other";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignedTo: number | null;
  assignedUser: { id: number; name: string | null; username: string } | null;
  campaignId: number | null;
  campaign: { id: number; name: string } | null;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions
const getStatusLabel = (status: TaskStatus) => {
  const labels: Record<TaskStatus, string> = {
    todo: "قيد الانتظار",
    in_progress: "قيد التنفيذ",
    review: "مراجعة",
    completed: "مكتمل",
    cancelled: "ملغي",
  };
  return labels[status] || status;
};

const getStatusColor = (status: TaskStatus) => {
  const colors: Record<TaskStatus, string> = {
    todo: "bg-muted text-foreground border-border",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-muted text-foreground";
};

const getPriorityLabel = (priority: TaskPriority) => {
  const labels: Record<TaskPriority, string> = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
    urgent: "عاجلة",
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: TaskPriority) => {
  const colors: Record<TaskPriority, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-100 text-blue-600",
    high: "bg-orange-100 text-orange-600",
    urgent: "bg-red-100 text-red-600",
  };
  return colors[priority] || "bg-muted text-muted-foreground";
};

const getCategoryLabel = (category: TaskCategory) => {
  const labels: Record<TaskCategory, string> = {
    content: "محتوى",
    design: "تصميم",
    ads: "إعلانات",
    seo: "SEO",
    social_media: "سوشيال ميديا",
    analytics: "تحليلات",
    other: "أخرى",
  };
  return labels[category] || category;
};

const getCategoryColor = (category: TaskCategory) => {
  const colors: Record<TaskCategory, string> = {
    content: "bg-purple-100 text-purple-600",
    design: "bg-pink-100 text-pink-600",
    ads: "bg-green-100 text-green-600",
    seo: "bg-cyan-100 text-cyan-600",
    social_media: "bg-indigo-100 text-indigo-600",
    analytics: "bg-amber-100 text-amber-600",
    other: "bg-muted text-muted-foreground",
  };
  return colors[category] || "bg-muted text-muted-foreground";
};

const formatDate = formatDateUtil;

const isOverdue = (dueDate: Date | null, status: TaskStatus) => {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return new Date(dueDate) < new Date();
};

// Kanban Column Component
function KanbanColumn({ 
  status, 
  tasks, 
  onTaskClick, 
  onStatusChange 
}: { 
  status: TaskStatus; 
  tasks: Task[]; 
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
}) {
  const columnTasks = tasks.filter(t => t.status === status);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-muted/50");
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-muted/50");
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-muted/50");
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div 
      className="flex-1 min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg p-3"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
          <span className="text-sm text-muted-foreground">({columnTasks.length})</span>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2 pe-2">
          {columnTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
            />
          ))}
          {columnTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا توجد مهام
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id.toString());
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </Badge>
          <Badge variant="secondary" className={`text-xs ${getCategoryColor(task.category)}`}>
            {getCategoryLabel(task.category)}
          </Badge>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {task.assignedUser ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {(task.assignedUser.name || task.assignedUser.username).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[80px]">
                  {task.assignedUser.name || task.assignedUser.username}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">غير معيّن</span>
            )}
          </div>
          
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue(task.dueDate, task.status) ? 'text-red-500' : ''}`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Task Details Dialog
function TaskDetailsDialog({ 
  task, 
  open, 
  onOpenChange,
  onUpdate,
  onDelete,
}: { 
  task: Task | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  
  const { data: comments, refetch: refetchComments } = trpc.tasks.getComments.useQuery(
    { taskId: task?.id || 0 },
    { enabled: !!task?.id && open }
  );
  
  const { data: attachments, refetch: refetchAttachments } = trpc.tasks.getAttachments.useQuery(
    { taskId: task?.id || 0 },
    { enabled: !!task?.id && open }
  );
  
  const addCommentMutation = trpc.tasks.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      toast.success("تم إضافة التعليق");
    },
  });
  
  const handleAddComment = () => {
    if (!task || !newComment.trim()) return;
    addCommentMutation.mutate({ taskId: task.id, content: newComment });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getStatusColor(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Badge>
                <Badge className={getCategoryColor(task.category)}>
                  {getCategoryLabel(task.category)}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 me-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    onDelete(task.id);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">الوصف</h4>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {task.description || "لا يوجد وصف"}
              </p>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">المعيّن إليه</Label>
                <p className="font-medium">
                  {task.assignedUser?.name || task.assignedUser?.username || "غير معيّن"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">الحملة</Label>
                <p className="font-medium">{task.campaign?.name || "غير مرتبط"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">تاريخ التسليم</Label>
                <p className={`font-medium ${isOverdue(task.dueDate, task.status) ? 'text-red-500' : ''}`}>
                  {formatDate(task.dueDate)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">الساعات المقدرة</Label>
                <p className="font-medium">{task.estimatedHours || "-"} ساعة</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  المرفقات ({attachments?.length || 0})
                </h4>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 me-2" />
                  رفع ملف
                </Button>
              </div>
              {attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((att: any) => (
                    <div key={att.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{att.fileName}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                          عرض
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد مرفقات</p>
              )}
            </div>
            
            <Separator />
            
            {/* Comments */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                التعليقات ({comments?.length || 0})
              </h4>
              
              <div className="space-y-3 mb-4">
                {comments && comments.length > 0 ? (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {(comment.user?.name || comment.user?.username || "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user?.name || comment.user?.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد تعليقات</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="أضف تعليقاً..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button 
                  size="icon" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Create/Edit Task Dialog
function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    assignedTo: string;
    campaignId: string;
    dueDate: string;
    estimatedHours: string;
  }>({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    category: task?.category || "other",
    assignedTo: task?.assignedTo?.toString() || "",
    campaignId: task?.campaignId?.toString() || "",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    estimatedHours: task?.estimatedHours?.toString() || "",
  });

  const { data: users } = trpc.users.getAll.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المهمة بنجاح");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "فشل إنشاء المهمة");
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المهمة بنجاح");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "فشل تحديث المهمة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority as "low" | "medium" | "high" | "urgent",
      status: formData.status as "todo" | "in_progress" | "review" | "completed" | "cancelled",
      category: formData.category as "content" | "design" | "ads" | "seo" | "social_media" | "analytics" | "other",
      assignedTo: formData.assignedTo && formData.assignedTo !== "none" ? parseInt(formData.assignedTo) : undefined,
      campaignId: formData.campaignId && formData.campaignId !== "none" ? parseInt(formData.campaignId) : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "تعديل المهمة" : "إنشاء مهمة جديدة"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>الأولوية</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="review">مراجعة</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>التصنيف</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as TaskCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">محتوى</SelectItem>
                  <SelectItem value="design">تصميم</SelectItem>
                  <SelectItem value="ads">إعلانات</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="social_media">سوشيال ميديا</SelectItem>
                  <SelectItem value="analytics">تحليلات</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>المعيّن إليه</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر عضو الفريق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">غير معيّن</SelectItem>
                  {users?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>الحملة المرتبطة</Label>
              <Select
                value={formData.campaignId}
                onValueChange={(value) => setFormData({ ...formData, campaignId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر حملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون حملة</SelectItem>
                  {campaigns?.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>تاريخ التسليم</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label>الساعات المقدرة</Label>
            <Input
              type="number"
              min="0"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              placeholder="عدد الساعات"
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              )}
              {task ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function DigitalMarketingTasksPage() {
  const { formatDate, formatDateTime } = useFormatDate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.tasks.stats.useQuery();

  const updateStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم تحديث حالة المهمة");
    },
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("تم حذف المهمة");
    },
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const statuses: TaskStatus[] = ["todo", "in_progress", "review", "completed"];

  return (
    <DashboardLayout pageTitle="مهام التسويق الرقمي" pageDescription="إدارة مهام فريق التسويق الرقمي">
      <div className="space-y-4 md:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">إدارة مهام فريق التسويق الرقمي</h1>
            <p className="text-sm text-muted-foreground">إنشاء وتوزيع ومتابعة المهام</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} className="h-9 w-9">
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button onClick={handleCreateNew} className="h-9 text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1.5 sm:me-2" />
              <span className="hidden sm:inline">مهمة جديدة</span>
              <span className="sm:hidden">جديد</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">الإجمالي</p>
                  <p className="text-lg sm:text-xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-muted rounded-lg">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">قيد الانتظار</p>
                  <p className="text-lg sm:text-xl font-bold">{stats?.todo || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">قيد التنفيذ</p>
                  <p className="text-lg sm:text-xl font-bold">{stats?.inProgress || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">مراجعة</p>
                  <p className="text-lg sm:text-xl font-bold">{stats?.review || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">مكتمل</p>
                  <p className="text-lg sm:text-xl font-bold">{stats?.completed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">متأخر</p>
                  <p className="text-lg sm:text-xl font-bold">{stats?.overdue || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & View Toggle */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
                  <Search className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في المهام..."
                    className="pe-8 sm:pe-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] text-sm">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="todo">قيد الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="review">مراجعة</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] text-sm">
                    <SelectValue placeholder="الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأولويات</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] text-sm">
                    <SelectValue placeholder="التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التصنيفات</SelectItem>
                    <SelectItem value="content">محتوى</SelectItem>
                    <SelectItem value="design">تصميم</SelectItem>
                    <SelectItem value="ads">إعلانات</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="social_media">سوشيال ميديا</SelectItem>
                    <SelectItem value="analytics">تحليلات</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-0.5 sm:gap-1 border rounded-lg p-0.5 sm:p-1">
                <Button
                  variant={viewMode === "kanban" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className="h-8 text-xs sm:text-sm"
                >
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1" />
                  <span className="hidden sm:inline">Kanban</span>
                  <span className="sm:hidden">K</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 text-xs sm:text-sm"
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 me-1" />
                  <span className="hidden sm:inline">قائمة</span>
                  <span className="sm:hidden">ق</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks || []}
                onTaskClick={handleTaskClick}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right p-3 font-medium">المهمة</th>
                      <th className="text-right p-3 font-medium">الحالة</th>
                      <th className="text-right p-3 font-medium">الأولوية</th>
                      <th className="text-right p-3 font-medium">التصنيف</th>
                      <th className="text-right p-3 font-medium">المعيّن إليه</th>
                      <th className="text-right p-3 font-medium">تاريخ التسليم</th>
                      <th className="text-right p-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks?.map((task: Task) => (
                      <tr 
                        key={task.id} 
                        className="border-t hover:bg-muted/30 cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={getCategoryColor(task.category)}>
                            {getCategoryLabel(task.category)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {task.assignedUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {(task.assignedUser.name || task.assignedUser.username).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {task.assignedUser.name || task.assignedUser.username}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">غير معيّن</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={isOverdue(task.dueDate, task.status) ? 'text-red-500' : ''}>
                            {formatDate(task.dueDate)}
                          </span>
                        </td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask(task);
                                setIsFormOpen(true);
                              }}>
                                <Edit className="h-4 w-4 me-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {(!tasks || tasks.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          لا توجد مهام
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Details Dialog */}
        <TaskDetailsDialog
          task={selectedTask}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={refetch}
          onDelete={handleDelete}
        />

        {/* Create/Edit Task Dialog */}
        <TaskFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          task={editingTask}
          onSuccess={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
