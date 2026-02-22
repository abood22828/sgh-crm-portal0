import { CheckCircle2, Phone, Home, Calendar, User, Mail, Stethoscope, Gift, Tent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function ThankYou() {
  const [location] = useLocation();
  const [bookingInfo, setBookingInfo] = useState<any>(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const name = params.get('name');
    const phone = params.get('phone');
    const email = params.get('email');
    const doctor = params.get('doctor');
    const offer = params.get('offer');
    const camp = params.get('camp');
    const date = params.get('date');
    const time = params.get('time');

    if (type && name) {
      setBookingInfo({
        type,
        name,
        phone,
        email,
        doctor,
        offer,
        camp,
        date,
        time,
      });
    }
  }, [location]);

  const getTypeInfo = () => {
    if (!bookingInfo) return { title: "شكراً لتسجيلك!", icon: CheckCircle2, color: "text-secondary" };
    
    switch (bookingInfo.type) {
      case 'appointment':
        return { title: "تم حجز موعدك بنجاح!", icon: Stethoscope, color: "text-blue-600" };
      case 'offer':
        return { title: "تم تسجيل طلب العرض بنجاح!", icon: Gift, color: "text-purple-600" };
      case 'camp':
        return { title: "تم التسجيل في المخيم بنجاح!", icon: Tent, color: "text-green-600" };
      default:
        return { title: "شكراً لتسجيلك!", icon: CheckCircle2, color: "text-secondary" };
    }
  };

  const typeInfo = getTypeInfo();
  const IconComponent = typeInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <Card className="max-w-2xl w-full shadow-2xl border-2 border-primary/20">
        <CardContent className="pt-6 sm:pt-8 md:pt-12 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 text-center">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6`}>
            <IconComponent className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 ${typeInfo.color}`} />
          </div>

          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3 md:mb-4">
            {typeInfo.title}
          </h1>

          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-lg mx-auto">
            تم استلام طلبك بنجاح. سيتواصل معك فريقنا الطبي خلال 24 ساعة لتأكيد موعدك وتقديم المساعدة اللازمة.
          </p>

          {/* Booking Details */}
          {bookingInfo && (
            <div className="bg-white dark:bg-card rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-border">
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 md:mb-4 text-right">تفاصيل الحجز</h3>
              <div className="space-y-2 sm:space-y-3 text-right">
                <div className="flex items-center gap-2 sm:gap-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">الاسم:</span>
                  <span className="font-medium">{bookingInfo.name}</span>
                </div>
                {bookingInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">الهاتف:</span>
                    <span className="font-medium" dir="ltr">{bookingInfo.phone}</span>
                  </div>
                )}
                {bookingInfo.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">البريد:</span>
                    <span className="font-medium" dir="ltr">{bookingInfo.email}</span>
                  </div>
                )}
                {bookingInfo.doctor && (
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">الطبيب:</span>
                    <span className="font-medium">{bookingInfo.doctor}</span>
                  </div>
                )}
                {bookingInfo.offer && (
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">العرض:</span>
                    <span className="font-medium">{bookingInfo.offer}</span>
                  </div>
                )}
                {bookingInfo.camp && (
                  <div className="flex items-center gap-3">
                    <Tent className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">المخيم:</span>
                    <span className="font-medium">{bookingInfo.camp}</span>
                  </div>
                )}
                {(bookingInfo.date || bookingInfo.time) && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">الموعد المفضل:</span>
                    <span className="font-medium">
                      {bookingInfo.date && new Date(bookingInfo.date).toLocaleDateString('ar-YE')}
                      {bookingInfo.date && bookingInfo.time && ' - '}
                      {bookingInfo.time}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground">للاستفسارات العاجلة</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">8000018</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1 sm:mt-2">الرقم المجاني - متاح على مدار الساعة</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white dark:bg-card rounded-lg p-3 sm:p-4 border border-border">
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2">ما التالي؟</h3>
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

          <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button asChild variant="default" size="default" className="sm:text-base">
              <Link href="/">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                العودة للصفحة الرئيسية
              </Link>
            </Button>
          </div>

          <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-border">
            <img 
              src="/assets/new-logo.png" 
              alt="المستشفى السعودي الألماني" 
              className="h-10 sm:h-12 md:h-16 mx-auto mb-2 sm:mb-3"
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
