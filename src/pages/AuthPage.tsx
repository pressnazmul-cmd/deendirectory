import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEmail = emailOrPhone.includes("@");

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({ email: emailOrPhone, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("সফলভাবে লগইন হয়েছে!", "Signed in successfully!"));
        navigate("/");
      }
    } else {
      const { data: profileData } = await supabase.from("profiles").select("id").eq("mobile", emailOrPhone).single();
      if (!profileData) {
        toast.error(t("এই মোবাইল নম্বর দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি", "No account found with this mobile number"));
        setLoading(false);
        return;
      }
      toast.error(t("মোবাইল নম্বর দিয়ে লগইন করতে আপনার ইমেইল ব্যবহার করুন", "Please use your email to sign in"));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mx-auto max-w-md">
          <form onSubmit={handleSignIn} className="space-y-4 rounded-xl border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <LogIn className="h-5 w-5" /> {t("সাইন ইন", "Sign In")}
            </h2>
            <div>
              <Label>{t("Email বা মোবাইল নম্বর", "Email or Mobile Number")}</Label>
              <Input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                placeholder={t("email@example.com বা 01XXXXXXXXX", "email@example.com or 01XXXXXXXXX")}
              />
            </div>
            <div>
              <Label>{t("পাসওয়ার্ড", "Password")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("লোড হচ্ছে...", "Loading...") : t("সাইন ইন", "Sign In")}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;
