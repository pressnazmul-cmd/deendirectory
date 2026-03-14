import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazila, setUpazila] = useState("");
  const [unionName, setUnionName] = useState("");
  const [villageName, setVillageName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
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

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!fullName.trim() || !mobile.trim()) throw new Error("নাম এবং মোবাইল আবশ্যক");
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
      toast.success("প্রোফাইল আপডেট হয়েছে!");
      qc.invalidateQueries({ queryKey: ["profile"] });
      // Refresh auth context profile
      window.location.reload();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-6 font-display text-2xl font-bold">আমার প্রোফাইল</h1>

          <div className="space-y-4 rounded-xl border bg-card p-6">
            {/* Email - read only */}
            <div>
              <Label className="text-muted-foreground">Email (পরিবর্তনযোগ্য নয়)</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>

            <div>
              <Label>নাম *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার পুরো নাম" />
            </div>

            <div>
              <Label>মোবাইল নম্বর *</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>

            <hr className="border-border" />
            <p className="text-sm font-medium text-muted-foreground">ঠিকানা</p>

            <div>
              <Label>Country</Label>
              <Input value="Bangladesh" disabled className="bg-muted" />
            </div>

            <div>
              <Label>Division</Label>
              <Select value={divisionId} onValueChange={(v) => { setDivisionId(v); setDistrictId(""); }}>
                <SelectTrigger><SelectValue placeholder="বিভাগ নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {divisions?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.division_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>District</Label>
              <Select value={districtId} onValueChange={setDistrictId} disabled={!divisionId}>
                <SelectTrigger><SelectValue placeholder="জেলা নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {districts?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.district_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Upazila</Label>
              <Input value={upazila} onChange={(e) => setUpazila(e.target.value)} placeholder="উপজেলার নাম লিখুন" />
            </div>

            <div>
              <Label>Union</Label>
              <Input value={unionName} onChange={(e) => setUnionName(e.target.value)} placeholder="ইউনিয়নের নাম লিখুন" />
            </div>

            <div>
              <Label>Village</Label>
              <Input value={villageName} onChange={(e) => setVillageName(e.target.value)} placeholder="গ্রামের নাম লিখুন" />
            </div>

            <Button onClick={() => updateProfile.mutate()} className="w-full gap-2" disabled={updateProfile.isPending}>
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
