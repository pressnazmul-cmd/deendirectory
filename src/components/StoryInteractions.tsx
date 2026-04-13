import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ThumbsUp, MessageCircle, Share2, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface StoryInteractionsProps {
  storyId: string;
  storyTitle: string;
}

const StoryInteractions = ({ storyId, storyTitle }: StoryInteractionsProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Fetch like count and user's like status
  const { data: likesData } = useQuery({
    queryKey: ["story-likes", storyId],
    queryFn: async () => {
      const { data, count } = await supabase
        .from("story_likes")
        .select("*", { count: "exact" })
        .eq("story_id", storyId);
      return { likes: data || [], count: count || 0 };
    },
  });

  const isLiked = user ? likesData?.likes.some((l: any) => l.user_id === user.id) : false;
  const likeCount = likesData?.count || 0;

  // Toggle like
  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (isLiked) {
        const { error } = await supabase
          .from("story_likes")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("story_likes")
          .insert({ story_id: storyId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story-likes", storyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Fetch comments
  const { data: comments } = useQuery({
    queryKey: ["story-comments", storyId],
    enabled: showComments,
    queryFn: async () => {
      const { data } = await supabase
        .from("story_comments")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Comment count (always fetch)
  const { data: commentCount } = useQuery({
    queryKey: ["story-comments-count", storyId],
    queryFn: async () => {
      const { count } = await supabase
        .from("story_comments")
        .select("*", { count: "exact", head: true })
        .eq("story_id", storyId);
      return count || 0;
    },
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!commentText.trim()) throw new Error("Comment required");
      const { error } = await supabase
        .from("story_comments")
        .insert({ story_id: storyId, user_id: user.id, content: commentText.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["story-comments", storyId] });
      qc.invalidateQueries({ queryKey: ["story-comments-count", storyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete comment
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("story_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story-comments", storyId] });
      qc.invalidateQueries({ queryKey: ["story-comments-count", storyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Share
  const handleShare = async () => {
    const url = `${window.location.origin}/stories`;
    if (navigator.share) {
      try {
        await navigator.share({ title: storyTitle, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t("লিংক কপি হয়েছে", "Link copied"));
    }
  };

  return (
    <div className="pt-2 border-t">
      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
          onClick={() => user ? toggleLike.mutate() : toast.error(t("লগইন করুন", "Please login"))}
          disabled={toggleLike.isPending}
        >
          <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4" />
          {(commentCount ?? 0) > 0 && <span className="text-xs">{commentCount}</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 space-y-3">
          {/* Comment list */}
          {comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-2 items-start">
              <Avatar className="h-6 w-6 mt-0.5">
                {comment.profiles?.avatar_url ? (
                  <AvatarImage src={comment.profiles.avatar_url} />
                ) : null}
                <AvatarFallback className="text-[10px]">
                  {(comment.profiles?.full_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-xs font-medium">{comment.profiles?.full_name || t("অজানা", "Unknown")}</p>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 px-1">
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(comment.created_at), "dd MMM, hh:mm a")}
                  </span>
                  {user && (user.id === comment.user_id) && (
                    <button
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="text-[10px] text-destructive hover:underline"
                    >
                      {t("মুছুন", "Delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Comment input */}
          {user ? (
            <div className="flex gap-2">
              <Input
                placeholder={t("কমেন্ট লিখুন...", "Write a comment...")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !addComment.isPending && commentText.trim() && addComment.mutate()}
                className="text-sm h-9"
              />
              <Button
                size="sm"
                onClick={() => addComment.mutate()}
                disabled={addComment.isPending || !commentText.trim()}
                className="h-9 px-3"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              {t("কমেন্ট করতে লগইন করুন", "Login to comment")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryInteractions;
