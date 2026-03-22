import { useState } from "react";
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
  const [times, setTimes] = useState({ fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "" });

  // Fetch only Mosque-type institutes
  const { data: mosques } = useQuery({
    queryKey: ["admin-mosques"],
    queryFn: async () => {
      const { data } = await supabase
        .from("institutes")
        .select("id, name, address, villages(village_name)")
        .eq("type", "Mosque")
        .order("name");
      return data || [];
    },
  });

  // Fetch existing prayer times for selected mosque
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

  // When mosque changes, load existing times
  const handleMosqueChange = (id: string) => {
    setSelectedInstId(id);
  };

  // Sync form when existingTimes loads
  const currentTimes = existingTimes
    ? { fajr: existingTimes.fajr, dhuhr: existingTimes.dhuhr, asr: existingTimes.asr, maghrib: existingTimes.maghrib, isha: existingTimes.isha }
    : times;

  const savePrayerTimes = useMutation({
    mutationFn: async () => {
      if (!selectedInstId) throw new Error("Select a mosque first");
      const payload = {
        institute_id: selectedInstId,
        fajr: currentTimes.fajr || times.fajr,
        dhuhr: currentTimes.dhuhr || times.dhuhr,
        asr: currentTimes.asr || times.asr,
        maghrib: currentTimes.maghrib || times.maghrib,
        isha: currentTimes.isha || times.isha,
      };

      if (existingTimes) {
        const { error } = await supabase.from("prayer_times").update({
          ...payload,
          updated_at: new Date().toISOString(),
        }).eq("id", existingTimes.id);
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

  // We need local state that syncs with existingTimes
  const [localTimes, setLocalTimes] = useState({ fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "" });

  // Update local state when existingTimes changes
  const displayTimes = existingTimes
    ? { fajr: existingTimes.fajr, dhuhr: existingTimes.dhuhr, asr: existingTimes.asr, maghrib: existingTimes.maghrib, isha: existingTimes.isha }
    : localTimes;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Prayer Time Management</h3>
      </div>

      <div>
        <Label>Select Mosque</Label>
        <Select value={selectedInstId} onValueChange={(val) => {
          handleMosqueChange(val);
          setLocalTimes({ fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "" });
        }}>
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
          <p className="text-sm text-muted-foreground">
            Set prayer times in 24-hour format (e.g. 04:30, 12:15, 18:45)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prayerNames.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Label className="w-28 shrink-0 text-sm">{prayerLabels[name]}</Label>
                <Input
                  type="time"
                  value={displayTimes[name]}
                  onChange={(e) => {
                    if (existingTimes) {
                      // Directly update via invalidation after save
                      // For now update local override
                    }
                    setLocalTimes((prev) => ({ ...prev, [name]: e.target.value }));
                  }}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <Button
            onClick={() => {
              // merge localTimes with existingTimes for save
              savePrayerTimes.mutate();
            }}
            className="gap-2 mt-2"
          >
            <Save className="h-4 w-4" />
            {existingTimes ? "Update Times" : "Save Times"}
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
