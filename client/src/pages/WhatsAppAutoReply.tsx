/**
 * WhatsApp Auto Reply Page
 * صفحة قواعد الرد التلقائي
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppAutoReply() {
  const [autoReplyTrigger, setAutoReplyTrigger] = useState("");
  const [autoReplyResponse, setAutoReplyResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const autoReplyRulesQuery = trpc.whatsapp.getAutoReplyRules.useQuery();

  // Mutations
  const addAutoReplyMutation = trpc.whatsapp.addAutoReplyRule.useMutation();
  const deleteAutoReplyMutation = trpc.whatsapp.deleteAutoReplyRule.useMutation();

  const handleAddAutoReply = async () => {
    if (!autoReplyTrigger || !autoReplyResponse) {
      toast.error("يرجى إدخال المحفز والرد");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addAutoReplyMutation.mutateAsync({
        name: autoReplyTrigger,
        triggerType: "keyword" as const,
        triggerValue: autoReplyTrigger,
        replyMessage: autoReplyResponse,
      });

      if (result.success) {
        toast.success("تم إضافة قاعدة الرد التلقائي");
        setAutoReplyTrigger("");
        setAutoReplyResponse("");
        autoReplyRulesQuery.refetch();
      } else {
        toast.error(result.error || "فشل إضافة القاعدة");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة القاعدة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAutoReply = async (ruleId: number) => {
    try {
      const result = await deleteAutoReplyMutation.mutateAsync({ ruleId });
      if (result.success) {
        toast.success("تم حذف القاعدة");
        autoReplyRulesQuery.refetch();
      }
    } catch (error) {
      toast.error("فشل حذف القاعدة");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">قواعد الرد التلقائي</h1>
        <p className="text-muted-foreground">إضافة قواعد للرد التلقائي على الرسائل الواردة</p>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">قواعد الرد التلقائي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{autoReplyRulesQuery.data?.rules?.length || 0}</div>
          <p className="text-xs text-muted-foreground">قاعدة نشطة</p>
        </CardContent>
      </Card>

      {/* Add Rule Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إضافة قاعدة جديدة
          </CardTitle>
          <CardDescription>إضافة قاعدة للرد التلقائي على الرسائل الواردة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">المحفز (الكلمة المفتاحية)</label>
              <Input
                placeholder="مثال: مرحبا"
                value={autoReplyTrigger}
                onChange={(e) => setAutoReplyTrigger(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">الرد</label>
              <Input
                placeholder="مثال: أهلا وسهلا"
                value={autoReplyResponse}
                onChange={(e) => setAutoReplyResponse(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={handleAddAutoReply} disabled={isLoading} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة قاعدة"}
          </Button>
        </CardContent>
      </Card>

      {/* Rules List */}
      {autoReplyRulesQuery.data?.rules && autoReplyRulesQuery.data.rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>القواعد النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {autoReplyRulesQuery.data.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{rule.triggerValue || rule.triggerType}</p>
                    <p className="text-xs text-muted-foreground">{rule.replyMessage}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAutoReply(rule.id)}
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
