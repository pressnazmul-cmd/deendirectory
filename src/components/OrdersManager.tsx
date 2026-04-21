import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/20 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const OrdersManager = () => {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Updated"); },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      const { error } = await supabase.from("orders").update({ payment_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Updated"); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">All Orders ({orders?.length || 0})</h3>
      {orders?.map((o: any) => (
        <Card key={o.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="text-sm">
                <p className="font-semibold">#{o.id.slice(0, 8)} · ৳{Number(o.total).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method.toUpperCase()}</p>
              </div>
              <Badge className={statusColors[o.status]}>{o.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>👤 {o.buyer_name} · {o.buyer_phone}</p>
              <p>📍 {o.delivery_address}</p>
              {o.transaction_id && <p>TrxID: {o.transaction_id}</p>}
            </div>
            <div className="text-sm space-y-0.5 border-t pt-2">
              {o.order_items?.map((it: any) => (
                <div key={it.id} className="flex justify-between"><span>{it.product_name} × {it.quantity}</span><span>৳{(Number(it.product_price) * it.quantity).toLocaleString()}</span></div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={o.payment_status} onValueChange={(v) => updatePayment.mutate({ id: o.id, payment_status: v })}>
                <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Payment Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => confirm("Delete order?") && remove.mutate(o.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {!orders?.length && <p className="text-muted-foreground text-sm">No orders yet</p>}
    </div>
  );
};

export default OrdersManager;
