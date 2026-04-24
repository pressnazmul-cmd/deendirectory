import { useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Download, FileText, Package, ShoppingBag, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/15 text-primary",
  shipped: "bg-accent text-accent-foreground",
  delivered: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

const orderStatuses = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];

const statusLabel = (status: string) => status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1);

const OrdersPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [buyerTab, setBuyerTab] = useState("all");
  const [sellerTab, setSellerTab] = useState("all");

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

  const filteredBuyerOrders = useMemo(() => (
    buyerTab === "all" ? buyerOrders || [] : (buyerOrders || []).filter((o: any) => o.status === buyerTab)
  ), [buyerOrders, buyerTab]);

  const filteredSellerOrders = useMemo(() => (
    sellerTab === "all" ? sellerOrders || [] : (sellerOrders || []).filter((o: any) => o.status === sellerTab)
  ), [sellerOrders, sellerTab]);

  const downloadInvoice = (o: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Invoice", 14, 18);
    doc.setFontSize(10);
    doc.text(`Order: #${o.id.slice(0, 8)}`, 14, 30);
    doc.text(`Date: ${new Date(o.created_at).toLocaleString()}`, 14, 36);
    doc.text(`Customer: ${o.buyer_name}`, 14, 46);
    doc.text(`Phone: ${o.buyer_phone}`, 14, 52);
    doc.text(`Address: ${o.delivery_address}`, 14, 58, { maxWidth: 180 });
    let y = 74;
    doc.text("Product", 14, y);
    doc.text("Qty", 126, y);
    doc.text("Price", 148, y);
    doc.text("Total", 176, y);
    y += 8;
    o.order_items?.forEach((it: any) => {
      const lineTotal = Number(it.product_price) * it.quantity;
      doc.text(String(it.product_name).slice(0, 48), 14, y);
      doc.text(String(it.quantity), 128, y);
      doc.text(`${Number(it.product_price).toLocaleString()}`, 148, y);
      doc.text(`${lineTotal.toLocaleString()}`, 176, y);
      y += 8;
    });
    y += 6;
    doc.text(`Subtotal: BDT ${Number(o.subtotal).toLocaleString()}`, 130, y);
    doc.text(`Delivery: BDT ${Number(o.delivery_fee).toLocaleString()}`, 130, y + 7);
    doc.setFontSize(12);
    doc.text(`Total: BDT ${Number(o.total).toLocaleString()}`, 130, y + 16);
    doc.save(`invoice-${o.id.slice(0, 8)}.pdf`);
  };

  const downloadSalesXlsx = () => {
    const rows = (sellerOrders || []).flatMap((o: any) => (o.order_items || []).map((it: any) => ({
      order_id: o.id,
      date: new Date(o.created_at).toLocaleString(),
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      customer_name: o.buyer_name,
      customer_phone: o.buyer_phone,
      address: o.delivery_address,
      product: it.product_name,
      quantity: it.quantity,
      product_price: Number(it.product_price),
      line_total: Number(it.product_price) * it.quantity,
      delivery_fee: Number(o.delivery_fee),
      order_total: Number(o.total),
    })));
    if (!rows.length) return toast.error("No sales data to download");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Sales");
    XLSX.writeFile(wb, `sales-${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  const renderStatusTabs = (value: string, onValueChange: (value: string) => void) => (
    <Tabs value={value} onValueChange={onValueChange} className="overflow-x-auto">
      <TabsList className="h-auto min-w-max flex-wrap justify-start">
        {orderStatuses.map((status) => (
          <TabsTrigger key={status} value={status}>{statusLabel(status)}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  const renderOrder = (o: any, isSeller: boolean) => (
    <Card key={o.id}>
      <CardContent className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</p>
                <p className="font-semibold mt-0.5">৳{Number(o.total).toLocaleString()} · {o.payment_method.toUpperCase()}</p>
              </div>
              <Badge className={statusColors[o.status]}>{o.status}</Badge>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {o.order_items?.map((it: any) => (
                <div key={it.id} className="grid grid-cols-[1fr_auto] gap-3">
                  <span className="truncate">{it.product_name} × {it.quantity}</span>
                  <span>৳{(Number(it.product_price) * it.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground border-t pt-2 space-y-0.5">
              <p>📍 {o.buyer_name} · {o.buyer_phone}</p>
              <p>{o.delivery_address}</p>
              <p>{o.delivery_area === "inside_dhaka" ? t("ঢাকার ভিতরে", "Inside Dhaka") : t("ঢাকার বাইরে", "Outside Dhaka")} · {t("ডেলিভারি", "Delivery")}: ৳{o.delivery_fee}</p>
              {o.transaction_id && <p>TrxID: {o.transaction_id}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {isSeller && o.status !== "delivered" && o.status !== "cancelled" && (
              <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={() => downloadInvoice(o)}>
              <FileText className="mr-2 h-4 w-4" />Invoice
            </Button>
          </div>
        </div>
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
          {renderStatusTabs(buyerTab, setBuyerTab)}
          {!buyerOrders?.length ? (
            <p className="text-muted-foreground text-sm">{t("কোনো অর্ডার নেই", "No orders yet")}</p>
          ) : (
            <div className="mt-3 space-y-3">{filteredBuyerOrders.map((o) => renderOrder(o, false))}</div>
          )}
        </section>

        {!!sellerOrders?.length && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />{t("আমার বিক্রি", "Sales")} ({sellerOrders.length})
              </h2>
              <Button variant="outline" size="sm" onClick={downloadSalesXlsx}>
                <Download className="mr-2 h-4 w-4" />Sales Excel
              </Button>
            </div>
            {renderStatusTabs(sellerTab, setSellerTab)}
            <div className="mt-3 space-y-3">{filteredSellerOrders.map((o) => renderOrder(o, true))}</div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
