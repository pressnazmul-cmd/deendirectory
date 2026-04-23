import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSlot from "@/components/AdSlot";
import ProductManager from "@/components/ProductManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Phone, Plus, Search, ShoppingBag, LogIn, ShoppingCart, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const ProductsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  const handleBuyNow = async (productId: string) => {
    await addToCart(productId, 1);
    navigate("/checkout");
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      let q = supabase.from("products").select("*, profiles:seller_id(full_name)")
        .eq("is_active", true).order("created_at", { ascending: false });
      if (search.trim()) q = q.ilike("name", `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const waLink = (num: string, productName: string) => {
    const clean = num.replace(/[^\d+]/g, "");
    const msg = encodeURIComponent(t(`আসসালামু আলাইকুম, "${productName}" সম্পর্কে জানতে চাই।`, `Hi, I'm interested in "${productName}".`));
    return `https://wa.me/${clean.replace(/^\+/, "")}?text=${msg}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            {t("পণ্য", "Products")}
          </h1>
          {user ? (
            <Dialog open={manageOpen} onOpenChange={setManageOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{t("পণ্য যোগ করুন", "Sell a Product")}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t("আমার পণ্য", "My Products")}</DialogTitle></DialogHeader>
                <ProductManager />
              </DialogContent>
            </Dialog>
          ) : (
            <Link to="/auth"><Button variant="outline" className="gap-2"><LogIn className="h-4 w-4" />{t("সাইন ইন", "Sign In")}</Button></Link>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("পণ্য খুঁজুন...", "Search products...")} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <AdSlot placement="browse" type="banner" className="mb-6" />

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">{t("লোড হচ্ছে...", "Loading...")}</p>
        ) : !products?.length ? (
          <p className="text-center text-muted-foreground py-12">{t("কোনো পণ্য পাওয়া যায়নি", "No products found")}</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden flex flex-col">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-48 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-48 w-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="flex flex-col flex-1 p-4">
                  <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                  {p.price != null && (
                    <p className="text-lg font-bold text-primary mt-1">৳{Number(p.price).toLocaleString()}</p>
                  )}
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("বিক্রেতা", "Seller")}: {(p.profiles as any)?.full_name || t("অজানা", "Unknown")}
                  </p>
                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleBuyNow(p.id)} disabled={p.price == null}>
                        <Zap className="h-4 w-4" />{t("এখনই কিনুন", "Buy Now")}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => user ? addToCart(p.id) : navigate("/auth")} disabled={p.price == null}>
                        <ShoppingCart className="h-4 w-4" />{t("কার্ট", "Add to Cart")}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {p.whatsapp_number && (
                        <Button asChild size="sm" variant="ghost" className="flex-1 gap-1 text-[#25D366] hover:text-[#1ebe5a] hover:bg-[#25D366]/10">
                          <a href={waLink(p.whatsapp_number, p.name)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-4 w-4" />WhatsApp
                          </a>
                        </Button>
                      )}
                      {p.phone_number && (
                        <Button asChild size="sm" variant="ghost" className="flex-1 gap-1">
                          <a href={`tel:${p.phone_number}`}>
                            <Phone className="h-4 w-4" />{t("কল", "Call")}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
