import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Settings, Save, Eye } from "lucide-react";
import { toast } from "sonner";

const categoryLabels = {
  patient_journey: "رحلة المريض",
  executive_reports: "تقارير الإدارة العليا",
  task_management: "إدارة فريق العمل",
  doctor_notifications: "إشعارات الأطباء",
};

const deliveryChannelLabels = {
  whatsapp_api: "WhatsApp Business API",
  whatsapp_integration: "WhatsApp Integration",
  both: "كلاهما",
};

export default function MessageSettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("patient_journey");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedChannel, setEditedChannel] = useState<string>("whatsapp_integration");

  const { data: allMessages, isLoading, refetch } = trpc.messageSettings.list.useQuery();

  const updateMutation = trpc.messageSettings.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث إعدادات الرسالة بنجاح");
      refetch();
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التحديث");
    },
  });

  const toggleMutation = trpc.messageSettings.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الرسالة");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التحديث");
    },
  });

  const filteredMessages = allMessages?.filter(
    (msg: any) => msg.category === selectedCategory
  );

  const handleEdit = (message: any) => {
    setSelectedMessage(message);
    setEditedContent(message.messageContent);
    setEditedChannel(message.deliveryChannel);
    setEditDialogOpen(true);
  };

  const handlePreview = (message: any) => {
    setSelectedMessage(message);
    setPreviewDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedMessage) return;

    updateMutation.mutate({
      id: selectedMessage.id,
      messageContent: editedContent,
      deliveryChannel: editedChannel as any,
    });
  };

  const handleToggle = (messageId: number) => {
    toggleMutation.mutate({ id: messageId });
  };

  const renderMessageWithVariables = (content: string, variables: string) => {
    let rendered = content;
    try {
      const vars = JSON.parse(variables || "[]");
      vars.forEach((v: string) => {
        rendered = rendered.replace(new RegExp(`\\{${v}\\}`, "g"), `<span class="text-purple-600 font-semibold">{${v}}</span>`);
      });
    } catch (e) {
      // ignore
    }
    return rendered;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إعدادات الرسائل التلقائية</h1>
          <p className="text-sm text-muted-foreground">
            إدارة وتخصيص جميع الرسائل التلقائية في النظام
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            اختر الفئة
          </CardTitle>
          <CardDescription>
            اختر فئة الرسائل التي تريد إدارتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                onClick={() => setSelectedCategory(key)}
                className={
                  selectedCategory === key
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : ""
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="grid gap-4">
        {filteredMessages?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد رسائل في هذه الفئة
            </CardContent>
          </Card>
        ) : (
          filteredMessages?.map((message: any) => (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{message.displayName}</CardTitle>
                    <CardDescription className="mt-1">
                      {message.description}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={message.isEnabled === 1}
                    onCheckedChange={() => handleToggle(message.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message Preview */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {message.messageContent.substring(0, 150)}
                    {message.messageContent.length > 150 && "..."}
                  </p>
                </div>

                {/* Info Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {deliveryChannelLabels[message.deliveryChannel as keyof typeof deliveryChannelLabels]}
                  </Badge>
                  {message.availableVariables && (
                    <Badge variant="secondary">
                      متغيرات: {JSON.parse(message.availableVariables).length}
                    </Badge>
                  )}
                  <Badge
                    variant={message.isEnabled === 1 ? "default" : "secondary"}
                    className={
                      message.isEnabled === 1
                        ? "bg-green-500 hover:bg-green-600"
                        : ""
                    }
                  >
                    {message.isEnabled === 1 ? "مفعّل" : "معطّل"}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(message)}
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleEdit(message)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Settings className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الرسالة</DialogTitle>
            <DialogDescription>
              قم بتعديل محتوى الرسالة وإعداداتها
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم الرسالة</Label>
                <p className="text-sm font-medium">{selectedMessage.displayName}</p>
              </div>

              <div className="space-y-2">
                <Label>قناة الإرسال</Label>
                <Select value={editedChannel} onValueChange={setEditedChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp_api">WhatsApp Business API</SelectItem>
                    <SelectItem value="whatsapp_integration">WhatsApp Integration</SelectItem>
                    <SelectItem value="both">كلاهما</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>محتوى الرسالة</Label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                  className="font-arabic"
                  dir="rtl"
                />
              </div>

              {selectedMessage.availableVariables && (
                <div className="space-y-2">
                  <Label>المتغيرات المتاحة</Label>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedMessage.availableVariables).map((v: string) => (
                      <Badge key={v} variant="secondary">
                        {`{${v}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    استخدم هذه المتغيرات في محتوى الرسالة وسيتم استبدالها تلقائياً
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة الرسالة</DialogTitle>
            <DialogDescription>
              هذه معاينة للرسالة مع المتغيرات
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <p
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: renderMessageWithVariables(
                      selectedMessage.messageContent,
                      selectedMessage.availableVariables
                    ),
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>المعلومات</Label>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">القناة:</span>{" "}
                    {deliveryChannelLabels[selectedMessage.deliveryChannel as keyof typeof deliveryChannelLabels]}
                  </p>
                  <p>
                    <span className="font-medium">الحالة:</span>{" "}
                    {selectedMessage.isEnabled === 1 ? "مفعّل" : "معطّل"}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setPreviewDialogOpen(false)}
                className="w-full"
              >
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
