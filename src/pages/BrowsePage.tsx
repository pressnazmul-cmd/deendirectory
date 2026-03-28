import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationCard from "@/components/LocationCard";
import Breadcrumbs from "@/components/Breadcrumbs";

const BrowsePage = () => {
  const { divisionId, districtId, upazilaId, unionId } = useParams();
  const { t } = useLanguage();

  const { data: divisions } = useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("divisions").select("*").order("division_name");
      if (error) throw error;
      return data;
    },
    enabled: !divisionId,
  });

  const { data: districts } = useQuery({
    queryKey: ["districts", divisionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("districts").select("*").eq("division_id", divisionId!).order("district_name");
      if (error) throw error;
      return data;
    },
    enabled: !!divisionId && !districtId,
  });

  const { data: upazilas } = useQuery({
    queryKey: ["upazilas", districtId],
    queryFn: async () => {
      const { data, error } = await supabase.from("upazilas").select("*").eq("district_id", districtId!).order("upazila_name");
      if (error) throw error;
      return data;
    },
    enabled: !!districtId && !upazilaId,
  });

  const { data: unions } = useQuery({
    queryKey: ["unions", upazilaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("unions").select("*").eq("upazila_id", upazilaId!).order("union_name");
      if (error) throw error;
      return data;
    },
    enabled: !!upazilaId && !unionId,
  });

  const { data: villages } = useQuery({
    queryKey: ["villages", unionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("villages").select("*").eq("union_id", unionId!).order("village_name");
      if (error) throw error;
      return data;
    },
    enabled: !!unionId,
  });

  const { data: divisionName } = useQuery({
    queryKey: ["division-name", divisionId],
    queryFn: async () => {
      const { data } = await supabase.from("divisions").select("division_name").eq("id", divisionId!).single();
      return data?.division_name || "";
    },
    enabled: !!divisionId,
  });
  const { data: districtName } = useQuery({
    queryKey: ["district-name", districtId],
    queryFn: async () => {
      const { data } = await supabase.from("districts").select("district_name").eq("id", districtId!).single();
      return data?.district_name || "";
    },
    enabled: !!districtId,
  });
  const { data: upazilaName } = useQuery({
    queryKey: ["upazila-name", upazilaId],
    queryFn: async () => {
      const { data } = await supabase.from("upazilas").select("upazila_name").eq("id", upazilaId!).single();
      return data?.upazila_name || "";
    },
    enabled: !!upazilaId,
  });
  const { data: unionName } = useQuery({
    queryKey: ["union-name", unionId],
    queryFn: async () => {
      const { data } = await supabase.from("unions").select("union_name").eq("id", unionId!).single();
      return data?.union_name || "";
    },
    enabled: !!unionId,
  });

  const crumbs: { label: string; to?: string }[] = [{ label: t("ব্রাউজ", "Browse"), to: "/browse" }];
  if (divisionId && divisionName) crumbs.push({ label: divisionName, to: `/browse/${divisionId}` });
  if (districtId && districtName) crumbs.push({ label: districtName, to: `/browse/${divisionId}/${districtId}` });
  if (upazilaId && upazilaName) crumbs.push({ label: upazilaName, to: `/browse/${divisionId}/${districtId}/${upazilaId}` });
  if (unionId && unionName) crumbs.push({ label: unionName });

  let title = t("একটি বিভাগ নির্বাচন করুন", "Select a Division");
  let items: { name: string; to: string }[] = [];

  if (unionId && villages) {
    title = t(`${unionName || "ইউনিয়ন"}-এর গ্রামসমূহ`, `Villages in ${unionName || "Union"}`);
    items = villages.map((v) => ({ name: v.village_name, to: `/institutes?village=${v.id}` }));
  } else if (upazilaId && unions) {
    title = t(`${upazilaName || "উপজেলা"}-এর ইউনিয়নসমূহ`, `Unions in ${upazilaName || "Upazila"}`);
    items = unions.map((u) => ({ name: u.union_name, to: `/browse/${divisionId}/${districtId}/${upazilaId}/${u.id}` }));
  } else if (districtId && upazilas) {
    title = t(`${districtName || "জেলা"}-এর উপজেলাসমূহ`, `Upazilas in ${districtName || "District"}`);
    items = upazilas.map((u) => ({ name: u.upazila_name, to: `/browse/${divisionId}/${districtId}/${u.id}` }));
  } else if (divisionId && districts) {
    title = t(`${divisionName || "বিভাগ"}-এর জেলাসমূহ`, `Districts in ${divisionName || "Division"}`);
    items = districts.map((d) => ({ name: d.district_name, to: `/browse/${divisionId}/${d.id}` }));
  } else if (divisions) {
    title = t("একটি বিভাগ নির্বাচন করুন", "Select a Division");
    items = divisions.map((d) => ({ name: d.division_name, to: `/browse/${d.id}` }));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="mb-6 font-display text-2xl font-bold">{title}</h1>
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t("কোন ডেটা পাওয়া যায়নি। অ্যাডমিন প্যানেল থেকে যোগ করুন।", "No data found. Add some from the Admin panel.")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <LocationCard key={item.to} name={item.name} to={item.to} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BrowsePage;
