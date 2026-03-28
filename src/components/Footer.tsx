import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-card py-8">
      <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground">deendirectory</span>
        </div>
        <p>{t("বাংলাদেশের শিক্ষা প্রতিষ্ঠানের একটি বিস্তারিত ডিরেক্টরি", "A comprehensive directory of educational institutes in Bangladesh")}</p>
      </div>
    </footer>
  );
};

export default Footer;
