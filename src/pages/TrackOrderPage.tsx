import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { key: "pending", labelBn: "অপেক্ষমাণ", labelEn: "Pending", icon: Clock },
  { key: "confirmed", labelBn: "নিশ্চিত", labelEn: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", labelBn: "শিপড", labelEn: "Shipped", icon: Truck },
  { key: "delivered", labelBn: "ডেলিভার্ড", labelEn: "Delivered", icon: Package },
];

const TrackOrderPage = () => {
  const { t } = useLanguage();
  const { orderId: paramId } = useParams();
  const [orderId, setOrderId] = useState(paramId || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const search = async (id?: string, ph?: string) => {
    const useId = (id ?? orderId).trim();
    const usePhone = (ph ?? phone).trim();
    if (!useId) { toast.error(t("অর্ডার ID দিন", "Please enter Order ID")); return; }
    setLoading(true);
    setOrder(null); setItems([]);
    try {
      let query = supabase.from("orders").select("*").eq("id", useId);
      if (usePhone) query = query.eq("buyer_phone", usePhone);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) { toast.error(t("অর্ডার পাওয়া যায়নি", "Order not found")); return; }
      setOrder(data);
      const { data: it } = await supabase.from("order_items").select("*").eq("order_id", useId);
      setItems(it || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) search(paramId, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  const currentStageIndex = order ? STAGES.findIndex(s => s.key === order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">{t("অর্ডার ট্র্যাকিং", "Order Tracking")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("আপনার অর্ডারের বর্তমান অবস্থা জানতে নিচের তথ্য দিন", "Enter your details to check your order status")}</p>

        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>{t("অর্ডার ID", "Order ID")} *</Label>
              <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-..." />
            </div>
            <div className="space-y-1.5">
              <Label>{t("মোবাইল নম্বর (ঐচ্ছিক)", "Phone Number (optional)")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
            </div>
            <Button onClick={() => search()} disabled={loading} className="w-full gap-2">
              <Search className="h-4 w-4" /> {loading ? t("খোঁজা হচ্ছে...", "Searching...") : t("ট্র্যাক করুন", "Track Order")}
            </Button>
          </CardContent>
        </Card>

        {order && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("অর্ডার ID", "Order ID")}</p>
                  <p className="font-mono text-xs">{order.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={isCancelled ? "destructive" : "default"} className="capitalize">
                  {order.status}
                </Badge>
              </div>

              {!isCancelled ? (
                <div className="relative pt-2">
                  <div className="flex justify-between">
                    {STAGES.map((stage, idx) => {
                      const Icon = stage.icon;
                      const reached = idx <= currentStageIndex;
                      return (
                        <div key={stage.key} className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 ${reached ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted text-muted-foreground"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`text-[11px] text-center ${reached ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {t(stage.labelBn, stage.labelEn)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-muted -z-0">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{t("এই অর্ডারটি বাতিল করা হয়েছে", "This order has been cancelled")}</span>
                </div>
              )}

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="grid sm:grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">{t("নাম", "Name")}: </span>{order.buyer_name}</div>
                  <div><span className="text-muted-foreground">{t("ফোন", "Phone")}: </span>{order.buyer_phone}</div>
                  {order.buyer_email && <div><span className="text-muted-foreground">Email: </span>{order.buyer_email}</div>}
                  {order.buyer_whatsapp && <div><span className="text-muted-foreground">WhatsApp: </span>{order.buyer_whatsapp}</div>}
                </div>
                <div><span className="text-muted-foreground">{t("ঠিকানা", "Address")}: </span>{order.delivery_address}</div>
                <div><span className="text-muted-foreground">{t("পেমেন্ট", "Payment")}: </span>{order.payment_method.toUpperCase()} ({order.payment_status})</div>
              </div>

              {items.length > 0 && (
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm mb-2">{t("পণ্যসমূহ", "Items")}</p>
                  <div className="space-y-1 text-sm">
                    {items.map(it => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.product_name} × {it.quantity}</span>
                        <span>৳{(Number(it.product_price) * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between font-bold">
                <span>{t("মোট", "Total")}</span>
                <span className="text-primary">৳{Number(order.total).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrderPage;
