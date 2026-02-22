import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Users, Calendar, TrendingUp, UserCheck, Phone, Mail } from "lucide-react";
import { useLocation } from "wouter";

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all data
  const { data: leads } = trpc.leads.unifiedList.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: offerLeads } = trpc.offerLeads.list.useQuery();
  const { data: campRegistrations } = trpc.campRegistrations.list.useQuery();

  // Search results
  const searchResults = {
    leads: leads?.filter(l => 
      searchQuery && (
        l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery) ||
        (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    ).slice(0, 3) || [],
    appointments: appointments?.filter(a => 
      searchQuery && (
        a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    ).slice(0, 3) || [],
    offerLeads: offerLeads?.filter(o => 
      searchQuery && (
        o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.phone.includes(searchQuery) ||
        (o.email && o.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    ).slice(0, 3) || [],
    campRegistrations: campRegistrations?.filter(c => 
      searchQuery && (
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      )
    ).slice(0, 3) || [],
  };

  const totalResults = 
    searchResults.leads.length + 
    searchResults.appointments.length + 
    searchResults.offerLeads.length + 
    searchResults.campRegistrations.length;

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    onClose?.();
  };

  const handleResultClick = (type: string) => {
    handleClose();
    // Navigate to bookings management with specific tab
    const tabMap: Record<string, string> = {
      leads: "leads",
      appointments: "appointments",
      offerLeads: "offerLeads",
      campRegistrations: "campRegistrations",
    };
    setLocation(`/bookings?tab=${tabMap[type]}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Search Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="gap-2 hidden md:flex"
      >
        <Search className="h-4 w-4" />
        <span>بحث...</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>

      {/* Mobile Search Icon */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="md:hidden h-9 w-9"
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[90vw] md:w-[500px] max-h-[80vh] overflow-y-auto bg-white dark:bg-card rounded-lg shadow-2xl border z-[100]">
          <div className="p-4 border-b sticky top-0 bg-white dark:bg-card">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="ابحث عن عميل، موعد، أو حجز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-4">
            {!searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">ابدأ الكتابة للبحث في جميع الحجوزات</p>
                <p className="text-xs mt-1">يمكنك البحث بالاسم، رقم الهاتف، أو البريد الإلكتروني</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد نتائج</p>
                <p className="text-xs mt-1">جرب البحث بكلمات مختلفة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Leads Results */}
                {searchResults.leads.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-sm">تسجيلات العملاء ({searchResults.leads.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.leads.map((lead: any) => (
                        <Card 
                          key={lead.id} 
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleResultClick('leads')}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{lead.fullName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground" dir="ltr">{lead.phone}</span>
                                </div>
                                {lead.email && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{lead.email}</span>
                                  </div>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {lead.registrationType === 'appointment' && 'موعد'}
                                {lead.registrationType === 'offer' && 'عرض'}
                                {lead.registrationType === 'camp' && 'مخيم'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointments Results */}
                {searchResults.appointments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-sm">مواعيد الأطباء ({searchResults.appointments.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.appointments.map((apt: any) => (
                        <Card 
                          key={apt.id} 
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleResultClick('appointments')}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{apt.fullName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground" dir="ltr">{apt.phone}</span>
                                </div>
                                {apt.doctorName && (
                                  <p className="text-xs text-muted-foreground mt-1">الطبيب: {apt.doctorName}</p>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={apt.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : ''}
                              >
                                {apt.status === 'pending' && 'قيد الانتظار'}
                                {apt.status === 'confirmed' && 'مؤكد'}
                                {apt.status === 'cancelled' && 'ملغي'}
                                {apt.status === 'completed' && 'مكتمل'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offer Leads Results */}
                {searchResults.offerLeads.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-sm">حجوزات العروض ({searchResults.offerLeads.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.offerLeads.map((offer: any) => (
                        <Card 
                          key={offer.id} 
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleResultClick('offerLeads')}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{offer.fullName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground" dir="ltr">{offer.phone}</span>
                                </div>
                                {offer.offerTitle && (
                                  <p className="text-xs text-muted-foreground mt-1">العرض: {offer.offerTitle}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Camp Registrations Results */}
                {searchResults.campRegistrations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-teal-500" />
                      <h3 className="font-semibold text-sm">تسجيلات المخيمات ({searchResults.campRegistrations.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {searchResults.campRegistrations.map((camp: any) => (
                        <Card 
                          key={camp.id} 
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleResultClick('campRegistrations')}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{camp.fullName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground" dir="ltr">{camp.phone}</span>
                                </div>
                                {camp.campName && (
                                  <p className="text-xs text-muted-foreground mt-1">المخيم: {camp.campName}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
