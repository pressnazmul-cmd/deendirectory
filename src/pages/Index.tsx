import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, GraduationCap, Building2, Map, Landmark, Home, TreePine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const useAnimatedCount = (target: number, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!target || animated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  useEffect(() => {
    animated.current = false;
    setCount(0);
  }, []);

  return { count, ref };
};

const StatCard = ({ icon: Icon, label, value, delay }: { icon: any; label: string; value: number; delay: number }) => {
  const { count, ref } = useAnimatedCount(value);
  return (
    <div
      ref={ref}
      className="rounded-xl border bg-card p-5 text-center card-elevated animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
      <p className="font-display text-3xl font-bold text-primary">{count || "—"}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

const Index = () => {
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  const { data: searchResults } = useQuery({
    queryKey: ["global-search", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const term = `%${search}%`;
      const [institutes, divisions, districts, upazilas, unions, villages] = await Promise.all([
        supabase.from("institutes").select("id, name, type").ilike("name", term).limit(5),
        supabase.from("divisions").select("id, division_name").ilike("division_name", term).limit(3),
        supabase.from("districts").select("id, district_name").ilike("district_name", term).limit(3),
        supabase.from("upazilas").select("id, upazila_name").ilike("upazila_name", term).limit(3),
        supabase.from("unions").select("id, union_name").ilike("union_name", term).limit(3),
        supabase.from("villages").select("id, village_name").ilike("village_name", term).limit(3),
      ]);

      type SearchItem = { id: string; label: string; type: string; to: string };
      const results: SearchItem[] = [];

      divisions.data?.forEach((d) =>
        results.push({ id: d.id, label: d.division_name, type: "Division", to: `/browse/${d.id}` })
      );
      districts.data?.forEach((d) =>
        results.push({ id: d.id, label: d.district_name, type: "District", to: `/browse/district/${d.id}` })
      );
      upazilas.data?.forEach((d) =>
        results.push({ id: d.id, label: d.upazila_name, type: "Upazila", to: `/browse/upazila/${d.id}` })
      );
      unions.data?.forEach((d) =>
        results.push({ id: d.id, label: d.union_name, type: "Union", to: `/browse/union/${d.id}` })
      );
      villages.data?.forEach((d) =>
        results.push({ id: d.id, label: d.village_name, type: "Village", to: `/browse/village/${d.id}` })
      );
      institutes.data?.forEach((d) =>
        results.push({ id: d.id, label: d.name, type: d.type, to: `/institutes/${d.id}` })
      );

      return results;
    },
    enabled: search.trim().length > 1,
  });

  const { data: stats } = useQuery({
    queryKey: ["all-stats"],
    queryFn: async () => {
      const [divs, dists, upzs, uns, vils, insts] = await Promise.all([
        supabase.from("divisions").select("id", { count: "exact", head: true }),
        supabase.from("districts").select("id", { count: "exact", head: true }),
        supabase.from("upazilas").select("id", { count: "exact", head: true }),
        supabase.from("unions").select("id", { count: "exact", head: true }),
        supabase.from("villages").select("id", { count: "exact", head: true }),
        supabase.from("institutes").select("id", { count: "exact", head: true }),
      ]);
      return {
        divisions: divs.count || 0,
        districts: dists.count || 0,
        upazilas: upzs.count || 0,
        unions: uns.count || 0,
        villages: vils.count || 0,
        institutes: insts.count || 0,
      };
    },
  });

  const iconForType = (type: string) => {
    switch (type) {
      case "Division": return <Map className="h-4 w-4 text-primary" />;
      case "District": return <Landmark className="h-4 w-4 text-primary" />;
      case "Upazila": return <MapPin className="h-4 w-4 text-primary" />;
      case "Union": return <Home className="h-4 w-4 text-primary" />;
      case "Village": return <TreePine className="h-4 w-4 text-primary" />;
      default: return <GraduationCap className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="hero-gradient py-20">
        <div className="container text-center">
          <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight text-primary-foreground md:text-5xl">
            deendirectory
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-primary-foreground/80">
            {t(
              "বাংলাদেশের শিক্ষা প্রতিষ্ঠান খুঁজুন — নাম দিয়ে সার্চ করুন অথবা লোকেশন ব্রাউজ করুন।",
              "Find educational institutes across Bangladesh — search by name or browse by location."
            )}
          </p>

          {/* Search */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t(
                "প্রতিষ্ঠান, বিভাগ, জেলা, উপজেলা খুঁজুন...",
                "Search institutes, divisions, districts, upazilas..."
              )}
              className="h-12 rounded-xl border-none bg-card pl-10 shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Search results dropdown */}
          {searchResults && searchResults.length > 0 && (
            <div className="mx-auto mt-2 max-w-xl rounded-xl border bg-card p-3 shadow-lg text-left">
              {searchResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.to}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-card-foreground hover:bg-secondary"
                  onClick={() => setSearch("")}
                >
                  {iconForType(item.type)}
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {item.type}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/browse">
              <Button size="lg" variant="secondary" className="gap-2 rounded-xl shadow-md">
                <MapPin className="h-4 w-4" /> {t("লোকেশন ব্রাউজ করুন", "Browse by Location")}
              </Button>
            </Link>
            <Link to="/institutes">
              <Button size="lg" variant="secondary" className="gap-2 rounded-xl shadow-md">
                <Building2 className="h-4 w-4" /> {t("সকল প্রতিষ্ঠান দেখুন", "View All Institutes")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-12">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Map} label={t("বিভাগ", "Divisions")} value={stats?.divisions ?? 0} delay={0} />
          <StatCard icon={Landmark} label={t("জেলা", "Districts")} value={stats?.districts ?? 0} delay={100} />
          <StatCard icon={MapPin} label={t("উপজেলা", "Upazilas")} value={stats?.upazilas ?? 0} delay={200} />
          <StatCard icon={Home} label={t("ইউনিয়ন", "Unions")} value={stats?.unions ?? 0} delay={300} />
          <StatCard icon={TreePine} label={t("গ্রাম", "Villages")} value={stats?.villages ?? 0} delay={400} />
          <StatCard icon={GraduationCap} label={t("প্রতিষ্ঠান", "Institutes")} value={stats?.institutes ?? 0} delay={500} />
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default Index;
