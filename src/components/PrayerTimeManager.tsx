import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

const prayerNames = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const prayerLabels: Record<string, string> = {
  fajr: "🌙 Fajr",
  dhuhr: "☀️ Dhuhr",
  asr: "🌤️ Asr",
  maghrib: "🌅 Maghrib",
  isha: "🌑 Isha",
};

const PrayerTimeManager = () => {
  const qc = useQueryClient();
  const [selectedInstId, setSelectedInstId] = useState("");
  const [form, setForm] = useState({ fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "" });

  const { data: mosques } = useQuery({
    queryKey: ["admin-mosques"],
    queryFn: async () => {
      const { data } = await supabase
        .from("institutes")
        .select("id, name, villages(village_name)")
        .eq("type", "Mosque")
        .order("name");
      return data || [];
    },
  });

  const { data: existingTimes } = useQuery({
    queryKey: ["prayer-times", selectedInstId],
    queryFn: async () => {
      if (!selectedInstId) return null;
      const { data } = await supabase
        .from("prayer_times")
        .select("*")
        .eq("institute_id", selectedInstId)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedInstId,
  });

  useEffect(() => {
    if (existingTimes) {
      setForm({
        fajr: existingTimes.fajr || "",
        dhuhr: existingTimes.dhuhr || "",
        asr: existingTimes.asr || "",
        maghrib: existingTimes.maghrib || "",
        isha: existingTimes.isha || "",
      });
    } else {
      setForm({ fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "" });
    }
  }, [existingTimes, selectedInstId]);

  const savePrayerTimes = useMutation({
    mutationFn: async () => {
      if (!selectedInstId) throw new Error("Select a mosque first");
      const payload = { institute_id: selectedInstId, ...form };
      if (existingTimes) {
        const { error } = await supabase.from("prayer_times").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", existingTimes.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prayer_times").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prayer-times", selectedInstId] });
      toast.success("Prayer times saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Prayer Time Management</h3>
      </div>

      <div>
        <Label>Select Mosque</Label>
        <Select value={selectedInstId} onValueChange={setSelectedInstId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a mosque..." />
          </SelectTrigger>
          <SelectContent>
            {mosques?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} — {(m.villages as any)?.village_name || ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedInstId && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Set prayer times in 24h format (e.g. 04:30)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prayerNames.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Label className="w-28 shrink-0 text-sm">{prayerLabels[name]}</Label>
                <Input
                  type="time"
                  value={form[name]}
                  onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <Button onClick={() => savePrayerTimes.mutate()} className="gap-2 mt-2">
            <Save className="h-4 w-4" />
            {existingTimes ? "Update" : "Save"}
          </Button>
        </div>
      )}

      {!mosques?.length && (
        <p className="text-sm text-muted-foreground">No mosques found. Add a Mosque-type institute first.</p>
      )}
    </div>
  );
};

export default PrayerTimeManager;
