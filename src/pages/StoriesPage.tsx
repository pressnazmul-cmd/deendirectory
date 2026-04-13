import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PenLine, Send, Clock, CheckCircle, XCircle, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const StoriesPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["story-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("story_categories").select("*").order("name");
      return data || [];
    },
  });

  // Fetch approved stories
  const { data: approvedStories, isLoading } = useQuery({
    queryKey: ["stories-approved", selectedCategory],
    queryFn: async () => {
      let q = supabase
        .from("stories")
        .select("*, profiles:user_id(full_name, avatar_url), story_categories:category_id(name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (selectedCategory !== "all") {
        q = q.eq("category_id", selectedCategory);
      }
      const { data } = await q;
      return data || [];
    },
  });

  // Fetch user's own stories
  const { data: myStories } = useQuery({
    queryKey: ["stories-mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*, story_categories:category_id(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const submitStory = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error("Title and content required");
      const payload: any = {
        user_id: user!.id,
        title: title.trim(),
        content: content.trim(),
      };
      if (categoryId) payload.category_id = categoryId;
      const { error } = await supabase.from("stories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("স্টোরি সাবমিট হয়েছে! অনুমোদনের জন্য অপেক্ষা করুন।", "Story submitted! Waiting for approval."));
      setTitle("");
      setContent("");
      setCategoryId("");
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["stories-mine"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300"><Clock className="h-3 w-3" />{t("অপেক্ষমান", "Pending")}</Badge>;
    if (status === "approved") return <Badge variant="outline" className="gap-1 text-green-600 border-green-300"><CheckCircle className="h-3 w-3" />{t("অনুমোদিত", "Approved")}</Badge>;
    return <Badge variant="outline" className="gap-1 text-red-600 border-red-300"><XCircle className="h-3 w-3" />{t("প্রত্যাখ্যাত", "Rejected")}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t("স্টোরি", "Stories")}</h1>
          {user ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><PenLine className="h-4 w-4" />{t("স্টোরি লিখুন", "Write Story")}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("নতুন স্টোরি", "New Story")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder={t("শিরোনাম", "Title")} value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder={t("বিভাগ নির্বাচন করুন", "Select Category")} /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder={t("আপনার স্টোরি লিখুন...", "Write your story...")} value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
                  <Button onClick={() => submitStory.mutate()} disabled={submitStory.isPending} className="w-full gap-2">
                    <Send className="h-4 w-4" />{t("সেন্ড করুন", "Submit")}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("সাবমিট করার পর অ্যাডমিনের অনুমোদন প্রয়োজন।", "After submitting, admin approval is required.")}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="gap-2"><LogIn className="h-4 w-4" />{t("লগইন করে স্টোরি লিখুন", "Login to Write")}</Button>
            </Link>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            {t("সব", "All")}
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {user && myStories && myStories.length > 0 && (
          <Tabs defaultValue="public" className="mb-6">
            <TabsList>
              <TabsTrigger value="public">{t("সকল স্টোরি", "All Stories")}</TabsTrigger>
              <TabsTrigger value="mine">{t("আমার স্টোরি", "My Stories")}</TabsTrigger>
            </TabsList>
            <TabsContent value="public">
              <StoryList stories={approvedStories || []} isLoading={isLoading} t={t} />
            </TabsContent>
            <TabsContent value="mine">
              <div className="grid gap-4">
                {myStories.map((story) => (
                  <Card key={story.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                        {statusBadge(story.status)}
                      </div>
                      {(story.story_categories as any)?.name && (
                        <Badge variant="secondary" className="w-fit">{(story.story_categories as any).name}</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{story.content}</p>
                      {story.admin_note && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {t("অ্যাডমিন নোট: ", "Admin note: ")}{story.admin_note}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                      {format(new Date(story.created_at), "dd MMM yyyy, hh:mm a")}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {(!user || !myStories || myStories.length === 0) && (
          <StoryList stories={approvedStories || []} isLoading={isLoading} t={t} />
        )}
      </main>
      <Footer />
    </div>
  );
};

const StoryList = ({ stories, isLoading, t }: { stories: any[]; isLoading: boolean; t: (bn: string, en: string) => string }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (isLoading) return <p className="text-center text-muted-foreground py-8">{t("লোড হচ্ছে...", "Loading...")}</p>;
  if (!stories.length) return <p className="text-center text-muted-foreground py-8">{t("কোনো স্টোরি পাওয়া যায়নি", "No stories found")}</p>;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const truncate = (text: string, wordLimit: number) => {
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return { text, truncated: false };
    return { text: words.slice(0, wordLimit).join(" ") + "...", truncated: true };
  };

  return (
    <div className="grid gap-4">
      {stories.map((story) => {
        const isExpanded = expandedIds.has(story.id);
        const { text: displayText, truncated } = truncate(story.content, 25);
        return (
          <Card key={story.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{story.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {t("লেখক: ", "By: ")}{(story.profiles as any)?.full_name || t("অজানা", "Unknown")} • {format(new Date(story.created_at), "dd MMM yyyy")}
                </p>
                {(story.story_categories as any)?.name && (
                  <Badge variant="secondary" className="text-xs">{(story.story_categories as any).name}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent onClick={() => truncated && toggleExpand(story.id)} className={truncated ? "cursor-pointer" : ""}>
              <p className="text-sm whitespace-pre-wrap">{isExpanded ? story.content : displayText}</p>
              {truncated && (
                <span className="text-sm text-primary mt-1 inline-block">
                  {isExpanded ? t("সংক্ষেপে দেখুন", "Show Less") : t("আরও পড়ুন", "Read More")}
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StoriesPage;
