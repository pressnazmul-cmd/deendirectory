import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface PrayerTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instituteName: string;
  address: string | null;
}

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const prayerIcons: Record<string, string> = {
  Fajr: "🌙",
  Dhuhr: "☀️",
  Asr: "🌤️",
  Maghrib: "🌅",
  Isha: "🌑",
};

const PrayerTimeModal = ({ open, onOpenChange, instituteName, address }: PrayerTimeModalProps) => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setDateStr(now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));

    const fetchPrayerTimes = async () => {
      setLoading(true);
      try {
        // Using Aladhan API for Dhaka, Bangladesh (default)
        const d = now;
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}?city=Dhaka&country=Bangladesh&method=1`
        );
        const json = await res.json();
        if (json.data?.timings) {
          const t = json.data.timings;
          setTimes({
            Fajr: t.Fajr,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
          });
        }
      } catch {
        // Fallback static times
        setTimes({ Fajr: "04:20", Dhuhr: "12:06", Asr: "15:38", Maghrib: "18:23", Isha: "19:45" });
      } finally {
        setLoading(false);
      }
    };
    fetchPrayerTimes();
  }, [open]);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return { time: `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`, ampm };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 px-5 pt-5 pb-4 text-white">
          <div className="flex items-start justify-between">
            <DialogHeader className="space-y-0.5">
              <DialogTitle className="text-lg font-bold text-white leading-tight">
                PRAYER TIMES
              </DialogTitle>
            </DialogHeader>
            <div className="text-right text-xs text-zinc-300">
              <p className="font-medium">{instituteName}</p>
              <p>{dateStr}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Body */}
        <div className="px-4 py-3 space-y-2">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading prayer times...</p>
          ) : times ? (
            Object.entries(times).map(([name, time]) => {
              const { time: formatted, ampm } = formatTime(time);
              return (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 text-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{prayerIcons[name]}</span>
                    <span className="text-base font-bold tracking-wide uppercase">{name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{formatted}</span>
                    <span className="text-xs text-zinc-400">{ampm}</span>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>

        <Separator />

        {/* Footer */}
        {address && (
          <div className="px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{address}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrayerTimeModal;
