import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus,
  Search,
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  Users,
  BarChart3,
  Megaphone,
  CheckCircle,
  Clock,
  PauseCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

// Helper functions
const getCampaignTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    digital: "رقمية",
    field: "ميدانية",
    awareness: "توعوية",
    mixed: "مختلطة",
  };
  return labels[type] || type;
};

const getCampaignStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: "مسودة",
    active: "نشطة",
    paused: "متوقفة",
    completed: "مكتملة",
    cancelled: "ملغاة",
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: "bg-muted text-foreground",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-muted text-foreground";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    draft: <Clock className="h-4 w-4" />,
    active: <CheckCircle className="h-4 w-4" />,
    paused: <PauseCircle className="h-4 w-4" />,
    completed: <CheckCircle className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />,
  };
  return icons[status] || <Clock className="h-4 w-4" />;
};

const platformOptions = [
  { value: "facebook", label: "فيسبوك" },
  { value: "instagram", label: "إنستغرام" },
  { value: "google", label: "جوجل" },
  { value: "twitter", label: "تويتر" },
  { value: "tiktok", label: "تيك توك" },
  { value: "snapchat", label: "سناب شات" },
  { value: "youtube", label: "يوتيوب" },
  { value: "linkedin", label: "لينكد إن" },
  { value: "email", label: "بريد إلكتروني" },
  { value: "sms", label: "رسائل SMS" },
  { value: "whatsapp", label: "واتساب" },
  { value: "outdoor", label: "إعلانات خارجية" },
  { value: "tv", label: "تلفزيون" },
  { value: "radio", label: "راديو" },
];

interface CampaignFormData {
  name: string;
  slug: string;
  description: string;
  type: string;
  status: string;
  plannedBudget: string;
  actualBudget: string;
  targetLeads: string;
  targetBookings: string;
  targetRevenue: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  teamMembers: string;
  kpis: string;
  notes: string;
}

const initialFormData: CampaignFormData = {
  name: "",
  slug: "",
  description: "",
  type: "digital",
  status: "draft",
  plannedBudget: "",
  actualBudget: "",
  targetLeads: "",
  targetBookings: "",
  targetRevenue: "",
  startDate: "",
  endDate: "",
  platforms: [],
  teamMembers: "",
  kpis: "",
  notes: "",
};

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);

  // Queries
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = trpc.campaigns.getOverview.useQuery();
  const { data: campaigns, isLoading: loadingCampaigns, refetch } = trpc.campaigns.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    search: searchQuery || undefined,
  });

  // Mutations
  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الحملة بنجاح");
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      refetch();
      refetchOverview();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء الحملة: ${error.message}`);
    },
  });

  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحملة بنجاح");
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
      setFormData(initialFormData);
      refetch();
      refetchOverview();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الحملة: ${error.message}`);
    },
  });

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحملة بنجاح");
      refetch();
      refetchOverview();
    },
    onError: (error) => {
      toast.error(`فشل حذف الحملة: ${error.message}`);
    },
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      type: formData.type as any,
      status: formData.status as any,
      plannedBudget: formData.plannedBudget ? Number(formData.plannedBudget) : undefined,
      actualBudget: formData.actualBudget ? Number(formData.actualBudget) : undefined,
      targetLeads: formData.targetLeads ? Number(formData.targetLeads) : undefined,
      targetBookings: formData.targetBookings ? Number(formData.targetBookings) : undefined,
      targetRevenue: formData.targetRevenue ? Number(formData.targetRevenue) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      platforms: formData.platforms.length > 0 ? formData.platforms.join(",") : undefined,
      teamMembers: formData.teamMembers || undefined,
      kpis: formData.kpis || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleEditCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    
    updateMutation.mutate({
      id: selectedCampaign.id,
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type as any,
      status: formData.status as any,
      plannedBudget: formData.plannedBudget ? Number(formData.plannedBudget) : undefined,
      actualBudget: formData.actualBudget ? Number(formData.actualBudget) : undefined,
      targetLeads: formData.targetLeads ? Number(formData.targetLeads) : undefined,
      targetBookings: formData.targetBookings ? Number(formData.targetBookings) : undefined,
      targetRevenue: formData.targetRevenue ? Number(formData.targetRevenue) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      platforms: formData.platforms.length > 0 ? formData.platforms.join(",") : undefined,
      teamMembers: formData.teamMembers || undefined,
      kpis: formData.kpis || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleDeleteCampaign = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحملة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (campaign: any) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name || "",
      slug: campaign.slug || "",
      description: campaign.description || "",
      type: campaign.type || "digital",
      status: campaign.status || "draft",
      plannedBudget: campaign.plannedBudget?.toString() || "",
      actualBudget: campaign.actualBudget?.toString() || "",
      targetLeads: campaign.targetLeads?.toString() || "",
      targetBookings: campaign.targetBookings?.toString() || "",
      targetRevenue: campaign.targetRevenue?.toString() || "",
      startDate: campaign.startDate ? format(new Date(campaign.startDate), "yyyy-MM-dd") : "",
      endDate: campaign.endDate ? format(new Date(campaign.endDate), "yyyy-MM-dd") : "",
      platforms: campaign.platforms ? campaign.platforms.split(",") : [],
      teamMembers: campaign.teamMembers || "",
      kpis: campaign.kpis || "",
      notes: campaign.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsViewDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  // Calculate progress
  const calculateProgress = (campaign: any) => {
    if (!campaign.targetLeads || campaign.targetLeads === 0) return 0;
    const actualLeads = campaign.actualLeads || 0;
    return Math.min(100, Math.round((actualLeads / campaign.targetLeads) * 100));
  };

  return (
    <DashboardLayout
      pageTitle="إدارة الحملات والمشاريع"
      pageDescription="إدارة شاملة للحملات التسويقية والمشاريع"
    >
      <div className="space-y-4 md:space-y-6" dir="rtl">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2 p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                إجمالي الحملات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              {loadingOverview ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-blue-800">{overview?.totalCampaigns || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2 p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                نشطة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              {loadingOverview ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-green-600" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-green-800">{overview?.activeCampaigns || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2 p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700 flex items-center gap-1.5">
                <PauseCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                متوقفة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              {loadingOverview ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-yellow-600" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-yellow-800">
                  {campaigns?.filter((c: any) => c.status === "paused").length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2 p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                الميزانية المخططة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              {loadingOverview ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-purple-600" />
              ) : (
                <div className="text-base sm:text-lg font-bold text-purple-800">
                  {(overview?.totalPlannedBudget || 0).toLocaleString()}
                  <span className="text-[10px] sm:text-xs mr-1">ريال</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2 p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                الميزانية الفعلية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              {loadingOverview ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-orange-600" />
              ) : (
                <div className="text-base sm:text-lg font-bold text-orange-800">
                  {(overview?.totalActualBudget || 0).toLocaleString()}
                  <span className="text-[10px] sm:text-xs mr-1">ريال</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardHeader className="pb-2 p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-teal-700 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                إجمالي الأهداف
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              {loadingOverview ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-teal-600" />
              ) : (
                <div className="text-base sm:text-lg font-bold text-teal-800">
                  {campaigns?.reduce((sum: number, c: any) => sum + (c.targetLeads || 0), 0).toLocaleString() || 0}
                  <span className="text-xs mr-1">عميل</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  قائمة الحملات
                </CardTitle>
                <CardDescription>إدارة جميع الحملات التسويقية والمشاريع</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => { refetch(); refetchOverview(); }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => { setFormData(initialFormData); setIsCreateDialogOpen(true); }}>
                  <Plus className="ml-2 h-4 w-4" />
                  حملة جديدة
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الحملات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8 sm:pr-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] text-sm">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="paused">متوقفة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px] text-sm">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="digital">رقمية</SelectItem>
                  <SelectItem value="field">ميدانية</SelectItem>
                  <SelectItem value="awareness">توعوية</SelectItem>
                  <SelectItem value="mixed">مختلطة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loadingCampaigns ? (
              <div className="flex justify-center py-6 sm:py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : campaigns && campaigns.length > 0 ? (
              <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs sm:text-sm">
                      <TableHead className="text-right min-w-[150px]">الحملة</TableHead>
                      <TableHead className="text-right min-w-[80px]">النوع</TableHead>
                      <TableHead className="text-right min-w-[90px]">الحالة</TableHead>
                      <TableHead className="text-right hidden md:table-cell min-w-[100px]">الميزانية</TableHead>
                      <TableHead className="text-right hidden lg:table-cell min-w-[120px]">التقدم</TableHead>
                      <TableHead className="text-right hidden md:table-cell min-w-[100px]">الفترة</TableHead>
                      <TableHead className="text-right min-w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign: any) => (
                      <TableRow key={campaign.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">{campaign.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCampaignTypeLabel(campaign.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(campaign.status)}
                            {getCampaignStatusLabel(campaign.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            <div>مخطط: {campaign.plannedBudget?.toLocaleString() || 0}</div>
                            <div className="text-muted-foreground">فعلي: {campaign.actualBudget?.toLocaleString() || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{calculateProgress(campaign)}%</span>
                              <span>{campaign.actualLeads || 0}/{campaign.targetLeads || 0}</span>
                            </div>
                            <Progress value={calculateProgress(campaign)} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            {campaign.startDate && (
                              <div>{format(new Date(campaign.startDate), "dd/MM/yyyy")}</div>
                            )}
                            {campaign.endDate && (
                              <div className="text-muted-foreground">إلى {format(new Date(campaign.endDate), "dd/MM/yyyy")}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openViewDialog(campaign)}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(campaign)}
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground mb-4">لا توجد حملات</p>
                <Button onClick={() => { setFormData(initialFormData); setIsCreateDialogOpen(true); }}>
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء أول حملة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedCampaign(null);
            setFormData(initialFormData);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditDialogOpen ? "تعديل الحملة" : "إضافة حملة جديدة"}</DialogTitle>
              <DialogDescription>
                {isEditDialogOpen ? "تحديث معلومات الحملة التسويقية" : "أدخل معلومات الحملة التسويقية الجديدة"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={isEditDialogOpen ? handleEditCampaign : handleCreateCampaign}>
              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">اسم الحملة *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: !isEditDialogOpen ? generateSlug(e.target.value) : formData.slug
                        });
                      }}
                      required
                    />
                  </div>
                  {!isEditDialogOpen && (
                    <div className="grid gap-2">
                      <Label htmlFor="slug">الرابط المختصر *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                        placeholder="campaign-name"
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Type and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>النوع *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital">رقمية</SelectItem>
                        <SelectItem value="field">ميدانية</SelectItem>
                        <SelectItem value="awareness">توعوية</SelectItem>
                        <SelectItem value="mixed">مختلطة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>الحالة *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="active">نشطة</SelectItem>
                        <SelectItem value="paused">متوقفة</SelectItem>
                        <SelectItem value="completed">مكتملة</SelectItem>
                        <SelectItem value="cancelled">ملغاة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">تاريخ البدء</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plannedBudget">الميزانية المخططة (ريال)</Label>
                    <Input
                      id="plannedBudget"
                      type="number"
                      value={formData.plannedBudget}
                      onChange={(e) => setFormData({ ...formData, plannedBudget: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="actualBudget">الميزانية الفعلية (ريال)</Label>
                    <Input
                      id="actualBudget"
                      type="number"
                      value={formData.actualBudget}
                      onChange={(e) => setFormData({ ...formData, actualBudget: e.target.value })}
                    />
                  </div>
                </div>

                {/* Targets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="targetLeads">هدف العملاء</Label>
                    <Input
                      id="targetLeads"
                      type="number"
                      value={formData.targetLeads}
                      onChange={(e) => setFormData({ ...formData, targetLeads: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetBookings">هدف الحجوزات</Label>
                    <Input
                      id="targetBookings"
                      type="number"
                      value={formData.targetBookings}
                      onChange={(e) => setFormData({ ...formData, targetBookings: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetRevenue">هدف الإيرادات (ريال)</Label>
                    <Input
                      id="targetRevenue"
                      type="number"
                      value={formData.targetRevenue}
                      onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                    />
                  </div>
                </div>

                {/* Platforms */}
                <div className="grid gap-2">
                  <Label>المنصات</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                    {platformOptions.map((platform) => (
                      <div
                        key={platform.value}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                          formData.platforms.includes(platform.value)
                            ? "bg-primary text-white"
                            : "bg-white dark:bg-card border hover:bg-muted"
                        }`}
                        onClick={() => handlePlatformToggle(platform.value)}
                      >
                        <span className="text-sm">{platform.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team and KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teamMembers">الفريق المسؤول</Label>
                    <Input
                      id="teamMembers"
                      value={formData.teamMembers}
                      onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                      placeholder="أسماء أعضاء الفريق"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kpis">مؤشرات الأداء (KPIs)</Label>
                    <Input
                      id="kpis"
                      value={formData.kpis}
                      onChange={(e) => setFormData({ ...formData, kpis: e.target.value })}
                      placeholder="CTR, CPA, ROAS..."
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedCampaign(null);
                  setFormData(initialFormData);
                }}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                  {isEditDialogOpen ? "حفظ التغييرات" : "إنشاء الحملة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                تفاصيل الحملة
              </DialogTitle>
            </DialogHeader>
            {selectedCampaign && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedCampaign.name}</h3>
                    {selectedCampaign.description && (
                      <p className="text-muted-foreground mt-1">{selectedCampaign.description}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(selectedCampaign.status)}>
                    {getCampaignStatusLabel(selectedCampaign.status)}
                  </Badge>
                </div>

                {/* Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">تقدم الحملة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>العملاء المستهدفين</span>
                        <span>{selectedCampaign.actualLeads || 0} / {selectedCampaign.targetLeads || 0}</span>
                      </div>
                      <Progress value={calculateProgress(selectedCampaign)} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">النوع</Label>
                    <p className="font-medium">{getCampaignTypeLabel(selectedCampaign.type)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">الرابط</Label>
                    <p className="font-medium text-primary" dir="ltr">{selectedCampaign.slug}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">تاريخ البدء</Label>
                    <p className="font-medium">
                      {selectedCampaign.startDate
                        ? format(new Date(selectedCampaign.startDate), "dd MMMM yyyy", { locale: ar })
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">تاريخ الانتهاء</Label>
                    <p className="font-medium">
                      {selectedCampaign.endDate
                        ? format(new Date(selectedCampaign.endDate), "dd MMMM yyyy", { locale: ar })
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">الميزانية المخططة</Label>
                    <p className="font-medium">{selectedCampaign.plannedBudget?.toLocaleString() || 0} ريال</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">الميزانية الفعلية</Label>
                    <p className="font-medium">{selectedCampaign.actualBudget?.toLocaleString() || 0} ريال</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">هدف الحجوزات</Label>
                    <p className="font-medium">{selectedCampaign.targetBookings || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">هدف الإيرادات</Label>
                    <p className="font-medium">{selectedCampaign.targetRevenue?.toLocaleString() || 0} ريال</p>
                  </div>
                </div>

                {/* Platforms */}
                {selectedCampaign.platforms && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">المنصات</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.platforms.split(",").map((platform: string) => (
                        <Badge key={platform} variant="outline">
                          {platformOptions.find(p => p.value === platform)?.label || platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team */}
                {selectedCampaign.teamMembers && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">الفريق المسؤول</Label>
                    <p>{selectedCampaign.teamMembers}</p>
                  </div>
                )}

                {/* KPIs */}
                {selectedCampaign.kpis && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">مؤشرات الأداء</Label>
                    <p>{selectedCampaign.kpis}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedCampaign.notes && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">ملاحظات</Label>
                    <p className="text-foreground">{selectedCampaign.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(selectedCampaign);
                  }}>
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsViewDialogOpen(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
