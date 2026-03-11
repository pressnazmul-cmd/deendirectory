import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, GraduationCap, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import InstituteCard from "@/components/InstituteCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Index = () => {
  const [search, setSearch] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["search-institutes", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data, error } = await supabase
        .from("institutes")
        .select("*")
        .ilike("name", `%${search}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: search.trim().length > 1,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [divs, insts] = await Promise.all([
        supabase.from("divisions").select("id", { count: "exact", head: true }),
        supabase.from("institutes").select("id", { count: "exact", head: true }),
      ]);
      return { divisions: divs.count || 0, institutes: insts.count || 0 };
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="hero-gradient py-20">
        <div className="container text-center">
          <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight text-primary-foreground md:text-5xl">
            BD Education Directory
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-primary-foreground/80">
            Find educational institutes across Bangladesh — search by name or browse by location.
          </p>

          {/* Search */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search institutes by name..."
              className="h-12 rounded-xl border-none bg-card pl-10 shadow-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Search results dropdown */}
          {searchResults && searchResults.length > 0 && (
            <div className="mx-auto mt-2 max-w-xl rounded-xl border bg-card p-3 shadow-lg text-left">
              {searchResults.map((inst) => (
                <Link
                  key={inst.id}
                  to={`/institutes/${inst.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-card-foreground hover:bg-secondary"
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>{inst.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{inst.type}</span>
                </Link>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/browse">
              <Button size="lg" variant="secondary" className="gap-2 rounded-xl shadow-md">
                <MapPin className="h-4 w-4" /> Browse by Location
              </Button>
            </Link>
            <Link to="/institutes">
              <Button size="lg" variant="secondary" className="gap-2 rounded-xl shadow-md">
                <Building2 className="h-4 w-4" /> View All Institutes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 text-center card-elevated">
            <p className="font-display text-3xl font-bold text-primary">{stats?.divisions ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Divisions</p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center card-elevated">
            <p className="font-display text-3xl font-bold text-primary">{stats?.institutes ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Institutes</p>
          </div>
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default Index;
