import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";

interface Props { adminMode?: boolean }

const ProductManager = ({ adminMode = false }: Props) => {
  const { user, userRole } = useAuth();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  const isAdmin = userRole === "super_admin" || userRole === "admin";

  const { data: products } = useQuery({
    queryKey: ["manage-products", adminMode, user?.id],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!adminMode && user) q = q.eq("seller_id", user.id);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user,
  });

  const reset = () => {
    setEditId(null); setName(""); setDescription(""); setPrice("");
    setImageUrl(""); setWhatsapp(""); setPhone(""); setIsActive(true);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      if (!whatsapp.trim() && !phone.trim()) throw new Error("WhatsApp or phone required");
      const payload = {
        seller_id: user!.id,
        name: name.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        image_url: imageUrl || null,
        whatsapp_number: whatsapp.trim() || null,
        phone_number: phone.trim() || null,
        is_active: isActive,
      };
      if (editId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      reset(); toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Deleted");
    },
  });

  if (!user) return <p className="text-center text-muted-foreground py-8">Please sign in</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-semibold">{editId ? "Edit Product" : "New Product"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (BDT)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+8801..." />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} />
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
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active (visible to buyers)</Label>
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
        <h3 className="font-semibold">{adminMode ? "All Products" : "My Products"} ({products?.length || 0})</h3>
        {products?.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded object-cover" />
              ) : (
                <div className="h-16 w-16 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                {p.price != null && <p className="text-sm text-primary font-semibold">৳{p.price}</p>}
                <p className="text-xs text-muted-foreground">{p.whatsapp_number || p.phone_number}</p>
              </div>
              <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, val: v })} />
              {(p.seller_id === user.id || isAdmin) && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditId(p.id); setName(p.name); setDescription(p.description || "");
                    setPrice(p.price?.toString() || ""); setImageUrl(p.image_url || "");
                    setWhatsapp(p.whatsapp_number || ""); setPhone(p.phone_number || "");
                    setIsActive(p.is_active);
                  }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => confirm("Delete this product?") && remove.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductManager;
