import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Pencil, Clock, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";

const StoryManager = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: categories } = useQuery({
    queryKey: ["story-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("story_categories").select("*").order("name");
      return data || [];
    },
  });

  const { data: stories } = useQuery({
    queryKey: ["admin-stories", filter],
    queryFn: async () => {
      let q = supabase.from("stories").select("*, profiles:user_id(full_name, mobile), story_categories:category_id(name)").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data || [];
    },
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, status, title, content, note }: { id: string; status?: string; title?: string; content?: string; note?: string }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (title) updates.title = title;
      if (content) updates.content = content;
      if (note !== undefined) updates.admin_note = note;
      const { error } = await supabase.from("stories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("আপডেট হয়েছে", "Updated"));
      qc.invalidateQueries({ queryKey: ["admin-stories"] });
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("মুছে ফেলা হয়েছে", "Deleted"));
      qc.invalidateQueries({ queryKey: ["admin-stories"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColor = (s: string) => {
    if (s === "pending") return "text-yellow-600 border-yellow-300";
    if (s === "approved") return "text-green-600 border-green-300";
    return "text-red-600 border-red-300";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "pending" ? t("অপেক্ষমান", "Pending") : f === "approved" ? t("অনুমোদিত", "Approved") : f === "rejected" ? t("প্রত্যাখ্যাত", "Rejected") : t("সব", "All")}
          </Button>
        ))}
      </div>

      {!stories?.length && <p className="text-muted-foreground text-center py-4">{t("কোনো স্টোরি নেই", "No stories")}</p>}

      {stories?.map((story) => (
        <Card key={story.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {editId === story.id ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1" />
              ) : (
                <CardTitle className="text-base">{story.title}</CardTitle>
              )}
              <Badge variant="outline" className={statusColor(story.status)}>
                {story.status === "pending" ? <Clock className="h-3 w-3 mr-1" /> : story.status === "approved" ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {story.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {(story.profiles as any)?.full_name} • {(story.profiles as any)?.mobile} • {format(new Date(story.created_at), "dd MMM yyyy")}
              {(story.story_categories as any)?.name && <> • <Badge variant="secondary" className="text-xs ml-1">{(story.story_categories as any).name}</Badge></>}
            </p>
          </CardHeader>
          <CardContent>
            {editId === story.id ? (
              <div className="space-y-2">
                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} />
                <Input placeholder={t("অ্যাডমিন নোট (ঐচ্ছিক)", "Admin note (optional)")} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{story.content}</p>
            )}
            {story.admin_note && editId !== story.id && (
              <p className="mt-2 text-xs text-muted-foreground italic">{t("নোট: ", "Note: ")}{story.admin_note}</p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 flex-wrap">
            {editId === story.id ? (
              <>
                <Button size="sm" onClick={() => updateStory.mutate({ id: story.id, title: editTitle, content: editContent, note: adminNote })} className="gap-1">
                  <Save className="h-3 w-3" />{t("সেভ", "Save")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>{t("বাতিল", "Cancel")}</Button>
              </>
            ) : (
              <>
                {story.status !== "approved" && (
                  <Button size="sm" variant="outline" className="gap-1 text-green-600" onClick={() => updateStory.mutate({ id: story.id, status: "approved" })}>
                    <CheckCircle className="h-3 w-3" />{t("অনুমোদন", "Approve")}
                  </Button>
                )}
                {story.status !== "rejected" && (
                  <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => updateStory.mutate({ id: story.id, status: "rejected" })}>
                    <XCircle className="h-3 w-3" />{t("প্রত্যাখ্যান", "Reject")}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditId(story.id); setEditTitle(story.title); setEditContent(story.content); setAdminNote(story.admin_note || ""); }}>
                  <Pencil className="h-3 w-3" />{t("সম্পাদনা", "Edit")}
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => { if (window.confirm(t("আপনি কি নিশ্চিত?", "Are you sure?"))) deleteStory.mutate(story.id); }}>
                  <Trash2 className="h-3 w-3" />{t("মুছুন", "Delete")}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default StoryManager;
