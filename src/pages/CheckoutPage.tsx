import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle2, ShoppingBag } from "lucide-react";

type PaymentMethod = "cod" | "bkash" | "nagad";
type DeliveryArea = "inside_dhaka" | "outside_dhaka";

const CheckoutPage = () => {
  const { user, profile } = useAuth();
  const { items, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+88");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<DeliveryArea>("inside_dhaka");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [txnId, setTxnId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      if (profile.mobile) {
        const digits = profile.mobile.replace(/\D/g, "").replace(/^88/, "");
        setPhone("+88" + digits);
      }
    }
  }, [profile]);

  // Phone input handler — always keep +88 prefix, only digits after
  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("88")) digits = digits.slice(2);
    setPhone("+88" + digits);
  };

  const handleWhatsappChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("88")) digits = digits.slice(2);
    setWhatsapp(digits ? "+88" + digits : "");
  };

  const { data: settings } = useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("delivery_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const deliveryFee = useMemo(() => {
    if (!settings) return area === "inside_dhaka" ? 60 : 120;
    return area === "inside_dhaka" ? Number(settings.inside_dhaka_fee) : Number(settings.outside_dhaka_fee);
  }, [area, settings]);

  // Group cart by seller
  const sellerGroups = useMemo(() => {
    const groups = new Map<string, typeof items>();
    items.forEach((item) => {
      const sid = item.product.seller_id;
      if (!groups.has(sid)) groups.set(sid, []);
      groups.get(sid)!.push(item);
    });
    return Array.from(groups.entries());
  }, [items]);

  const subtotal = items.reduce((s, i) => s + (Number(i.product.price) || 0) * i.quantity, 0);
  const totalDeliveryFee = deliveryFee * sellerGroups.length;
  const grandTotal = subtotal + totalDeliveryFee;

  const placeOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error(t("সব তথ্য পূরণ করুন", "Please fill all required fields")); return;
    }
    if ((payment === "bkash" || payment === "nagad") && !txnId.trim()) {
      toast.error(t("ট্রানজেকশন ID দিন", "Please enter transaction ID")); return;
    }
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    setSubmitting(true);
    try {
      for (const [sellerId, sellerItems] of sellerGroups) {
        const sub = sellerItems.reduce((s, i) => s + (Number(i.product.price) || 0) * i.quantity, 0);
        const total = sub + deliveryFee;
        const orderId = crypto.randomUUID();

        const { error: orderErr } = await supabase.from("orders").insert({
          id: orderId,
          buyer_id: user?.id ?? null,
          seller_id: sellerId,
          buyer_name: name.trim(),
          buyer_phone: phone.trim(),
          delivery_address: address.trim(),
          delivery_area: area,
          delivery_fee: deliveryFee,
          subtotal: sub,
          total,
          payment_method: payment,
          payment_status: payment === "cod" ? "pending" : "pending",
          transaction_id: txnId.trim() || null,
          notes: notes.trim() || null,
          status: "pending",
        });

        if (orderErr) throw orderErr;

        const orderItemsPayload = sellerItems.map((i) => ({
          order_id: orderId,
          product_id: i.product_id,
          product_name: i.product.name,
          product_price: Number(i.product.price) || 0,
          quantity: i.quantity,
        }));
        const { error: itemsErr } = await supabase.from("order_items").insert(orderItemsPayload);
        if (itemsErr) throw itemsErr;
      }

      await clearCart();
      toast.success(t("অর্ডার সফলভাবে সম্পন্ন হয়েছে!", "Order placed successfully!"));
      navigate(user ? "/orders" : "/products");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="mb-4">{t("কার্ট খালি", "Your cart is empty")}</p>
          <Link to="/products"><Button>{t("পণ্য ব্রাউজ করুন", "Browse Products")}</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">{t("চেকআউট", "Checkout")}</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">{t("ডেলিভারি ঠিকানা", "Delivery Address")}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("নাম", "Full Name")} *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("মোবাইল", "Phone")} *</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("সম্পূর্ণ ঠিকানা", "Full Address")} *</Label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder={t("বাড়ি/রাস্তা/এলাকা/থানা/জেলা", "House/Road/Area/Thana/District")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("ডেলিভারি এলাকা", "Delivery Area")}</Label>
                  <RadioGroup value={area} onValueChange={(v) => setArea(v as DeliveryArea)} className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="inside_dhaka" />
                      <span className="text-sm">{t("ঢাকার ভিতরে", "Inside Dhaka")} (৳{settings?.inside_dhaka_fee || 60})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="outside_dhaka" />
                      <span className="text-sm">{t("ঢাকার বাইরে", "Outside Dhaka")} (৳{settings?.outside_dhaka_fee || 120})</span>
                    </label>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">{t("পেমেন্ট পদ্ধতি", "Payment Method")}</h3>
                <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)} className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="cod" className="mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{t("ক্যাশ অন ডেলিভারি", "Cash on Delivery")}</p>
                      <p className="text-xs text-muted-foreground">{t("পণ্য পেয়ে টাকা পরিশোধ করুন", "Pay when you receive the product")}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="bkash" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">bKash</p>
                      {settings?.bkash_number && <p className="text-xs text-muted-foreground">Send Money: {settings.bkash_number}</p>}
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="nagad" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Nagad</p>
                      {settings?.nagad_number && <p className="text-xs text-muted-foreground">Send Money: {settings.nagad_number}</p>}
                    </div>
                  </label>
                </RadioGroup>
                {(payment === "bkash" || payment === "nagad") && (
                  <div className="space-y-1.5 pt-2">
                    <Label>{t("ট্রানজেকশন ID", "Transaction ID")} *</Label>
                    <Input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="TrxID" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>{t("নোট (ঐচ্ছিক)", "Notes (optional)")}</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit lg:sticky lg:top-20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">{t("অর্ডার সারসংক্ষেপ", "Order Summary")}</h3>
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-2">
                    <span className="truncate">{i.product.name} × {i.quantity}</span>
                    <span className="font-medium whitespace-nowrap">৳{(Number(i.product.price || 0) * i.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("সাবটোটাল", "Subtotal")}</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("ডেলিভারি", "Delivery")} ({sellerGroups.length} {t("বিক্রেতা", "seller")}{sellerGroups.length > 1 ? "s" : ""})</span>
                  <span>৳{totalDeliveryFee.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>{t("মোট", "Total")}</span><span className="text-primary">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full gap-2" onClick={placeOrder} disabled={submitting}>
                <CheckCircle2 className="h-4 w-4" />{submitting ? t("প্রসেসিং...", "Processing...") : t("অর্ডার নিশ্চিত করুন", "Place Order")}
              </Button>
              {sellerGroups.length > 1 && (
                <p className="text-xs text-muted-foreground">{t("বিভিন্ন বিক্রেতার জন্য আলাদা অর্ডার তৈরি হবে", "Separate orders will be created per seller")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
