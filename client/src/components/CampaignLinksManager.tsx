import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Tag,
  Tent,
  Stethoscope,
  Search,
  Link2,
  Unlink,
  Save,
  CheckCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CampaignLinksManagerProps {
  campaignId: number;
  campaignName: string;
  /** وضع العرض فقط (في حوار التفاصيل) */
  readOnly?: boolean;
  /** وضع مضمن (بدون بطاقة خارجية) */
  inline?: boolean;
}

/**
 * CampaignLinksManager - مكون لإدارة ربط العروض والمخيمات والأطباء بحملة
 * يمكن استخدامه في:
 * - حوار تعديل الحملة (وضع التعديل)
 * - حوار عرض تفاصيل الحملة (وضع القراءة فقط)
 */
export default function CampaignLinksManager({
  campaignId,
  campaignName,
  readOnly = false,
  inline = false,
}: CampaignLinksManagerProps) {
  const [activeDialog, setActiveDialog] = useState<"offers" | "camps" | "doctors" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch current links
  const { data: links, isLoading: loadingLinks, refetch: refetchLinks } = trpc.campaigns.getLinks.useQuery(
    { campaignId },
    { enabled: !!campaignId }
  );

  // Fetch all available items
  const { data: allOffers } = trpc.offers.getAll.useQuery(undefined, { enabled: activeDialog === "offers" });
  const { data: allCamps } = trpc.camps.getAll.useQuery(undefined, { enabled: activeDialog === "camps" });
  const { data: allDoctors } = trpc.doctors.list.useQuery(undefined, { enabled: activeDialog === "doctors" });

  // Selection state
  const [selectedOfferIds, setSelectedOfferIds] = useState<number[]>([]);
  const [selectedCampIds, setSelectedCampIds] = useState<number[]>([]);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([]);

  // Initialize selections when dialog opens
  useEffect(() => {
    if (activeDialog === "offers" && links?.linkedOffers) {
      setSelectedOfferIds(links.linkedOffers.map((o: any) => o.offerId));
    } else if (activeDialog === "camps" && links?.linkedCamps) {
      setSelectedCampIds(links.linkedCamps.map((c: any) => c.campId));
    } else if (activeDialog === "doctors" && links?.linkedDoctors) {
      setSelectedDoctorIds(links.linkedDoctors.map((d: any) => d.doctorId));
    }
    setSearchQuery("");
  }, [activeDialog, links]);

  // Mutations
  const linkOffersMutation = trpc.campaigns.linkOffers.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث العروض المرتبطة بنجاح");
      refetchLinks();
      setActiveDialog(null);
    },
    onError: (error) => toast.error(`فشل تحديث العروض: ${error.message}`),
  });

  const linkCampsMutation = trpc.campaigns.linkCamps.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المخيمات المرتبطة بنجاح");
      refetchLinks();
      setActiveDialog(null);
    },
    onError: (error) => toast.error(`فشل تحديث المخيمات: ${error.message}`),
  });

  const linkDoctorsMutation = trpc.campaigns.linkDoctors.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الأطباء المرتبطين بنجاح");
      refetchLinks();
      setActiveDialog(null);
    },
    onError: (error) => toast.error(`فشل تحديث الأطباء: ${error.message}`),
  });

  const handleSaveOffers = () => {
    linkOffersMutation.mutate({ campaignId, offerIds: selectedOfferIds });
  };

  const handleSaveCamps = () => {
    linkCampsMutation.mutate({ campaignId, campIds: selectedCampIds });
  };

  const handleSaveDoctors = () => {
    linkDoctorsMutation.mutate({ campaignId, doctorIds: selectedDoctorIds });
  };

  const toggleOffer = (id: number) => {
    setSelectedOfferIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCamp = (id: number) => {
    setSelectedCampIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleDoctor = (id: number) => {
    setSelectedDoctorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loadingLinks) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const linkedOffers = links?.linkedOffers || [];
  const linkedCamps = links?.linkedCamps || [];
  const linkedDoctors = links?.linkedDoctors || [];

  const content = (
    <div className="space-y-4">
      {/* العروض المرتبطة */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-4 w-4 text-orange-600" />
            العروض المرتبطة
            <Badge variant="secondary" className="text-xs">{linkedOffers.length}</Badge>
          </Label>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setActiveDialog("offers")}>
              <Link2 className="h-3.5 w-3.5 ml-1.5" />
              إدارة
            </Button>
          )}
        </div>
        {linkedOffers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {linkedOffers.map((offer: any) => (
              <Badge
                key={offer.offerId}
                variant="outline"
                className="bg-orange-50 text-orange-800 border-orange-200 py-1 px-2.5"
              >
                <Tag className="h-3 w-3 ml-1" />
                {offer.offerTitle}
                {!offer.offerIsActive && (
                  <span className="text-[10px] text-red-500 mr-1">(غير نشط)</span>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">لا توجد عروض مرتبطة</p>
        )}
      </div>

      {/* المخيمات المرتبطة */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Tent className="h-4 w-4 text-green-600" />
            المخيمات المرتبطة
            <Badge variant="secondary" className="text-xs">{linkedCamps.length}</Badge>
          </Label>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setActiveDialog("camps")}>
              <Link2 className="h-3.5 w-3.5 ml-1.5" />
              إدارة
            </Button>
          )}
        </div>
        {linkedCamps.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {linkedCamps.map((camp: any) => (
              <Badge
                key={camp.campId}
                variant="outline"
                className="bg-green-50 text-green-800 border-green-200 py-1 px-2.5"
              >
                <Tent className="h-3 w-3 ml-1" />
                {camp.campName}
                {!camp.campIsActive && (
                  <span className="text-[10px] text-red-500 mr-1">(غير نشط)</span>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">لا توجد مخيمات مرتبطة</p>
        )}
      </div>

      {/* الأطباء المرتبطون */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            الأطباء المرتبطون
            <Badge variant="secondary" className="text-xs">{linkedDoctors.length}</Badge>
          </Label>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setActiveDialog("doctors")}>
              <Link2 className="h-3.5 w-3.5 ml-1.5" />
              إدارة
            </Button>
          )}
        </div>
        {linkedDoctors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {linkedDoctors.map((doctor: any) => (
              <Badge
                key={doctor.doctorId}
                variant="outline"
                className="bg-blue-50 text-blue-800 border-blue-200 py-1 px-2.5"
              >
                <Stethoscope className="h-3 w-3 ml-1" />
                {doctor.doctorName}
                <span className="text-[10px] text-muted-foreground mr-1">({doctor.doctorSpecialty})</span>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">لا يوجد أطباء مرتبطون</p>
        )}
      </div>

      {/* === Selection Dialogs === */}

      {/* Offers Selection Dialog */}
      <Dialog open={activeDialog === "offers"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-600" />
              ربط العروض بالحملة
            </DialogTitle>
            <DialogDescription>
              اختر العروض التي تريد ربطها بحملة "{campaignName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في العروض..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-3">
              {allOffers && allOffers.length > 0 ? (
                <div className="space-y-2">
                  {allOffers
                    .filter((o: any) =>
                      !searchQuery || o.title?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((offer: any) => (
                      <div
                        key={offer.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          selectedOfferIds.includes(offer.id)
                            ? "bg-orange-50 border border-orange-200"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                        onClick={() => toggleOffer(offer.id)}
                      >
                        <Checkbox
                          checked={selectedOfferIds.includes(offer.id)}
                          onCheckedChange={() => toggleOffer(offer.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{offer.title}</p>
                          {!offer.isActive && (
                            <span className="text-xs text-red-500">غير نشط</span>
                          )}
                        </div>
                        {selectedOfferIds.includes(offer.id) && (
                          <CheckCircle className="h-4 w-4 text-orange-600 shrink-0" />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد عروض</p>
              )}
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              تم اختيار {selectedOfferIds.length} عرض
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إلغاء</Button>
            <Button onClick={handleSaveOffers} disabled={linkOffersMutation.isPending}>
              {linkOffersMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camps Selection Dialog */}
      <Dialog open={activeDialog === "camps"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tent className="h-5 w-5 text-green-600" />
              ربط المخيمات بالحملة
            </DialogTitle>
            <DialogDescription>
              اختر المخيمات التي تريد ربطها بحملة "{campaignName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في المخيمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-3">
              {allCamps && allCamps.length > 0 ? (
                <div className="space-y-2">
                  {allCamps
                    .filter((c: any) =>
                      !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((camp: any) => (
                      <div
                        key={camp.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          selectedCampIds.includes(camp.id)
                            ? "bg-green-50 border border-green-200"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                        onClick={() => toggleCamp(camp.id)}
                      >
                        <Checkbox
                          checked={selectedCampIds.includes(camp.id)}
                          onCheckedChange={() => toggleCamp(camp.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{camp.name}</p>
                          {!camp.isActive && (
                            <span className="text-xs text-red-500">غير نشط</span>
                          )}
                        </div>
                        {selectedCampIds.includes(camp.id) && (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد مخيمات</p>
              )}
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              تم اختيار {selectedCampIds.length} مخيم
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إلغاء</Button>
            <Button onClick={handleSaveCamps} disabled={linkCampsMutation.isPending}>
              {linkCampsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctors Selection Dialog */}
      <Dialog open={activeDialog === "doctors"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              ربط الأطباء بالحملة
            </DialogTitle>
            <DialogDescription>
              اختر الأطباء الذين تريد ربطهم بحملة "{campaignName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الأطباء..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <ScrollArea className="h-[300px] rounded-md border p-3">
              {allDoctors && allDoctors.length > 0 ? (
                <div className="space-y-2">
                  {allDoctors
                    .filter((d: any) =>
                      !searchQuery ||
                      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      d.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((doctor: any) => (
                      <div
                        key={doctor.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          selectedDoctorIds.includes(doctor.id)
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                        onClick={() => toggleDoctor(doctor.id)}
                      >
                        <Checkbox
                          checked={selectedDoctorIds.includes(doctor.id)}
                          onCheckedChange={() => toggleDoctor(doctor.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doctor.name}</p>
                          <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                        </div>
                        {selectedDoctorIds.includes(doctor.id) && (
                          <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا يوجد أطباء</p>
              )}
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              تم اختيار {selectedDoctorIds.length} طبيب
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>إلغاء</Button>
            <Button onClick={handleSaveDoctors} disabled={linkDoctorsMutation.isPending}>
              {linkDoctorsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          التسجيلات المرتبطة
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
