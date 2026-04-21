import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/20 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const OrdersPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();

  const { data: buyerOrders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("*, order_items(*)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: sellerOrders } = useQuery({
    queryKey: ["seller-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("*, order_items(*)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["seller-orders"] });
    qc.invalidateQueries({ queryKey: ["my-orders"] });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-12 text-center">
          <p className="mb-4">{t("অর্ডার দেখতে সাইন ইন করুন", "Sign in to view orders")}</p>
          <Link to="/auth"><Button>{t("সাইন ইন", "Sign In")}</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const renderOrder = (o: any, isSeller: boolean) => (
    <Card key={o.id}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</p>
            <p className="font-semibold mt-0.5">৳{Number(o.total).toLocaleString()} · {o.payment_method.toUpperCase()}</p>
          </div>
          <Badge className={statusColors[o.status]}>{o.status}</Badge>
        </div>
        <div className="space-y-1 text-sm">
          {o.order_items?.map((it: any) => (
            <div key={it.id} className="flex justify-between gap-2">
              <span className="truncate">{it.product_name} × {it.quantity}</span>
              <span>৳{(Number(it.product_price) * it.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
          <p>📍 {o.buyer_name} · {o.buyer_phone}</p>
          <p>{o.delivery_address}</p>
          <p>{o.delivery_area === "inside_dhaka" ? t("ঢাকার ভিতরে", "Inside Dhaka") : t("ঢাকার বাইরে", "Outside Dhaka")} · {t("ডেলিভারি", "Delivery")}: ৳{o.delivery_fee}</p>
          {o.transaction_id && <p>TrxID: {o.transaction_id}</p>}
        </div>
        {isSeller && o.status !== "delivered" && o.status !== "cancelled" && (
          <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-6 max-w-4xl space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />{t("আমার অর্ডার", "My Orders")} ({buyerOrders?.length || 0})
          </h2>
          {!buyerOrders?.length ? (
            <p className="text-muted-foreground text-sm">{t("কোনো অর্ডার নেই", "No orders yet")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">{buyerOrders.map((o) => renderOrder(o, false))}</div>
          )}
        </section>

        {!!sellerOrders?.length && (
          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />{t("আমার বিক্রি", "Sales")} ({sellerOrders.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">{sellerOrders.map((o) => renderOrder(o, true))}</div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
