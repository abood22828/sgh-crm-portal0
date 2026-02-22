import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Timer,
  Video,
  Camera,
  Palette,
  Film,
  Image,
  Music,
  FileVideo,
  Clapperboard,
  RefreshCw,
  GripVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// أنواع المهام - متوافقة مع schema قاعدة البيانات
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
// التصنيفات المدعومة في قاعدة البيانات
type TaskCategory = 'content' | 'design' | 'ads' | 'seo' | 'social_media' | 'analytics' | 'other';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignedTo: number | null;
  assignedUser?: { id: number; name: string | null; username: string } | null;
  campaignId: number | null;
  campaign?: { id: number; name: string } | null;
  dueDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  tags?: string | null;
}

// تصنيفات الإعلام - مع mapping للتصنيفات المدعومة في قاعدة البيانات
const mediaCategories: { value: TaskCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'design', label: 'تصميم جرافيك', icon: <Palette className="w-4 h-4" /> },
  { value: 'content', label: 'إنتاج محتوى', icon: <Video className="w-4 h-4" /> },
  { value: 'social_media', label: 'سوشيال ميديا', icon: <Film className="w-4 h-4" /> },
  { value: 'ads', label: 'إعلانات', icon: <Camera className="w-4 h-4" /> },
  { value: 'analytics', label: 'تحليلات', icon: <FileVideo className="w-4 h-4" /> },
  { value: 'other', label: 'أخرى', icon: <Clapperboard className="w-4 h-4" /> },
];

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  todo: { label: 'قيد الانتظار', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: <Circle className="w-4 h-4" /> },
  in_progress: { label: 'قيد التنفيذ', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Timer className="w-4 h-4" /> },
  review: { label: 'مراجعة', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: <AlertCircle className="w-4 h-4" /> },
  completed: { label: 'مكتمل', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle2 className="w-4 h-4" /> },
  cancelled: { label: 'ملغي', color: 'text-red-600', bgColor: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'منخفضة', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  medium: { label: 'متوسطة', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: 'عالية', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgent: { label: 'عاجلة', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const getCategoryInfo = (category: TaskCategory) => {
  return mediaCategories.find(c => c.value === category) || mediaCategories[mediaCategories.length - 1];
};

export default function MediaTeamPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: TaskCategory;
    assignedToId: string;
    campaignId: string;
    dueDate: string;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: 'design',
    assignedToId: 'none',
    campaignId: 'none',
    dueDate: '',
  });

  // جلب المهام - فلترة حسب tags = 'media' لعرض مهام فريق الإعلام فقط
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = trpc.tasks.list.useQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchQuery || undefined,
  });

  // جلب المستخدمين
  const { data: usersData } = trpc.users.getAll.useQuery();

  // جلب الحملات
  const { data: campaignsData } = trpc.campaigns.list.useQuery({});

  // إنشاء مهمة
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء المهمة بنجاح');
      setIsCreateDialogOpen(false);
      resetForm();
      refetchTasks();
    },
    onError: (error) => {
      toast.error('فشل إنشاء المهمة: ' + error.message);
    },
  });

  // تحديث مهمة
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث المهمة بنجاح');
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      resetForm();
      refetchTasks();
    },
    onError: (error) => {
      toast.error('فشل تحديث المهمة: ' + error.message);
    },
  });

  // تحديث حالة المهمة
  const updateStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث الحالة بنجاح');
      refetchTasks();
    },
    onError: (error) => {
      toast.error('فشل تحديث الحالة: ' + error.message);
    },
  });

  // حذف مهمة
  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success('تم حذف المهمة بنجاح');
      refetchTasks();
    },
    onError: (error) => {
      toast.error('فشل حذف المهمة: ' + error.message);
    },
  });

  // فلترة المهام لعرض مهام فريق الإعلام فقط (tags = 'media')
  const tasks = useMemo(() => {
    const allTasks = tasksData || [];
    return allTasks.filter((t: any) => t.tags === 'media');
  }, [tasksData]);
  
  const users = usersData || [];
  const campaigns = campaignsData || [];

  // إحصائيات
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === 'todo').length,
      inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
      review: tasks.filter((t: any) => t.status === 'review').length,
      completed: tasks.filter((t: any) => t.status === 'completed').length,
      overdue: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    };
  }, [tasks]);

  // تجميع المهام حسب الحالة للـ Kanban
  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((t: any) => t.status === 'todo'),
      in_progress: tasks.filter((t: any) => t.status === 'in_progress'),
      review: tasks.filter((t: any) => t.status === 'review'),
      completed: tasks.filter((t: any) => t.status === 'completed'),
    };
  }, [tasks]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      category: 'design',
      assignedToId: 'none',
      campaignId: 'none',
      dueDate: '',
    });
  };

  const handleCreateTask = () => {
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }
    if (formData.title.trim().length < 3) {
      toast.error('يجب أن يكون عنوان المهمة 3 أحرف على الأقل');
      return;
    }
    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 3) {
      toast.error('يجب أن يكون وصف المهمة 3 أحرف على الأقل أو فارغاً');
      return;
    }

    createTaskMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      category: formData.category,
      assignedTo: formData.assignedToId !== 'none' ? parseInt(formData.assignedToId) : undefined,
      campaignId: formData.campaignId !== 'none' ? parseInt(formData.campaignId) : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      tags: 'media', // علامة لتمييز مهام فريق الإعلام
    });
  };

  const handleEditTask = () => {
    if (!selectedTask || !formData.title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }
    if (formData.title.trim().length < 3) {
      toast.error('يجب أن يكون عنوان المهمة 3 أحرف على الأقل');
      return;
    }
    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 3) {
      toast.error('يجب أن يكون وصف المهمة 3 أحرف على الأقل أو فارغاً');
      return;
    }

    updateTaskMutation.mutate({
      id: selectedTask.id,
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      category: formData.category,
      assignedTo: formData.assignedToId !== 'none' ? parseInt(formData.assignedToId) : null,
      campaignId: formData.campaignId !== 'none' ? parseInt(formData.campaignId) : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    });
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category,
      assignedToId: task.assignedTo?.toString() || 'none',
      campaignId: task.campaignId?.toString() || 'none',
      dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : new Date(task.dueDate).toISOString().split('T')[0]) : '',
    });
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  // Task Card Component
  const TaskCard = ({ task }: { task: Task }) => {
    const categoryInfo = getCategoryInfo(task.category);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('taskId', task.id.toString());
          e.dataTransfer.setData('currentStatus', task.status);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <Badge className={`${priorityConfig[task.priority].bgColor} ${priorityConfig[task.priority].color} text-xs`}>
                {priorityConfig[task.priority].label}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(task)}>
                  <Edit className="ml-2 h-4 w-4" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>
          
          {task.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {categoryInfo.icon}
              {categoryInfo.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {task.assignedUser?.name && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {task.assignedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString('ar-SA')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Kanban Column Component
  const KanbanColumn = ({ status, tasks }: { status: TaskStatus; tasks: Task[] }) => {
    const config = statusConfig[status];
    
    return (
      <div className="flex-shrink-0 w-[280px] sm:w-[300px]">
        <div className={`rounded-t-lg p-3 ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.icon}
              <span className={`font-medium ${config.color}`}>{config.label}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-400px)] bg-muted/30 rounded-b-lg p-2">
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد مهام
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Task Form Component
  const TaskForm = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>عنوان المهمة *</Label>
        <Input
          placeholder="أدخل عنوان المهمة"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>الوصف</Label>
        <Textarea
          placeholder="أدخل وصف المهمة"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>الحالة</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">قيد الانتظار</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="review">مراجعة</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>الأولوية</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="urgent">عاجلة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>التصنيف</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as TaskCategory })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              {mediaCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    {cat.icon}
                    {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>تاريخ التسليم</Label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>المعيّن إليه</Label>
          <Select
            value={formData.assignedToId}
            onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر عضو الفريق" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">غير محدد</SelectItem>
              {users.map((user: any) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>الحملة المرتبطة</Label>
          <Select
            value={formData.campaignId}
            onValueChange={(value) => setFormData({ ...formData, campaignId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الحملة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">غير محدد</SelectItem>
              {campaigns.map((campaign: any) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      pageTitle="فريق وحدة الإعلام"
      pageDescription="إدارة مهام الإنتاج الإعلامي">
      <div className="container py-4 md:py-6 lg:py-8" dir="rtl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
              فريق وحدة الإعلام
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              إدارة مهام الإنتاج الإعلامي (فيديو، تصميم، تصوير، مونتاج)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetchTasks()} className="h-9 w-9">
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 text-sm">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                  <span className="hidden sm:inline">مهمة جديدة</span>
                  <span className="sm:hidden">جديد</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
                  <DialogDescription>
                    أضف مهمة جديدة لفريق وحدة الإعلام
                  </DialogDescription>
                </DialogHeader>
                <TaskForm />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">إجمالي المهام</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground">{stats.pending}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">قيد الانتظار</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">قيد التنفيذ</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{stats.review}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">مراجعة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">مكتمل</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">متأخر</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في المهام..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="todo">قيد الانتظار</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="review">مراجعة</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {mediaCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      {cat.icon}
                      {cat.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(['todo', 'in_progress', 'review', 'completed'] as const).map(status => (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = parseInt(e.dataTransfer.getData('taskId'));
                  const currentStatus = e.dataTransfer.getData('currentStatus');
                  if (currentStatus !== status) {
                    handleStatusChange(taskId, status);
                  }
                }}
              >
                <KanbanColumn status={status} tasks={tasksByStatus[status] as Task[]} />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-right p-4 font-medium">المهمة</th>
                      <th className="text-right p-4 font-medium">التصنيف</th>
                      <th className="text-right p-4 font-medium">الحالة</th>
                      <th className="text-right p-4 font-medium">الأولوية</th>
                      <th className="text-right p-4 font-medium">المعيّن إليه</th>
                      <th className="text-right p-4 font-medium">تاريخ التسليم</th>
                      <th className="text-right p-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task: any) => {
                      const categoryInfo = getCategoryInfo(task.category as TaskCategory);
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                      return (
                        <tr key={task.id} className={`border-b hover:bg-muted/30 ${isOverdue ? 'bg-red-50' : ''}`}>
                          <td className="p-4">
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-1 text-sm">
                              {categoryInfo.icon}
                              {categoryInfo.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge className={`${statusConfig[task.status as TaskStatus].bgColor} ${statusConfig[task.status as TaskStatus].color}`}>
                              {statusConfig[task.status as TaskStatus].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${priorityConfig[task.priority as TaskPriority].bgColor} ${priorityConfig[task.priority as TaskPriority].color}`}>
                              {priorityConfig[task.priority as TaskPriority].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {task.assignedUser?.name || '-'}
                          </td>
                          <td className="p-4">
                            {task.dueDate ? (
                              <span className={isOverdue ? 'text-red-600' : ''}>
                                {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {tasks.length === 0 && (
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل المهمة</DialogTitle>
              <DialogDescription>
                تعديل بيانات المهمة
              </DialogDescription>
            </DialogHeader>
            <TaskForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleEditTask} disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
