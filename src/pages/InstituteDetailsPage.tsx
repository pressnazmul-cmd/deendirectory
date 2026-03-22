import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { GraduationCap, MapPin, Phone, ArrowLeft, Map, Clock } from "lucide-react";
import PrayerTimeModal from "@/components/PrayerTimeModal";

const InstituteDetailsPage = () => {
  const { id } = useParams();
  const [prayerOpen, setPrayerOpen] = useState(false);

  const { data: institute, isLoading } = useQuery({
    queryKey: ["institute", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutes")
        .select("*, villages(village_name, unions(union_name, upazilas(upazila_name, districts(district_name, divisions(division_name)))))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const village = institute?.villages as any;
  const fullAddress = village
    ? [village.village_name, village.unions?.union_name, village.unions?.upazilas?.upazila_name, village.unions?.upazilas?.districts?.district_name, village.unions?.upazilas?.districts?.divisions?.division_name].filter(Boolean).join(", ")
    : institute?.address;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <Breadcrumbs items={[{ label: "Institutes", to: "/institutes" }, { label: institute?.name || "Details" }]} />

        <Link to="/institutes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !institute ? (
          <p className="text-muted-foreground">Institute not found.</p>
        ) : (
          <div className="mt-4 rounded-xl border bg-card p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-card-foreground">{institute.name}</h1>
                <span className="text-sm text-muted-foreground">{institute.type}</span>
              </div>
            </div>

            <div className="space-y-3">
              {fullAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-card-foreground">{fullAddress}</span>
                </div>
              )}
              {institute.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-card-foreground">{institute.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {institute.phone && (
                <a href={`tel:${institute.phone}`}>
                  <Button className="gap-2">
                    <Phone className="h-4 w-4" /> Call Now
                  </Button>
                </a>
              )}
              <Button variant="outline" className="gap-2" disabled>
                <Map className="h-4 w-4" /> View on Map
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setPrayerOpen(true)}>
                <Clock className="h-4 w-4" /> Prayer Time
              </Button>
            </div>

            {/* Map placeholder */}
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-secondary text-sm text-muted-foreground">
              Map location placeholder
            </div>
          </div>
        )}
      </main>
      <Footer />

      {institute && (
        <PrayerTimeModal
          open={prayerOpen}
          onOpenChange={setPrayerOpen}
          instituteName={institute.name}
          address={fullAddress || institute.address}
        />
      )}
    </div>
  );
};

export default InstituteDetailsPage;
