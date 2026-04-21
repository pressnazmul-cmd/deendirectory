import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, MousePointerClick, Upload } from "lucide-react";
import { format } from "date-fns";

const AdManager = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState("all");
  const [adType, setAdType] = useState("banner");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  const { data: ads } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data } = await supabase.from("advertisements").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const reset = () => {
    setEditId(null); setTitle(""); setImageUrl(""); setLinkUrl("");
    setPlacement("all"); setAdType("banner"); setExpiresAt(""); setIsActive(true);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("ads").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("ads").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !imageUrl) throw new Error("Title and image required");
      const payload = {
        title: title.trim(),
        image_url: imageUrl,
        link_url: linkUrl.trim() || null,
        placement,
        ad_type: adType,
        is_active: isActive,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        created_by: user!.id,
      };
      if (editId) {
        const { error } = await supabase.from("advertisements").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("advertisements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ads"] }); reset(); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("advertisements").update({ is_active: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ads"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("advertisements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ads"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-semibold">{editId ? "Edit Ad" : "New Ad"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label>Link URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Placement</Label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  <SelectItem value="homepage">Homepage</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="browse">Browse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={adType} onValueChange={setAdType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="card">Small Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expires At (optional)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Image</Label>
            <div className="flex gap-2">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL or upload" />
              <label className="inline-flex">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                <Button asChild variant="outline" disabled={uploading}>
                  <span className="cursor-pointer gap-1"><Upload className="h-4 w-4" />{uploading ? "..." : "Upload"}</span>
                </Button>
              </label>
            </div>
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 h-24 rounded border object-cover" />}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-1">
              <Plus className="h-4 w-4" />{editId ? "Update" : "Create"}
            </Button>
            {editId && <Button variant="outline" onClick={reset}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold">All Ads ({ads?.length || 0})</h3>
        {ads?.map((ad) => (
          <Card key={ad.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <img src={ad.image_url} alt={ad.title} className="h-16 w-24 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{ad.title}</p>
                <p className="text-xs text-muted-foreground">
                  {ad.placement} • {ad.ad_type}
                  {ad.expires_at && ` • exp ${format(new Date(ad.expires_at), "dd MMM yyyy")}`}
                </p>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{ad.views_count}</span>
                  <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{ad.clicks_count}</span>
                </div>
              </div>
              <Switch checked={ad.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: ad.id, val: v })} />
              <Button variant="ghost" size="icon" onClick={() => {
                setEditId(ad.id); setTitle(ad.title); setImageUrl(ad.image_url);
                setLinkUrl(ad.link_url || ""); setPlacement(ad.placement); setAdType(ad.ad_type);
                setIsActive(ad.is_active); setExpiresAt(ad.expires_at ? ad.expires_at.slice(0, 16) : "");
              }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => confirm("Delete this ad?") && remove.mutate(ad.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdManager;
