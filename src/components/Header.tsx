import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LogIn, User, LogOut, Moon, Sun, Globe } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userRole, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const isAdmin = userRole === "super_admin" || userRole === "admin";

  const links = [
    { to: "/", label: t("হোম", "Home") },
    { to: "/browse", label: t("ব্রাউজ", "Browse") },
    { to: "/institutes", label: t("প্রতিষ্ঠান", "Institutes") },
    ...(isAdmin ? [{ to: "/admin", label: t("অ্যাডমিন", "Admin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            deendirectory
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-1 px-2 text-xs font-medium"
            title={language === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "bn" ? "EN" : "বাং"}</span>
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{profile?.full_name || t("প্রোফাইল", "Profile")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2">
                  <User className="h-4 w-4" /> {t("প্রোফাইল", "Profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> {t("সাইন আউট", "Sign Out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex">
              <Link to="/auth">
                <Button size="sm" className="gap-1">
                  <LogIn className="h-4 w-4" /> {t("সাইন ইন", "Sign In")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
