import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, Building2, User, Shield, BookOpen, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const isAdmin = userRole === "super_admin" || userRole === "admin";

  const navItems = [
    { to: "/", icon: Home, label: t("হোম", "Home") },
    { to: "/browse", icon: MapPin, label: t("ব্রাউজ", "Browse") },
    { to: "/institutes", icon: Building2, label: t("প্রতিষ্ঠান", "Institutes") },
    { to: "/stories", icon: BookOpen, label: t("স্টোরি", "Stories") },
    { to: "/products", icon: ShoppingBag, label: t("পণ্য", "Products") },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: t("অ্যাডমিন", "Admin") }] : []),
    ...(user
      ? [{ to: "/profile", icon: User, label: t("প্রোফাইল", "Profile") }]
      : [{ to: "/auth", icon: User, label: t("সাইন ইন", "Sign In") }]),
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden safe-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  active ? "bg-primary/10 scale-110" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
