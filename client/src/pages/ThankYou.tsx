import { CheckCircle2, Phone, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-primary/20">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-16 h-16 text-secondary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            شكراً لتسجيلك!
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            تم استلام طلبك بنجاح. سيتواصل معك فريقنا الطبي خلال 24 ساعة لتأكيد موعدك وتقديم المساعدة اللازمة.
          </p>

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Phone className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">للاستفسارات العاجلة</span>
            </div>
            <p className="text-3xl font-bold text-primary">8000018</p>
            <p className="text-sm text-muted-foreground mt-2">الرقم المجاني - متاح على مدار الساعة</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-border">
              <h3 className="font-bold text-lg mb-2">ما التالي؟</h3>
              <ul className="text-right space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>سيتم مراجعة طلبك من قبل فريقنا الطبي</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>سنتصل بك لتحديد موعد مناسب</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>سنرسل لك رسالة تأكيد عبر الواتساب</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/">
                <Home className="w-5 h-5 ml-2" />
                العودة للصفحة الرئيسية
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <img 
              src="/assets/new-logo.png" 
              alt="المستشفى السعودي الألماني" 
              className="h-16 mx-auto mb-3"
            />
            <p className="text-sm text-muted-foreground">
              المستشفى السعودي الألماني - صنعاء
              <br />
              نرعاكم كأهالينا
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
