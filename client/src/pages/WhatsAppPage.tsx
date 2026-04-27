import { memo, useCallback, useState, useMemo } from "react";
import { processPhoneInput } from "@/hooks/usePhoneFormat";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle, Send, Search, Plus, FileText, User, Phone,
  Smartphone, Wifi, WifiOff, Loader2 as LoaderIcon, ArrowRight,
  ChevronLeft, AlertCircle, Archive, Filter, BarChart2,
  Clock, CheckCheck, MessageSquare, MoreVertical, Star,
  RefreshCw, TrendingUp, Users, X, Bookmark, CheckSquare, LayoutGrid,
} from "lucide-react";
import ChatWindow from "@/components/ChatWindow";
import ConversationInfo from "@/components/ConversationInfo";
import useSSE from "@/hooks/useSSE";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: number;
  customerName?: string | null;
  phoneNumber: string;
  lastMessage?: string | null;
  lastMessageAt?: string | Date | null;
  unreadCount: number;
  isImportant?: number;
  isArchived?: number;
  assignedToUserId?: number | null;
  notes?: string | null;
}

interface User {
  id: number;
  name: string;
  username: string;
}

interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
  variables?: string | null;
  isActive: number;
  metaName?: string | null;
  languageCode?: string | null;
}

type FilterType = "all" | "unread" | "important" | "archived" | "unnamed" | "unreplied";

// Helper function to get time elapsed color
function getTimeElapsedColor(lastMessageAt: string | Date | null): string {
  if (!lastMessageAt) return "text-gray-500";
  const hours = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return "text-green-600";
  if (hours < 24) return "text-blue-600";
  if (hours < 168) return "text-orange-600"; // 7 days
  return "text-red-600";
}

// Helper function to get time elapsed text
function getTimeElapsedText(lastMessageAt: string | Date | null): string {
  if (!lastMessageAt) return "";
  const hours = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return "أقل من ساعة";
  if (hours < 24) return `${Math.floor(hours)} ساعة`;
  if (hours < 168) return `${Math.floor(hours / 24)} يوم`;
  return `${Math.floor(hours / 168)} أسبوع`;
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ conversations }: { conversations: Conversation[] | undefined }) {
  const total = conversations?.length || 0;
  const unread = conversations?.filter(c => c.unreadCount > 0).length || 0;
  const important = conversations?.filter(c => c.isImportant === 1).length || 0;
  const archived = conversations?.filter(c => c.isArchived === 1).length || 0;
  
  // Active: conversations with activity in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const active = conversations?.filter(c => 
    !c.isArchived && 
    c.lastMessageAt && 
    new Date(c.lastMessageAt) >= sevenDaysAgo
  ).length || 0;

  return (
    <div className="grid grid-cols-5 gap-2 mb-3">
      {[
        { label: "الكل", value: total, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "نشطة", value: active, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
        { label: "غير مقروءة", value: unread, icon: MessageCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
        { label: "مهمة", value: important, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
        { label: "مؤرشفة", value: archived, icon: Archive, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-900/20" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-lg p-2 text-center`}>
          <Icon className={`h-3.5 w-3.5 ${color} mx-auto mb-0.5`} />
          <p className={`text-base font-bold ${color}`}>{value}</p>
          <p className="text-[9px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── ConversationsList ────────────────────────────────────────────────────────
interface ConversationsListProps {
  filteredConversations: Conversation[] | undefined;
  conversationsLoading: boolean;
  selectedConversation: number | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSelectConversation: (id: number) => void;
  isNewMessageOpen: boolean;
  onNewMessageOpenChange: (v: boolean) => void;
  newMessagePhone: string;
  onNewMessagePhoneChange: (v: string) => void;
  newMessageText: string;
  onNewMessageTextChange: (v: string) => void;
  newMessageTemplateId: number | null;
  onNewMessageTemplateIdChange: (v: number | null) => void;
  templates: Template[] | undefined;
  onSendNewMessage: () => void;
  isSendingNewMessage: boolean;
  connectionStatus: { isReady?: boolean; isConnecting?: boolean } | undefined;
  statusLoading: boolean;
  allConversations: Conversation[] | undefined;
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  onArchiveConversation: (id: number) => void;
  onToggleImportant: (id: number) => void;
  onAssignConversation: (id: number, userId: number) => void;
  activeUsers: User[] | undefined;
  onSaveSearchClick?: () => void;
  isSelectionMode: boolean;
  selectedConversations: Set<number>;
  onToggleSelection: (id: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkArchive: () => void;
  onBulkMarkImportant: () => void;
  onToggleSelectionMode: () => void;
  isSplitView: boolean;
  secondConversationId: number | null;
  onSelectSecondConversation: (id: number) => void;
}

const ConversationsList = memo(function ConversationsList({
  filteredConversations,
  conversationsLoading,
  selectedConversation,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  isNewMessageOpen,
  onNewMessageOpenChange,
  newMessagePhone,
  onNewMessagePhoneChange,
  newMessageText,
  onNewMessageTextChange,
  newMessageTemplateId,
  onNewMessageTemplateIdChange,
  templates,
  onSendNewMessage,
  isSendingNewMessage,
  connectionStatus,
  statusLoading,
  allConversations,
  activeFilter,
  onFilterChange,
  onArchiveConversation,
  onToggleImportant,
  onAssignConversation,
  activeUsers,
  onSaveSearchClick,
  isSelectionMode,
  selectedConversations,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onBulkArchive,
  onBulkMarkImportant,
  onToggleSelectionMode,
  isSplitView,
  secondConversationId,
  onSelectSecondConversation,
}: ConversationsListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b dark:border-gray-800 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <h2 className="text-sm sm:text-base font-bold text-white">المحادثات</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 gap-1 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={onToggleSelectionMode}
            >
              <CheckSquare className="h-3 w-3" />
              <span className="hidden sm:inline">{isSelectionMode ? "إلغاء" : "تحديد"}</span>
            </Button>
            {statusLoading ? (
              <Badge className="gap-1 text-[10px] h-5 bg-white/20 text-white border-0">
                <LoaderIcon className="h-2.5 w-2.5 animate-spin" />
              </Badge>
            ) : connectionStatus?.isReady ? (
              <Badge className="bg-white/20 text-white border-0 gap-1 text-[10px] h-5">
                <Wifi className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">متصل</span>
              </Badge>
            ) : (
              <Badge className="bg-red-500/80 text-white border-0 gap-1 text-[10px] h-5">
                <WifiOff className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">غير متصل</span>
              </Badge>
            )}
            <Dialog open={isNewMessageOpen} onOpenChange={onNewMessageOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="h-7 px-2 gap-1 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0">
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">جديد</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إرسال رسالة جديدة</DialogTitle>
                  <DialogDescription>أرسل رسالة مباشرة لرقم هاتف</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>رقم الهاتف</Label>
                    <Input
                      placeholder="7XXXXXXXX"
                      value={newMessagePhone}
                      onChange={(e) => onNewMessagePhoneChange(processPhoneInput(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      قالب الرسالة
                      <span className="text-[10px] text-muted-foreground font-normal">(مطلوب للمحادثات الجديدة)</span>
                    </Label>
                    <Select
                      value={newMessageTemplateId ? String(newMessageTemplateId) : "none"}
                      onValueChange={(v) => onNewMessageTemplateIdChange(v === "none" ? null : Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالباً أو اكتب رسالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون قالب (للمحادثات النشطة فقط)</SelectItem>
                        {templates?.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newMessageTemplateId && (
                      <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>سيتم إرسال القالب المحدد — تأكد من أن القالب معتمد من Meta</span>
                      </div>
                    )}
                  </div>
                  {!newMessageTemplateId && (
                    <div className="space-y-1.5">
                      <Label>الرسالة</Label>
                      <Textarea
                        placeholder="اكتب رسالتك هنا..."
                        value={newMessageText}
                        onChange={(e) => onNewMessageTextChange(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={onSendNewMessage}
                    disabled={isSendingNewMessage || !newMessagePhone.trim() || (!newMessageTemplateId && !newMessageText.trim())}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSendingNewMessage ? (
                      <LoaderIcon className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Send className="h-4 w-4 ml-2" />
                    )}
                    إرسال
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
          <Input
            placeholder="بحث بالاسم أو الرقم..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-8 h-8 text-xs bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {searchQuery && onSaveSearchClick && (
            <button
              onClick={onSaveSearchClick}
              className="absolute left-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              title="حفظ البحث"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-2 pt-2 pb-1 border-b dark:border-gray-800">
        <Tabs value={activeFilter} onValueChange={(v) => onFilterChange(v as FilterType)}>
          <TabsList className="h-7 w-full grid grid-cols-6 bg-muted/50">
            <TabsTrigger value="all" className="text-[10px] h-6 px-1">الكل</TabsTrigger>
            <TabsTrigger value="unread" className="text-[10px] h-6 px-1">
              غير مقروءة
              {(allConversations?.filter(c => c.unreadCount > 0).length || 0) > 0 && (
                <Badge variant="destructive" className="mr-1 h-3.5 px-1 text-[8px] rounded-full">
                  {allConversations?.filter(c => c.unreadCount > 0).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="important" className="text-[10px] h-6 px-1">مهمة</TabsTrigger>
            <TabsTrigger value="archived" className="text-[10px] h-6 px-1">مؤرشفة</TabsTrigger>
            <TabsTrigger value="unnamed" className="text-[10px] h-6 px-1">بدون اسم</TabsTrigger>
            <TabsTrigger value="unreplied" className="text-[10px] h-6 px-1">لم يُرد</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="px-2 pt-2">
        <StatsBar conversations={allConversations} />
      </div>

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && selectedConversations.size > 0 && (
        <div className="px-2 pt-2 pb-1 flex gap-2 items-center bg-white/10">
          <span className="text-xs text-white font-medium">
            تم تحديد {selectedConversations.size}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={onSelectAll}
          >
            تحديد الكل
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={onClearSelection}
          >
            إلغاء التحديد
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[10px] bg-amber-500/80 hover:bg-amber-500 text-white border-0"
            onClick={onBulkMarkImportant}
          >
            <Star className="h-3 w-3 ml-1" />
            مهمة
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[10px] bg-gray-500/80 hover:bg-gray-500 text-white border-0"
            onClick={onBulkArchive}
          >
            <Archive className="h-3 w-3 ml-1" />
            أرشفة
          </Button>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches && savedSearches.length > 0 && (
        <div className="px-2 pt-1 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-white/80 hover:text-white hover:bg-white/10 w-full justify-start gap-2">
                <Bookmark className="h-3 w-3" />
                البحثات المحفوظة
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {savedSearches.map((search: any) => (
                <DropdownMenuItem
                  key={search.id}
                  onClick={() => handleApplySavedSearch(search)}
                  className="flex flex-col items-start gap-1 py-2"
                >
                  <span className="font-medium text-xs">{search.name}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{search.query}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-2 text-green-500" />
              <p className="text-sm">جاري تحميل المحادثات...</p>
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            <div className="divide-y dark:divide-gray-800">
              {filteredConversations.map((conv, index) => (
                <div
                  key={conv.id}
                  style={{ opacity: 0, animation: `row-enter 0.35s ease-out ${Math.min(index * 60, 600)}ms forwards` }}
                  className={`group relative p-3 sm:p-4 cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 active:bg-green-100 ${
                    selectedConversation === conv.id ? "bg-green-100 dark:bg-green-900/30 border-r-4 border-green-600" : ""
                  } ${conv.isArchived ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {isSelectionMode && (
                      <div
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelection(conv.id);
                        }}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedConversations.has(conv.id)
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}>
                          {selectedConversations.has(conv.id) && (
                            <CheckSquare className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                    <div className={`relative p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                      conv.isImportant ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-green-500 to-emerald-600"
                    }`} onClick={() => {
                      if (isSplitView) {
                        if (selectedConversation === conv.id) {
                          onSelectConversation(conv.id);
                        } else if (secondConversationId === conv.id) {
                          onSelectSecondConversation(conv.id);
                        } else if (!secondConversationId) {
                          onSelectSecondConversation(conv.id);
                        } else {
                          onSelectConversation(conv.id);
                        }
                      } else {
                        onSelectConversation(conv.id);
                      }
                    }}>
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      {conv.isImportant === 1 && (
                        <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                          {conv.customerName || "عميل جديد"}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full px-1.5 text-[10px] h-5">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span dir="ltr" className="truncate">{conv.phoneNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[140px]">
                          {conv.lastMessage || "لا توجد رسائل"}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${getTimeElapsedColor(conv.lastMessageAt)}`} />
                          <p className={`text-[9px] flex-shrink-0 ${getTimeElapsedColor(conv.lastMessageAt)}`}>
                            {getTimeElapsedText(conv.lastMessageAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground lg:hidden flex-shrink-0" />
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onToggleImportant(conv.id)}>
                          <Star className="h-3.5 w-3.5 ml-2" />
                          {conv.isImportant ? "إلغاء المهمة" : "تعيين كمهمة"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onArchiveConversation(conv.id)}>
                          <Archive className="h-3.5 w-3.5 ml-2" />
                          {conv.isArchived ? "إلغاء الأرشفة" : "أرشفة"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <User className="h-3.5 w-3.5 ml-2" />
                              تعيين لمستخدم
                              <ChevronLeft className="h-3 w-3 ml-auto" />
                            </DropdownMenuItem>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {activeUsers?.map((user) => (
                              <DropdownMenuItem 
                                key={user.id} 
                                onClick={() => onAssignConversation(conv.id, user.id)}
                              >
                                <User className="h-3.5 w-3.5 ml-2" />
                                {user.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Assigned User Badge */}
                  {conv.assignedToUserId && (
                    <div className="absolute right-2 bottom-2">
                      <Badge variant="outline" className="text-[8px] h-4 px-1 bg-blue-50 border-blue-200">
                        <User className="h-2 w-2 ml-0.5" />
                        معين
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">
                {searchQuery ? `لا نتائج لـ "${searchQuery}"` : "لا توجد محادثات"}
              </p>
              {searchQuery && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => onSearchChange("")}>
                  مسح البحث
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

// ─── ChatAreaHeader ───────────────────────────────────────────────────────────
interface ChatAreaHeaderProps {
  selectedConv: Conversation | undefined;
  onBackToList: () => void;
  onToggleImportant: (id: number) => void;
}

const ChatAreaHeader = memo(function ChatAreaHeader({ selectedConv, onBackToList, onToggleImportant }: ChatAreaHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4 flex-shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onBackToList}
          className="lg:hidden p-1.5 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="bg-white/20 p-1.5 sm:p-2 rounded-full flex-shrink-0">
          <User className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-lg font-bold truncate">
            {selectedConv?.customerName || "عميل جديد"}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm" dir="ltr">
            {selectedConv?.phoneNumber}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {selectedConv && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 hover:bg-white/20 ${selectedConv.isImportant ? "text-yellow-300" : "text-white/70"}`}
              onClick={() => selectedConv && onToggleImportant(selectedConv.id)}
            >
              <Star className={`h-4 w-4 ${selectedConv.isImportant ? "fill-yellow-300" : ""}`} />
            </Button>
          )}
          <Link href="/dashboard/whatsapp/templates">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-white hover:bg-white/20 gap-1 text-[10px]">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">القوالب</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
});

// ─── EmptyChatPlaceholder ─────────────────────────────────────────────────────
const EmptyChatPlaceholder = memo(function EmptyChatPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30">
      <div className="text-center text-muted-foreground p-8">
        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <MessageCircle className="h-12 w-12 text-green-500" />
        </div>
        <p className="text-lg font-medium mb-1">إدارة محادثات واتساب</p>
        <p className="text-sm">اختر محادثة من القائمة لبدء المراسلة</p>
        <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCheck className="h-3.5 w-3.5 text-green-500" />
            <span>قوالب معتمدة</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span>إحصائيات فورية</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span>رد سريع</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  return (
    <DashboardLayout pageTitle="واتساب" pageDescription="إدارة رسائل واتساب">
      <WhatsAppContent />
    </DashboardLayout>
  );
}

function WhatsAppContent() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [messageTypeFilter, setMessageTypeFilter] = useState<"all" | "text" | "image" | "template">("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [newMessagePhone, setNewMessagePhone] = useState("");
  const [newMessageText, setNewMessageText] = useState("");
  const [newMessageTemplateId, setNewMessageTemplateId] = useState<number | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [secondConversationId, setSecondConversationId] = useState<number | null>(null);

  // Queries
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } =
    trpc.whatsapp.conversations.list.useQuery();
  const { data: templates } = trpc.whatsapp.templates.list.useQuery();
  const { data: connectionStatus, isLoading: statusLoading } =
    trpc.whatsapp.connection.status.useQuery(undefined, {
    refetchInterval: 60_000, // كل دقيقة بدلاً من 5 ثوانٍ لتجنب Rate Limiting من Meta
    refetchOnWindowFocus: false,
  });
  const { data: activeUsers } = trpc.users.getActiveUsers.useQuery();
  const { data: savedSearches } = trpc.whatsapp.savedSearches.list.useQuery();

  // Mutations
  const markConversationAsReadMutation = trpc.whatsapp.conversations.markAsRead.useMutation();

  const updateConversationMutation = trpc.whatsapp.conversations.update.useMutation({
    onSuccess: () => refetchConversations(),
    onError: () => toast.error("فشل تحديث المحادثة"),
  });

  const assignConversationMutation = trpc.whatsapp.conversations.assignToUser.useMutation({
    onSuccess: () => {
      toast.success("تم تعيين المحادثة");
      refetchConversations();
    },
    onError: () => toast.error("فشل تعيين المحادثة"),
  });

  const bulkArchiveMutation = trpc.whatsapp.conversations.bulkArchive.useMutation({
    onSuccess: () => {
      refetchConversations();
    },
    onError: () => toast.error("فشل أرشفة المحادثات"),
  });

  const bulkMarkImportantMutation = trpc.whatsapp.conversations.bulkMarkImportant.useMutation({
    onSuccess: () => {
      refetchConversations();
    },
    onError: () => toast.error("فشل تعيين المحادثات كمهمة"),
  });

  const saveSearchMutation = trpc.whatsapp.savedSearches.create.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ البحث");
      setSaveSearchOpen(false);
      setSearchName("");
    },
    onError: () => toast.error("فشل حفظ البحث"),
  });

  const sendNewMessageMutation = trpc.whatsapp.messages.send.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      setNewMessagePhone(""); setNewMessageText(""); setNewMessageTemplateId(null);
      setIsNewMessageOpen(false);
      refetchConversations();
    },
    onError: (error) => toast.error(`فشل إرسال الرسالة: ${error.message}`),
  });

  const sendTemplateMutation = trpc.whatsapp.sendTemplate.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال القالب بنجاح");
      setNewMessagePhone(""); setNewMessageText(""); setNewMessageTemplateId(null);
      setIsNewMessageOpen(false);
      refetchConversations();
    },
    onError: (error: any) => toast.error(`فشل إرسال القالب: ${error?.message || 'خطأ غير معروف'}`),
  });

  // Callbacks
  const handleSelectConversation = useCallback((id: number) => {
    setSelectedConversation(id);
    setMobileShowChat(true);
    markConversationAsReadMutation.mutate({ id });
  }, [markConversationAsReadMutation]);

  const handleBackToList = useCallback(() => setMobileShowChat(false), []);
  const handleSearchChange = useCallback((v: string) => setSearchQuery(v), []);
  const handleNewMessagePhoneChange = useCallback((v: string) => setNewMessagePhone(v), []);
  const handleNewMessageTextChange = useCallback((v: string) => setNewMessageText(v), []);
  const handleNewMessageTemplateIdChange = useCallback((v: number | null) => setNewMessageTemplateId(v), []);
  const handleNewMessageOpenChange = useCallback((v: boolean) => setIsNewMessageOpen(v), []);

  const handleArchiveConversation = useCallback((id: number) => {
    const conv = conversations?.find(c => c.id === id);
    updateConversationMutation.mutate({ id, archived: !conv?.isArchived });
    toast.success(conv?.isArchived ? "تم إلغاء الأرشفة" : "تم أرشفة المحادثة");
  }, [conversations, updateConversationMutation]);

  const handleToggleImportant = useCallback((id: number) => {
    const conv = conversations?.find(c => c.id === id);
    updateConversationMutation.mutate({ id, important: !conv?.isImportant });
    toast.success(conv?.isImportant ? "تم إلغاء التعيين كمهمة" : "تم تعيين المحادثة كمهمة");
  }, [conversations, updateConversationMutation]);

  const handleAssignConversation = useCallback((id: number, userId: number) => {
    assignConversationMutation.mutate({ id, userId });
  }, [assignConversationMutation]);

  const handleSaveSearch = useCallback(() => {
    if (!searchName.trim()) {
      toast.error("يرجى إدخال اسم للبحث");
      return;
    }
    if (!searchQuery.trim()) {
      toast.error("يرجى إدخال نص البحث");
      return;
    }
    saveSearchMutation.mutate({
      name: searchName,
      query: searchQuery,
      filter: activeFilter,
      dateFilter,
      messageTypeFilter,
    });
  }, [searchName, searchQuery, activeFilter, dateFilter, messageTypeFilter, saveSearchMutation]);

  const handleApplySavedSearch = useCallback((savedSearch: any) => {
    setSearchQuery(savedSearch.query);
    setActiveFilter(savedSearch.filter);
    setDateFilter(savedSearch.dateFilter || "all");
    setMessageTypeFilter(savedSearch.messageTypeFilter || "all");
  }, []);

  const handleToggleSelection = useCallback((id: number) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (filteredConversations) {
      const allIds = new Set(filteredConversations.map(c => c.id));
      setSelectedConversations(allIds);
    }
  }, [filteredConversations]);

  const handleClearSelection = useCallback(() => {
    setSelectedConversations(new Set());
  }, []);

  const handleBulkArchive = useCallback(() => {
    if (selectedConversations.size === 0) return;
    const ids = Array.from(selectedConversations);
    bulkArchiveMutation.mutate({ ids });
    toast.success(`تم أرشفة ${ids.length} محادثة`);
    handleClearSelection();
    setIsSelectionMode(false);
  }, [selectedConversations, handleClearSelection]);

  const handleBulkMarkImportant = useCallback(() => {
    if (selectedConversations.size === 0) return;
    const ids = Array.from(selectedConversations);
    bulkMarkImportantMutation.mutate({ ids, important: 1 });
    toast.success(`تم تعيين ${ids.length} محادثة كمهمة`);
    handleClearSelection();
    setIsSelectionMode(false);
  }, [selectedConversations, handleClearSelection]);

  const handleSendNewMessage = useCallback(() => {
    if (!newMessagePhone.trim()) { toast.error("يرجى إدخال رقم الهاتف"); return; }
    if (newMessageTemplateId) {
      const template = templates?.find((t: Template) => t.id === newMessageTemplateId);
      if (!template) { toast.error("القالب غير موجود"); return; }
      sendTemplateMutation.mutate({
        phone: newMessagePhone,
        templateName: template.metaName || template.name,
        language: template.languageCode || "ar",
      });
    } else {
      if (!newMessageText.trim()) { toast.error("يرجى إدخال الرسالة أو اختيار قالب"); return; }
      sendNewMessageMutation.mutate({ conversationId: selectedConversation || 0, message: newMessageText });
    }
  }, [newMessagePhone, newMessageTemplateId, newMessageText, templates, sendTemplateMutation, sendNewMessageMutation, selectedConversation]);

  const handleConversationUpdate = useCallback(() => refetchConversations(), [refetchConversations]);

  // SSE
  const { user } = useAuth();
  const userId = user?.id || 0;
  useSSE(userId ? `/api/whatsapp/stream/user/${userId}` : null, useCallback((e: MessageEvent) => {
    try {
      if ((e as any).type === 'new_inbound_message') refetchConversations();
    } catch (_) {}
  }, [refetchConversations]));

  // Derived - filtered conversations
  const filteredConversations = useMemo(() => {
    let result = conversations || [];

    // Apply filter tab
    switch (activeFilter) {
      case "unread": result = result.filter(c => c.unreadCount > 0); break;
      case "important": result = result.filter(c => c.isImportant === 1); break;
      case "archived": result = result.filter(c => c.isArchived === 1); break;
      case "unnamed": result = result.filter(c => !c.customerName || c.customerName.trim() === ""); break;
      case "unreplied": 
        // Conversations where last message was inbound and no outbound reply
        result = result.filter(c => {
          // This is a simplified check - in a real implementation, you'd check the last message direction
          // For now, we'll use a heuristic: if there's a last message and it's from customer
          return c.lastMessage && !c.lastMessage.startsWith("تم الرد"); 
        }); 
        break;
      default: result = result.filter(c => !c.isArchived); break;
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      result = result.filter(c => {
        if (!c.lastMessageAt) return false;
        const lastMsgDate = new Date(c.lastMessageAt);
        switch (dateFilter) {
          case "today": return lastMsgDate >= today;
          case "week": return lastMsgDate >= weekAgo;
          case "month": return lastMsgDate >= monthAgo;
          default: return true;
        }
      });
    }

    // Apply message type filter (simplified - would need last message type from API)
    // For now, this is a placeholder that would need backend support
    if (messageTypeFilter !== "all") {
      // This would require the API to return lastMessageType
      // result = result.filter(c => c.lastMessageType === messageTypeFilter);
    }

    // Apply search
    if (searchQuery) {
      result = result.filter(c =>
        c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phoneNumber?.includes(searchQuery) ||
        c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort: unread first, then by date
    return result.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return (b.unreadCount || 0) - (a.unreadCount || 0);
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations, activeFilter, searchQuery, dateFilter, messageTypeFilter]);

  const selectedConv = conversations?.find((c: Conversation) => c.id === selectedConversation);
  const isSendingNewMessage = sendNewMessageMutation.isPending || sendTemplateMutation.isPending;

  const listProps = {
    filteredConversations,
    conversationsLoading,
    selectedConversation,
    searchQuery,
    onSearchChange: handleSearchChange,
    onSelectConversation: handleSelectConversation,
    isNewMessageOpen,
    onNewMessageOpenChange: handleNewMessageOpenChange,
    newMessagePhone,
    onNewMessagePhoneChange: handleNewMessagePhoneChange,
    newMessageText,
    onNewMessageTextChange: handleNewMessageTextChange,
    newMessageTemplateId,
    onNewMessageTemplateIdChange: handleNewMessageTemplateIdChange,
    templates,
    onSendNewMessage: handleSendNewMessage,
    isSendingNewMessage,
    connectionStatus,
    statusLoading,
    allConversations: conversations,
    activeFilter,
    onFilterChange: setActiveFilter,
    onArchiveConversation: handleArchiveConversation,
    onToggleImportant: handleToggleImportant,
    onAssignConversation: handleAssignConversation,
    activeUsers,
    onSaveSearchClick: () => setSaveSearchOpen(true),
    isSelectionMode,
    selectedConversations,
    onToggleSelection: handleToggleSelection,
    onSelectAll: handleSelectAll,
    onClearSelection: handleClearSelection,
    onBulkArchive: handleBulkArchive,
    onBulkMarkImportant: handleBulkMarkImportant,
    onToggleSelectionMode: () => setIsSelectionMode(!isSelectionMode),
    isSplitView,
    secondConversationId,
    onSelectSecondConversation: setSecondConversationId,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir="rtl">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
              <MessageCircle className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">إدارة محادثات واتساب</h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground hidden xs:block">تواصل مع العملاء عبر واتساب بيزنس</p>
            </div>
            <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{sidebarOpen ? "إخفاء" : "عرض"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5"
                onClick={() => setIsSplitView(!isSplitView)}
                disabled={!selectedConversation}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{isSplitView ? "إلغاء التقسيم" : "تقسيم"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5"
                onClick={() => refetchConversations()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">تحديث</span>
              </Button>
              <Link href="/dashboard/whatsapp/connection">
                <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">الاتصال</span>
                </Button>
              </Link>
              <Link href="/dashboard/whatsapp/templates">
                <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">القوالب</span>
                </Button>
              </Link>
              <Link href="/dashboard/whatsapp/analytics">
                <Button variant="outline" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5">
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">التحليلات</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Save Search Dialog */}
        <Dialog open={saveSearchOpen} onOpenChange={setSaveSearchOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>حفظ البحث</DialogTitle>
              <DialogDescription>احفظ البحث الحالي لاستخدامه لاحقاً</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="search-name">اسم البحث</Label>
                <Input
                  id="search-name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="مثال: عملاء غير مقروءين"
                  dir="rtl"
                />
              </div>
              <div>
                <Label>نص البحث</Label>
                <p className="text-sm text-muted-foreground mt-1">{searchQuery}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveSearchOpen(false)}>إلغاء</Button>
              <Button onClick={handleSaveSearch} disabled={saveSearchMutation.isPending}>
                {saveSearchMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Chat Layout */}
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border dark:border-gray-800"
          style={{ height: "calc(100vh - 140px)", minHeight: "400px" }}
        >
          {/* Desktop */}
          <div className={`hidden lg:grid h-full transition-all duration-300 ${isSplitView ? 'lg:grid-cols-[340px_1fr_1fr]' : sidebarOpen ? 'lg:grid-cols-[340px_1fr_280px]' : 'lg:grid-cols-[1fr_280px]'}`}>
            {sidebarOpen && !isSplitView && (
              <div className="border-l dark:border-gray-800 h-full overflow-hidden flex flex-col">
                <ConversationsList {...listProps} />
              </div>
            )}
            {isSplitView && (
              <div className="border-l dark:border-gray-800 h-full overflow-hidden flex flex-col">
                <ConversationsList {...listProps} />
              </div>
            )}
            <div className="h-full overflow-hidden flex flex-col border-l dark:border-gray-800">
              {selectedConversation ? (
                <>
                  <ChatAreaHeader
                    selectedConv={selectedConv}
                    onBackToList={handleBackToList}
                    onToggleImportant={handleToggleImportant}
                  />
                  <div className="flex-1 overflow-hidden">
                    <ChatWindow conversationId={selectedConversation} lastMessageAt={selectedConv?.lastMessageAt} onConversationUpdate={handleConversationUpdate} phone={selectedConv?.phoneNumber} />
                  </div>
                </>
              ) : (
                <EmptyChatPlaceholder />
              )}
            </div>
            {isSplitView ? (
              <div className="h-full overflow-hidden flex flex-col">
                {secondConversationId ? (
                  <>
                    <ChatAreaHeader
                      selectedConv={conversations?.find(c => c.id === secondConversationId)}
                      onBackToList={() => setSecondConversationId(null)}
                      onToggleImportant={(id) => handleToggleImportant(id)}
                    />
                    <div className="flex-1 overflow-hidden">
                      <ChatWindow conversationId={secondConversationId} lastMessageAt={conversations?.find(c => c.id === secondConversationId)?.lastMessageAt} onConversationUpdate={handleConversationUpdate} phone={conversations?.find(c => c.id === secondConversationId)?.phoneNumber} />
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm flex items-center justify-center h-full">
                    اختر محادثة ثانية من القائمة
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full overflow-y-auto border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {selectedConv ? (
                  <ConversationInfo conversation={selectedConv} onConversationUpdate={handleConversationUpdate} />
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    اختر محادثة لعرض التفاصيل
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="lg:hidden h-full flex flex-col">
            {mobileShowChat && selectedConversation ? (
              <>
                <ChatAreaHeader
                  selectedConv={selectedConv}
                  onBackToList={handleBackToList}
                  onToggleImportant={handleToggleImportant}
                />
                <div className="flex-1 overflow-hidden">
                  <ChatWindow conversationId={selectedConversation} lastMessageAt={selectedConv?.lastMessageAt} onConversationUpdate={handleConversationUpdate} phone={selectedConv?.phoneNumber} />
                </div>
              </>
            ) : (
              <ConversationsList {...listProps} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
