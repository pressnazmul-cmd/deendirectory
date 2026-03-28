import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Save, Pencil, Upload, MapPin, Phone, Camera } from "lucide-react";

const compressImage = (file: File, maxSizeKB = 15): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        const maxDim = 200;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);

        let lo = 0.1, hi = 0.9, blob: Blob | null = null;
        const tryCompress = (quality: number): Promise<Blob> =>
          new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));

        (async () => {
          for (let i = 0; i < 8; i++) {
            const mid = (lo + hi) / 2;
            blob = await tryCompress(mid);
            if (blob.size > maxSizeKB * 1024) hi = mid;
            else lo = mid;
          }
          blob = await tryCompress(lo);
          resolve(blob!);
        })();
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazila, setUpazila] = useState("");
  const [unionName, setUnionName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setMobile(profile.mobile || "");
      setDivisionId(profile.division_id || "");
      setDistrictId(profile.district_id || "");
      setUpazila(profile.upazila || "");
      setUnionName(profile.union_name || "");
      setVillageName(profile.village_name || "");
      setAvatarUrl((profile as any).avatar_url || "");
    }
  }, [profile]);

  const { data: divisions } = useQuery({
    queryKey: ["profile-divisions"],
    queryFn: async () => {
      const { data } = await supabase.from("divisions").select("*").order("division_name");
      return data || [];
    },
  });

  const { data: districts } = useQuery({
    queryKey: ["profile-districts", divisionId],
    queryFn: async () => {
      if (!divisionId) return [];
      const { data } = await supabase.from("districts").select("*").eq("division_id", divisionId).order("district_name");
      return data || [];
    },
    enabled: !!divisionId,
  });

  const divisionName = divisions?.find((d) => d.id === divisionId)?.division_name || "";
  const districtName = districts?.find((d) => d.id === districtId)?.district_name || "";

  const locationParts = [villageName, unionName, upazila, districtName, divisionName].filter(Boolean);
  const locationString = locationParts.join(", ") || t("ঠিকানা যোগ করুন", "Add address");

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file, 15);
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: newUrl } as any).eq("id", user.id);
      setAvatarUrl(newUrl);
      toast.success(t("ছবি আপলোড হয়েছে!", "Photo uploaded!"));
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || t("ছবি আপলোড ব্যর্থ হয়েছে", "Photo upload failed"));
    } finally {
      setUploading(false);
    }
  }, [user, qc, t]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!fullName.trim() || !mobile.trim()) throw new Error(t("নাম এবং মোবাইল আবশ্যক", "Name and mobile required"));
      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        mobile,
        division_id: divisionId || null,
        district_id: districtId || null,
        upazila: upazila || "",
        union_name: unionName || "",
        village_name: villageName || "",
      }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("প্রোফাইল আপডেট হয়েছে!", "Profile updated!"));
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["profile"] });
      window.location.reload();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading) return null;

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 font-display text-2xl font-bold text-foreground">{t("প্রোফাইল", "Profile")}</h1>

          <div className="mb-6 overflow-hidden rounded-xl border bg-card">
            <div className="hero-gradient px-6 py-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-4 border-primary-foreground shadow-lg">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Camera className="h-6 w-6 text-primary-foreground" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold text-primary-foreground">
                    {fullName || t("নাম যোগ করুন", "Add name")}
                  </h2>
                  <div className="mt-1 flex flex-col gap-1 text-sm text-primary-foreground/80">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {locationString}</span>
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {mobile || t("মোবাইল যোগ করুন", "Add mobile")}</span>
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setIsEditing(!isEditing)}>
                  <Pencil className="h-3.5 w-3.5" />
                  {isEditing ? t("বাতিল", "Cancel") : t("সম্পাদনা", "Edit")}
                </Button>
              </div>
            </div>

            {!isEditing && (
              <div className="p-6">
                <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("ব্যক্তিগত তথ্য", "Personal Information")}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label={t("নাম", "Name")} value={fullName} />
                  <InfoItem label={t("মোবাইল নম্বর", "Mobile")} value={mobile} icon={<Phone className="h-3.5 w-3.5 text-muted-foreground" />} />
                  <InfoItem label="Email" value={user?.email || ""} />
                  <InfoItem label={t("বিভাগ", "Division")} value={divisionName} />
                  <InfoItem label={t("জেলা", "District")} value={districtName} />
                  <InfoItem label={t("উপজেলা", "Upazila")} value={upazila} />
                  <InfoItem label={t("ইউনিয়ন", "Union")} value={unionName} />
                  <InfoItem label={t("গ্রাম", "Village")} value={villageName} />
                </div>

                <div className="mt-6 border-t pt-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("প্রোফাইল ছবি", "Profile Picture")}
                  </h3>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-primary">
                      {uploading ? t("আপলোড হচ্ছে...", "Uploading...") : t("ক্লিক করে আপলোড করুন", "Click to upload")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("সর্বোচ্চ রেজোলিউশন 200×200px • স্বয়ংক্রিয় ~15KB", "Max resolution 200×200px • Auto compressed to ~15KB")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="space-y-4 p-6">
                <h3 className="mb-2 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("তথ্য সম্পাদনা করুন", "Edit Information")}
                </h3>

                <div>
                  <Label className="text-muted-foreground text-xs">{t("Email (পরিবর্তনযোগ্য নয়)", "Email (not editable)")}</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t("নাম *", "Name *")}</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("আপনার পুরো নাম", "Your full name")} />
                  </div>
                  <div>
                    <Label>{t("মোবাইল নম্বর *", "Mobile *")}</Label>
                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="01XXXXXXXXX" />
                  </div>
                </div>

                <hr className="border-border" />
                <p className="text-sm font-medium text-muted-foreground">{t("ঠিকানা", "Address")}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t("দেশ", "Country")}</Label>
                    <Input value="Bangladesh" disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>{t("বিভাগ", "Division")}</Label>
                    <Select value={divisionId} onValueChange={(v) => { setDivisionId(v); setDistrictId(""); }}>
                      <SelectTrigger><SelectValue placeholder={t("বিভাগ নির্বাচন করুন", "Select division")} /></SelectTrigger>
                      <SelectContent>
                        {divisions?.map((d) => <SelectItem key={d.id} value={d.id}>{d.division_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("জেলা", "District")}</Label>
                    <Select value={districtId} onValueChange={setDistrictId} disabled={!divisionId}>
                      <SelectTrigger><SelectValue placeholder={t("জেলা নির্বাচন করুন", "Select district")} /></SelectTrigger>
                      <SelectContent>
                        {districts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.district_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("উপজেলা", "Upazila")}</Label>
                    <Input value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder={t("উপজেলার নাম", "Upazila name")} />
                  </div>
                  <div>
                    <Label>{t("ইউনিয়ন", "Union")}</Label>
                    <Input value={unionName} onChange={(e) => setUnionName(e.target.value)} placeholder={t("ইউনিয়নের নাম", "Union name")} />
                  </div>
                  <div>
                    <Label>{t("গ্রাম", "Village")}</Label>
                    <Input value={villageName} onChange={(e) => setVillageName(e.target.value)} placeholder={t("গ্রামের নাম", "Village name")} />
                  </div>
                </div>

                <Button onClick={() => updateProfile.mutate()} className="w-full gap-2" disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4" />
                  {updateProfile.isPending ? t("সংরক্ষণ হচ্ছে...", "Saving...") : t("সংরক্ষণ করুন", "Save")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const InfoItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
      {icon}
      {value || <span className="text-muted-foreground italic">—</span>}
    </p>
  </div>
);

export default ProfilePage;
