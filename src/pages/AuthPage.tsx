import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogIn, UserPlus } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign Up state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [country] = useState("Bangladesh");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazila, setUpazila] = useState("");
  const [unionName, setUnionName] = useState("");
  const [villageName, setVillageName] = useState("");

  const { data: divisions } = useQuery({
    queryKey: ["auth-divisions"],
    queryFn: async () => {
      const { data } = await supabase.from("divisions").select("*").order("division_name");
      return data || [];
    },
  });

  const { data: districts } = useQuery({
    queryKey: ["auth-districts", divisionId],
    queryFn: async () => {
      if (!divisionId) return [];
      const { data } = await supabase.from("districts").select("*").eq("division_id", divisionId).order("district_name");
      return data || [];
    },
    enabled: !!divisionId,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("সফলভাবে লগইন হয়েছে!");
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      toast.error("নাম এবং মোবাইল নম্বর আবশ্যক");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: fullName,
          mobile,
          country,
          division_id: divisionId || null,
          district_id: districtId || null,
          upazila,
          union_name: unionName,
          village_name: villageName,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে!");
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-md">
          {/* Tab buttons */}
          <div className="mb-6 flex rounded-xl border bg-card p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="h-4 w-4" /> Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="h-4 w-4" /> Sign Up
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4 rounded-xl border bg-card p-6">
              <h2 className="font-display text-xl font-bold">Sign In</h2>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4 rounded-xl border bg-card p-6">
              <h2 className="font-display text-xl font-bold">Sign Up</h2>
              <div>
                <Label>নাম *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="আপনার পুরো নাম" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
              </div>
              <div>
                <Label>মোবাইল নম্বর *</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} required placeholder="01XXXXXXXXX" />
              </div>

              <hr className="border-border" />
              <p className="text-sm font-medium text-muted-foreground">ঠিকানা</p>

              <div>
                <Label>Country</Label>
                <Input value={country} disabled />
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Sign Up"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
