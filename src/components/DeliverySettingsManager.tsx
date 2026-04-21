import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DeliverySettingsManager = () => {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["delivery-settings-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("delivery_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const [inside, setInside] = useState("");
  const [outside, setOutside] = useState("");
  const [bkash, setBkash] = useState("");
  const [nagad, setNagad] = useState("");

  useEffect(() => {
    if (data) {
      setInside(String(data.inside_dhaka_fee));
      setOutside(String(data.outside_dhaka_fee));
      setBkash(data.bkash_number || "");
      setNagad(data.nagad_number || "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("delivery_settings").update({
        inside_dhaka_fee: parseFloat(inside) || 0,
        outside_dhaka_fee: parseFloat(outside) || 0,
        bkash_number: bkash.trim(),
        nagad_number: nagad.trim(),
      }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery-settings"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold">Delivery & Payment Settings</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Inside Dhaka Fee (৳)</Label>
            <Input type="number" value={inside} onChange={(e) => setInside(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Outside Dhaka Fee (৳)</Label>
            <Input type="number" value={outside} onChange={(e) => setOutside(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>bKash Number</Label>
            <Input value={bkash} onChange={(e) => setBkash(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Nagad Number</Label>
            <Input value={nagad} onChange={(e) => setNagad(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Settings</Button>
      </CardContent>
    </Card>
  );
};

export default DeliverySettingsManager;
