import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import BrowsePage from "./pages/BrowsePage";
import InstitutesPage from "./pages/InstitutesPage";
import InstituteDetailsPage from "./pages/InstituteDetailsPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/browse/:divisionId" element={<BrowsePage />} />
              <Route path="/browse/:divisionId/:districtId" element={<BrowsePage />} />
              <Route path="/browse/:divisionId/:districtId/:upazilaId" element={<BrowsePage />} />
              <Route path="/browse/:divisionId/:districtId/:upazilaId/:unionId" element={<BrowsePage />} />
              <Route path="/institutes" element={<InstitutesPage />} />
              <Route path="/institutes/:id" element={<InstituteDetailsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomNav />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
