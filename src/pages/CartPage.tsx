import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

const CartPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items, loading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = items.reduce((s, i) => s + (Number(i.product.price) || 0) * i.quantity, 0);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-12 max-w-3xl text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t("কার্ট দেখতে সাইন ইন করুন", "Sign in to view your cart")}</h1>
          <Link to="/auth"><Button className="mt-4">{t("সাইন ইন", "Sign In")}</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          {t("আমার কার্ট", "My Cart")} {items.length > 0 && <span className="text-muted-foreground text-base">({items.length})</span>}
        </h1>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t("লোড হচ্ছে...", "Loading...")}</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">{t("আপনার কার্ট খালি", "Your cart is empty")}</p>
            <Link to="/products"><Button>{t("পণ্য ব্রাউজ করুন", "Browse Products")}</Button></Link>
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex gap-3 p-3">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="h-20 w-20 rounded object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-primary font-semibold">৳{Number(item.product.price || 0).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit lg:sticky lg:top-20">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">{t("অর্ডার সারসংক্ষেপ", "Order Summary")}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("সাবটোটাল", "Subtotal")}</span>
                  <span className="font-medium">৳{subtotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("ডেলিভারি চার্জ চেকআউটে যোগ হবে", "Delivery fee added at checkout")}
                </p>
                <Button className="w-full gap-2" onClick={() => navigate("/checkout")}>
                  {t("চেকআউট", "Checkout")} <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
