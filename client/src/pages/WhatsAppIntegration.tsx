import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Send, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function WhatsAppIntegration() {
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [templateName, setTemplateName] = useState("sgh_welcome_greeting_ar");
  const [parameters, setParameters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const { data: templates, isLoading: templatesLoading } =
    trpc.whatsappTemplateTest.listApprovedTemplates.useQuery();
  const { data: templateDetails, isLoading: detailsLoading } =
    trpc.whatsappTemplateTest.getTemplateDetails.useQuery(
      { templateName },
      { enabled: !!templateName }
    );

  // Mutations
  const sendWelcomeGreeting = trpc.whatsappTemplateTest.sendWelcomeGreeting.useMutation();
  const sendTemplate = trpc.whatsappTemplateTest.sendTemplate.useMutation();

  const handleSendWelcome = async () => {
    if (!phone || !fullName) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendWelcomeGreeting.mutateAsync({
        phone,
        fullName,
      });

      if (result.success) {
        toast.success("✅ تم إرسال رسالة الترحيب بنجاح!");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              تكامل WhatsApp Cloud API
            </h1>
          </div>
          <p className="text-gray-600">
            اختبر إرسال القوالب المعتمدة من Meta إلى أرقام WhatsApp
          </p>
        </div>

        {/* Status Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ جميع القوالب معتمدة من Meta وجاهزة للاستخدام
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="welcome">رسالة ترحيب مخصصة</TabsTrigger>
            <TabsTrigger value="templates">جميع القوالب</TabsTrigger>
          </TabsList>

          {/* Tab 1: Welcome Greeting */}
          <TabsContent value="welcome">
            <Card>
              <CardHeader>
                <CardTitle>إرسال رسالة ترحيب مخصصة</CardTitle>
                <CardDescription>
                  أرسل رسالة ترحيب بهوية المستشفى السعودي الألماني
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    معاينة الرسالة:
                  </p>
                  <div className="bg-white p-3 rounded border border-green-200 text-sm text-gray-700 leading-relaxed">
                    <p>مرحباً {fullName || "[الاسم]"},</p>
                    <p className="mt-2">
                      أهلاً وسهلاً عزيزي العميل. المستشفى السعودي الألماني معكم. 👋
                    </p>
                    <p className="mt-2">
                      تفضلوا بطرح استفساراتكم وسؤالكم. نحن هنا لخدمتكم.
                    </p>
                    <p className="mt-2">
                      🏥 خدماتنا:
                      <br />• مواعيد طبية
                      <br />• مخيمات صحية
                      <br />• عروض خاصة
                    </p>
                    <p className="mt-2">
                      شكراً لاختيارك المستشفى السعودي الألماني
                    </p>
                    <p className="mt-2">#المستشفى_السعودي_الألماني</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
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
                    disabled={isLoading || sendWelcomeGreeting.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading || sendWelcomeGreeting.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        إرسال رسالة الترحيب
                      </>
                    )}
                  </Button>
                </div>

                {/* Info */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>ملاحظة:</strong> تأكد من أن رقم الهاتف صحيح وأن الجهاز لديه
                    WhatsApp مثبت.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: All Templates */}
          <TabsContent value="templates">
            <div className="space-y-6">
              {/* Templates List */}
              <Card>
                <CardHeader>
                  <CardTitle>قائمة القوالب المعتمدة</CardTitle>
                  <CardDescription>
                    {templatesLoading
                      ? "جاري التحميل..."
                      : `${templates?.count || 0} قالب معتمد من Meta`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : templates?.templates && templates.templates.length > 0 ? (
                    <div className="space-y-2">
                      {templates.templates.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => setTemplateName(tmpl.metaName || "")}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{tmpl.name}</p>
                              <p className="text-sm text-gray-500">{tmpl.metaName}</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {tmpl.metaCategory}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">لا توجد قوالب معتمدة</p>
                  )}
                </CardContent>
              </Card>

              {/* Template Details */}
              {templateDetails?.template && (
                <Card>
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
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
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
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading || sendTemplate.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 ml-2" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
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
    </div>
  );
}
