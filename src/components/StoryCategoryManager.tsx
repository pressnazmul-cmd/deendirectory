import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const StoryCategoryManager = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["story-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("story_categories").select("*").order("name");
      return data || [];
    },
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      if (editId) {
        const { error } = await supabase.from("story_categories").update({ name: name.trim() }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("story_categories").insert({ name: name.trim() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story-categories"] });
      setName("");
      setEditId(null);
      toast.success(t("সেভ হয়েছে", "Saved"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("story_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["story-categories"] });
      toast.success(t("মুছে ফেলা হয়েছে", "Deleted"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t("বিভাগের নাম", "Category name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={() => saveCategory.mutate()} className="gap-1">
          <Plus className="h-4 w-4" />
          {editId ? t("আপডেট", "Update") : t("যোগ করুন", "Add")}
        </Button>
        {editId && (
          <Button variant="outline" onClick={() => { setEditId(null); setName(""); }}>
            {t("বাতিল", "Cancel")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {categories?.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <p className="text-sm font-medium text-card-foreground">{cat.name}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setEditId(cat.id); setName(cat.name); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteCategory.mutate(cat.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!categories?.length && (
          <p className="text-center text-muted-foreground py-4">{t("কোনো বিভাগ নেই", "No categories")}</p>
        )}
      </div>
    </div>
  );
};

export default StoryCategoryManager;
