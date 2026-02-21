import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface CommentsSectionProps {
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration";
  entityId: number;
}

export default function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const utils = trpc.useUtils();

  // Fetch comments
  const { data: comments, isLoading } = trpc.comments.getByEntity.useQuery({
    entityType,
    entityId,
  });

  // Add comment mutation
  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعليق بنجاح");
      setNewComment("");
      utils.comments.getByEntity.invalidate({ entityType, entityId });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة التعليق");
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التعليق بنجاح");
      utils.comments.getByEntity.invalidate({ entityType, entityId });
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف التعليق");
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("الرجاء إدخال نص التعليق");
      return;
    }

    addCommentMutation.mutate({
      entityType,
      entityId,
      content: newComment.trim(),
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
      deleteCommentMutation.mutate({ commentId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">جاري تحميل التعليقات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">التعليقات ({comments?.length || 0})</h3>
      </div>

      {/* Add new comment */}
      <div className="space-y-2">
        <Textarea
          placeholder="أضف تعليقاً..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={addCommentMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleAddComment}
            disabled={addCommentMutation.isPending || !newComment.trim()}
            size="sm"
          >
            <Send className="h-4 w-4 ml-2" />
            إضافة تعليق
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deleteCommentMutation.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد تعليقات بعد</p>
            <p className="text-xs mt-1">كن أول من يضيف تعليقاً</p>
          </div>
        )}
      </div>
    </div>
  );
}
