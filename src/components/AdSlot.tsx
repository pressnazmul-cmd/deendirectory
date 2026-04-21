import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdSlotProps {
  placement: "homepage" | "stories" | "browse";
  type?: "banner" | "card";
  className?: string;
}

const AdSlot = ({ placement, type = "banner", className = "" }: AdSlotProps) => {
  const trackedRef = useRef<Set<string>>(new Set());

  const { data: ads } = useQuery({
    queryKey: ["ads", placement, type],
    queryFn: async () => {
      const { data } = await supabase
        .from("advertisements")
        .select("*")
        .eq("is_active", true)
        .eq("ad_type", type)
        .or(`placement.eq.${placement},placement.eq.all`)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(type === "banner" ? 1 : 3);
      return data || [];
    },
  });

  useEffect(() => {
    if (!ads?.length) return;
    ads.forEach((ad) => {
      if (!trackedRef.current.has(ad.id)) {
        trackedRef.current.add(ad.id);
        supabase.rpc("increment_ad_view", { _ad_id: ad.id });
      }
    });
  }, [ads]);

  if (!ads?.length) return null;

  const handleClick = (adId: string, link?: string | null) => {
    supabase.rpc("increment_ad_click", { _ad_id: adId });
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  if (type === "banner") {
    const ad = ads[0];
    return (
      <div className={`w-full ${className}`}>
        <button
          onClick={() => handleClick(ad.id, ad.link_url)}
          className="group relative block w-full overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
          aria-label={ad.title}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="h-auto w-full object-cover"
            loading="lazy"
          />
          <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
            Ad
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {ads.map((ad) => (
        <button
          key={ad.id}
          onClick={() => handleClick(ad.id, ad.link_url)}
          className="group relative overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:shadow-md"
        >
          <img src={ad.image_url} alt={ad.title} className="h-32 w-full object-cover" loading="lazy" />
          <div className="p-3">
            <p className="text-sm font-medium text-card-foreground line-clamp-2">{ad.title}</p>
          </div>
          <span className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
            Ad
          </span>
        </button>
      ))}
    </div>
  );
};

export default AdSlot;
