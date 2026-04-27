import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle, Send, MessageSquare, RefreshCw, Copy, Check, Search, Ban, TrendingUp, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function WhatsAppIntegration() {
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [templateName, setTemplateName] = useState("sgh_welcome_greeting_ar");
  const [parameters, setParameters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  // Queries
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } =
    trpc.whatsappTemplateTest.listApprovedTemplates.useQuery();
  const { data: templateDetails, isLoading: detailsLoading } =
    trpc.whatsappTemplateTest.getTemplateDetails.useQuery(
      { templateName },
      { enabled: !!templateName }
    );
  const { data: securityStats } = trpc.whatsapp.getSecurityStats.useQuery();

  // Mutations
  const sendWelcomeGreeting = trpc.whatsappTemplateTest.sendWelcomeGreeting.useMutation();
  const sendTemplate = trpc.whatsappTemplateTest.sendTemplate.useMutation();

  const handleSendWelcome = async () => {
    if (!phone || !fullName) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Check if phone is blocked
    const blockedPhones = securityStats?.stats?.blockedPhones || 0;
    if (blockedPhones > 0) {
      // This is a simple check - in real implementation, we'd check specific phone
      toast.warning("⚠️ يرجى التحقق من أن الرقم غير محظور");
    }

    setIsLoading(true);
    try {
      const result = await sendWelcomeGreeting.mutateAsync({
        phone,
        fullName,
      });

      if (result.success) {
        toast.success("✅ تم إرسال رسالة الترحيب بنجاح!");
        // Add to sent messages history
        setSentMessages(prev => [...prev, {
          type: "welcome",
          phone,
          recipient: fullName,
          template: "sgh_welcome_greeting_ar",
          status: "sent",
          sentAt: new Date().toISOString(),
        }]);
        setPhone("");
        setFullName("");
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      toast.error("حدث خطأ في الإرسال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!phone) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    // Check if phone is blocked
    const blockedPhones = securityStats?.stats?.blockedPhones || 0;
    if (blockedPhones > 0) {
      toast.warning("⚠️ يرجى التحقق من أن الرقم غير محظور");
    }

    const expectedParams = templateDetails?.template?.variables?.length || 0;
    if (parameters.length !== expectedParams) {
      toast.error(
        `عدد المتغيرات غير صحيح. المتوقع: ${expectedParams}, المقدم: ${parameters.length}`
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendTemplate.mutateAsync({
        phone,
        templateName,
        parameters,
      });

      if (result.success) {
        toast.success("✅ تم إرسال الرسالة بنجاح!");
        // Add to sent messages history
        setSentMessages(prev => [...prev, {
          type: "template",
          phone,
          template: templateName,
          parameters,
          status: "sent",
          sentAt: new Date().toISOString(),
        }]);
        setPhone("");
        setParameters([]);
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      toast.error("حدث خطأ في الإرسال");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("تم النسخ!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter templates
  const filteredTemplates = templates?.templates?.filter((tmpl: any) => {
    const matchesSearch = searchQuery === "" || 
      tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.metaName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || tmpl.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = Array.from(new Set(templates?.templates?.map((t: any) => t.category) || []));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <DashboardLayout
      pageTitle="تكامل WhatsApp Cloud API"
      pageDescription="إدارة وإرسال رسائل WhatsApp المعتمدة"
    >
      <div className="container px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  تكامل WhatsApp Cloud API
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  إرسال رسائل معتمدة من Meta إلى عملائك
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTemplates()}
              disabled={templatesLoading}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>

          {/* Status Alert */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ {templates?.count || 0} قالب معتمد من Meta وجاهز للاستخدام
            </AlertDescription>
          </Alert>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  القوالب المعتمدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates?.count || 0}</div>
                <p className="text-xs text-muted-foreground">قالب</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  الرسائل المرسلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sentMessages.length}</div>
                <p className="text-xs text-muted-foreground">رسالة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  الأرقام المحظورة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityStats?.stats?.blockedPhones || 0}</div>
                <p className="text-xs text-muted-foreground">رقم</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="welcome">رسالة ترحيب</TabsTrigger>
            <TabsTrigger value="templates">جميع القوالب</TabsTrigger>
            <TabsTrigger value="history">سجل الإرسال</TabsTrigger>
          </TabsList>

          {/* Tab 1: Welcome Greeting */}
          <TabsContent value="welcome">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview Card */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader>
                  <CardTitle className="text-lg">معاينة الرسالة</CardTitle>
                  <CardDescription>كيف ستظهر الرسالة للعميل</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-4 rounded-lg border border-green-200 text-sm text-gray-700 leading-relaxed space-y-3">
                    <div className="font-semibold text-green-700">
                      {fullName || "اسم العميل"}
                    </div>
                    <div className="text-gray-600">
                      <p>مرحباً بك عزيزي العميل،</p>
                      <p className="mt-2">
                        أهلاً وسهلاً في المستشفى السعودي الألماني. 👋
                      </p>
                      <p className="mt-2">
                        نحن هنا لتقديم أفضل الخدمات الطبية لك ولعائلتك.
                      </p>
                      <p className="mt-3 font-semibold">خدماتنا:</p>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>مواعيد طبية مع أفضل الأطباء</li>
                        <li>مخيمات صحية متخصصة</li>
                        <li>عروض خاصة وحزم علاجية</li>
                      </ul>
                      <p className="mt-3">
                        شكراً لاختيارك المستشفى السعودي الألماني
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        #نرعاكم_كأهالينا
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Input Form Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إرسال الرسالة</CardTitle>
                  <CardDescription>أدخل بيانات العميل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف (مثال: 773171477 أو +967773171477)
                    </label>
                    <Input
                      type="tel"
                      placeholder="أدخل رقم الهاتف"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل
                    </label>
                    <Input
                      type="text"
                      placeholder="أدخل الاسم الكامل"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-right"
                    />
                  </div>

                  <Button
                    onClick={handleSendWelcome}
                    disabled={isLoading || sendWelcomeGreeting.isPending || !phone || !fullName}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    size="lg"
                  >
                    {isLoading || sendWelcomeGreeting.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        إرسال رسالة الترحيب
                      </>
                    )}
                  </Button>

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      تأكد من أن رقم الهاتف صحيح وأن الجهاز لديه WhatsApp مثبت
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: All Templates */}
          <TabsContent value="templates">
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="بحث في القوالب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="فلترة حسب الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Templates List */}
              <Card>
                <CardHeader>
                  <CardTitle>قائمة القوالب المعتمدة</CardTitle>
                  <CardDescription>
                    {templatesLoading
                      ? "جاري التحميل..."
                      : `${filteredTemplates.length} قالب معتمد من Meta`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredTemplates.map((tmpl: any) => (
                        <div
                          key={tmpl.id}
                          className="p-3 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 cursor-pointer transition"
                          onClick={() => setTemplateName(tmpl.metaName || "")}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {tmpl.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {tmpl.metaName}
                              </p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {tmpl.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                {tmpl.metaCategory}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      لا توجد قوالب معتمدة
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Template Details */}
              {templateDetails?.template && (
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader>
                    <CardTitle>تفاصيل القالب</CardTitle>
                    <CardDescription>{templateDetails.template.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Template Content */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        محتوى الرسالة:
                      </p>
                      <div className="bg-white p-4 rounded border border-blue-200 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {templateDetails.template.content}
                      </div>
                    </div>

                    {/* Variables */}
                    {templateDetails.template.variables &&
                      templateDetails.template.variables.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">
                            المتغيرات المطلوبة:
                          </p>
                          <div className="space-y-3">
                            {templateDetails.template.variables.map(
                              (variable: string, index: number) => (
                                <div key={index}>
                                  <label className="block text-sm text-gray-600 mb-1">
                                    {variable} ({`{{${index + 1}}}`})
                                  </label>
                                  <Input
                                    type="text"
                                    placeholder={`أدخل قيمة ${variable}`}
                                    value={parameters[index] || ""}
                                    onChange={(e) => {
                                      const newParams = [...parameters];
                                      newParams[index] = e.target.value;
                                      setParameters(newParams);
                                    }}
                                    className="text-right"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      <Input
                        type="tel"
                        placeholder="أدخل رقم الهاتف"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-right"
                      />
                    </div>

                    {/* Send Button */}
                    <Button
                      onClick={handleSendTemplate}
                      disabled={isLoading || sendTemplate.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                      size="lg"
                    >
                      {isLoading || sendTemplate.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Send History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  سجل الإرسال
                </CardTitle>
                <CardDescription>تتبع الرسائل المرسلة من هذه الصفحة</CardDescription>
              </CardHeader>
              <CardContent>
                {sentMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد رسائل مرسلة بعد</p>
                    <p className="text-sm mt-1">ستظهر هنا الرسائل التي ترسلها من هذه الصفحة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentMessages.map((msg, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{msg.phone}</span>
                              <Badge variant="outline" className="text-xs">
                                {msg.type === "welcome" ? "ترحيب" : "قالب"}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                {msg.status}
                              </Badge>
                            </div>
                            {msg.recipient && (
                              <p className="text-sm text-muted-foreground mt-1">
                                المستلم: {msg.recipient}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              القالب: {msg.template}
                            </p>
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(msg.sentAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Meta Documentation Link */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            📚 لمزيد من المعلومات، اطلع على{" "}
            <a
              href="https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              وثائق Meta الرسمية
            </a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
