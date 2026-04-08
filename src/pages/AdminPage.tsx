import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoleManagement from "@/components/RoleManagement";
import PrayerTimeManager from "@/components/PrayerTimeManager";
import StoryManager from "@/components/StoryManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, LayoutDashboard, MapPin, Building, Map, TreePine, Home, Clock, BookOpen, Shield } from "lucide-react";

type Tab = "divisions" | "districts" | "upazilas" | "unions" | "villages" | "institutes" | "prayer-times" | "stories" | "roles";

const menuItems: { value: Tab; label: string; icon: any; superAdminOnly?: boolean }[] = [
  { value: "divisions", label: "Divisions", icon: LayoutDashboard },
  { value: "districts", label: "Districts", icon: MapPin },
  { value: "upazilas", label: "Upazilas", icon: Map },
  { value: "unions", label: "Unions", icon: TreePine },
  { value: "villages", label: "Villages", icon: Home },
  { value: "institutes", label: "Institutes", icon: Building },
  { value: "prayer-times", label: "Prayer Times", icon: Clock },
  { value: "stories", label: "Stories", icon: BookOpen, superAdminOnly: true },
  { value: "roles", label: "User Roles", icon: Shield, superAdminOnly: true },
];

const AdminPage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!user || (userRole !== "super_admin" && userRole !== "admin")) {
      toast.error("Access denied. Admin only.");
      navigate("/");
    }
  }, [user, loading, userRole, navigate]);

  // --- Divisions ---
  const { data: divisions } = useQuery({
    queryKey: ["admin-divisions"],
    queryFn: async () => { const { data } = await supabase.from("divisions").select("*").order("division_name"); return data || []; },
  });
  const [divName, setDivName] = useState("");
  const [editDivId, setEditDivId] = useState<string | null>(null);

  const saveDivision = useMutation({
    mutationFn: async () => {
      if (!divName.trim()) throw new Error("Name required");
      if (editDivId) {
        const { error } = await supabase.from("divisions").update({ division_name: divName }).eq("id", editDivId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("divisions").insert({ division_name: divName });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-divisions"] }); setDivName(""); setEditDivId(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDivision = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("divisions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-divisions"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // --- Districts ---
  const [distName, setDistName] = useState("");
  const [distDivId, setDistDivId] = useState("");
  const [editDistId, setEditDistId] = useState<string | null>(null);
  const { data: districts } = useQuery({
    queryKey: ["admin-districts"],
    queryFn: async () => { const { data } = await supabase.from("districts").select("*, divisions(division_name)").order("district_name"); return data || []; },
  });

  const saveDistrict = useMutation({
    mutationFn: async () => {
      if (!distName.trim() || !distDivId) throw new Error("All fields required");
      if (editDistId) {
        const { error } = await supabase.from("districts").update({ district_name: distName, division_id: distDivId }).eq("id", editDistId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("districts").insert({ district_name: distName, division_id: distDivId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-districts"] }); setDistName(""); setDistDivId(""); setEditDistId(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDistrict = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("districts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-districts"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // --- Upazilas ---
  const [upName, setUpName] = useState("");
  const [upDistId, setUpDistId] = useState("");
  const [editUpId, setEditUpId] = useState<string | null>(null);
  const { data: upazilas } = useQuery({
    queryKey: ["admin-upazilas"],
    queryFn: async () => { const { data } = await supabase.from("upazilas").select("*, districts(district_name)").order("upazila_name"); return data || []; },
  });

  const saveUpazila = useMutation({
    mutationFn: async () => {
      if (!upName.trim() || !upDistId) throw new Error("All fields required");
      if (editUpId) {
        const { error } = await supabase.from("upazilas").update({ upazila_name: upName, district_id: upDistId }).eq("id", editUpId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("upazilas").insert({ upazila_name: upName, district_id: upDistId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-upazilas"] }); setUpName(""); setUpDistId(""); setEditUpId(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteUpazila = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("upazilas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-upazilas"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // --- Unions ---
  const [unName, setUnName] = useState("");
  const [unUpId, setUnUpId] = useState("");
  const [editUnId, setEditUnId] = useState<string | null>(null);
  const { data: unions } = useQuery({
    queryKey: ["admin-unions"],
    queryFn: async () => { const { data } = await supabase.from("unions").select("*, upazilas(upazila_name)").order("union_name"); return data || []; },
  });

  const saveUnion = useMutation({
    mutationFn: async () => {
      if (!unName.trim() || !unUpId) throw new Error("All fields required");
      if (editUnId) {
        const { error } = await supabase.from("unions").update({ union_name: unName, upazila_id: unUpId }).eq("id", editUnId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("unions").insert({ union_name: unName, upazila_id: unUpId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-unions"] }); setUnName(""); setUnUpId(""); setEditUnId(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteUnion = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("unions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-unions"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // --- Villages ---
  const [vilName, setVilName] = useState("");
  const [vilUnId, setVilUnId] = useState("");
  const [editVilId, setEditVilId] = useState<string | null>(null);
  const { data: villages } = useQuery({
    queryKey: ["admin-villages"],
    queryFn: async () => { const { data } = await supabase.from("villages").select("*, unions(union_name)").order("village_name"); return data || []; },
  });

  const saveVillage = useMutation({
    mutationFn: async () => {
      if (!vilName.trim() || !vilUnId) throw new Error("All fields required");
      if (editVilId) {
        const { error } = await supabase.from("villages").update({ village_name: vilName, union_id: vilUnId }).eq("id", editVilId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("villages").insert({ village_name: vilName, union_id: vilUnId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-villages"] }); setVilName(""); setVilUnId(""); setEditVilId(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteVillage = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("villages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-villages"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // --- Institutes ---
  const [instName, setInstName] = useState("");
  const [instType, setInstType] = useState("School");
  const [instAddr, setInstAddr] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instVilId, setInstVilId] = useState("");
  const [editInstId, setEditInstId] = useState<string | null>(null);
  const { data: institutes } = useQuery({
    queryKey: ["admin-institutes"],
    queryFn: async () => { const { data } = await supabase.from("institutes").select("*, villages(village_name)").order("name"); return data || []; },
  });

  const saveInstitute = useMutation({
    mutationFn: async () => {
      if (!instName.trim() || !instVilId) throw new Error("Name and village required");
      const payload = { name: instName, type: instType, address: instAddr || null, phone: instPhone || null, village_id: instVilId };
      if (editInstId) {
        const { error } = await supabase.from("institutes").update(payload).eq("id", editInstId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("institutes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-institutes"] });
      setInstName(""); setInstType("School"); setInstAddr(""); setInstPhone(""); setInstVilId(""); setEditInstId(null);
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteInstitute = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("institutes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-institutes"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const ItemRow = ({ name, sub, onEdit, onDelete }: { name: string; sub?: string; onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium text-card-foreground">{name}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = useState<Tab>("divisions");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-6 font-display text-2xl font-bold">Admin Dashboard</h1>

        <div className="flex gap-6">
          {/* Left Sidebar */}
          <nav className="hidden w-56 shrink-0 md:block">
            <div className="sticky top-20 space-y-1 rounded-lg border bg-card p-2">
              {menuItems
                .filter((item) => !item.superAdminOnly || userRole === "super_admin")
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setActiveTab(item.value)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === item.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </nav>

          {/* Mobile dropdown */}
          <div className="mb-4 w-full md:hidden">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {menuItems
                  .filter((item) => !item.superAdminOnly || userRole === "super_admin")
                  .map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {activeTab === "divisions" && (
              <>
                <div className="mb-4 flex gap-2">
                  <Input placeholder="Division name" value={divName} onChange={(e) => setDivName(e.target.value)} />
                  <Button onClick={() => saveDivision.mutate()} className="gap-1"><Plus className="h-4 w-4" />{editDivId ? "Update" : "Add"}</Button>
                  {editDivId && <Button variant="outline" onClick={() => { setEditDivId(null); setDivName(""); }}>Cancel</Button>}
                </div>
                <div className="space-y-2">
                  {divisions?.map((d) => (
                    <ItemRow key={d.id} name={d.division_name} onEdit={() => { setEditDivId(d.id); setDivName(d.division_name); }} onDelete={() => deleteDivision.mutate(d.id)} />
                  ))}
                </div>
              </>
            )}

            {activeTab === "districts" && (
              <>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="District name" value={distName} onChange={(e) => setDistName(e.target.value)} />
                  <Select value={distDivId} onValueChange={setDistDivId}>
                    <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Division" /></SelectTrigger>
                    <SelectContent>{divisions?.map((d) => <SelectItem key={d.id} value={d.id}>{d.division_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={() => saveDistrict.mutate()} className="gap-1"><Plus className="h-4 w-4" />{editDistId ? "Update" : "Add"}</Button>
                  {editDistId && <Button variant="outline" onClick={() => { setEditDistId(null); setDistName(""); setDistDivId(""); }}>Cancel</Button>}
                </div>
                <div className="space-y-2">
                  {districts?.map((d) => (
                    <ItemRow key={d.id} name={d.district_name} sub={(d.divisions as any)?.division_name} onEdit={() => { setEditDistId(d.id); setDistName(d.district_name); setDistDivId(d.division_id); }} onDelete={() => deleteDistrict.mutate(d.id)} />
                  ))}
                </div>
              </>
            )}

            {activeTab === "upazilas" && (
              <>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Upazila name" value={upName} onChange={(e) => setUpName(e.target.value)} />
                  <Select value={upDistId} onValueChange={setUpDistId}>
                    <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="District" /></SelectTrigger>
                    <SelectContent>{districts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.district_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={() => saveUpazila.mutate()} className="gap-1"><Plus className="h-4 w-4" />{editUpId ? "Update" : "Add"}</Button>
                  {editUpId && <Button variant="outline" onClick={() => { setEditUpId(null); setUpName(""); setUpDistId(""); }}>Cancel</Button>}
                </div>
                <div className="space-y-2">
                  {upazilas?.map((u) => (
                    <ItemRow key={u.id} name={u.upazila_name} sub={(u.districts as any)?.district_name} onEdit={() => { setEditUpId(u.id); setUpName(u.upazila_name); setUpDistId(u.district_id); }} onDelete={() => deleteUpazila.mutate(u.id)} />
                  ))}
                </div>
              </>
            )}

            {activeTab === "unions" && (
              <>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Union name" value={unName} onChange={(e) => setUnName(e.target.value)} />
                  <Select value={unUpId} onValueChange={setUnUpId}>
                    <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Upazila" /></SelectTrigger>
                    <SelectContent>{upazilas?.map((u) => <SelectItem key={u.id} value={u.id}>{u.upazila_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={() => saveUnion.mutate()} className="gap-1"><Plus className="h-4 w-4" />{editUnId ? "Update" : "Add"}</Button>
                  {editUnId && <Button variant="outline" onClick={() => { setEditUnId(null); setUnName(""); setUnUpId(""); }}>Cancel</Button>}
                </div>
                <div className="space-y-2">
                  {unions?.map((u) => (
                    <ItemRow key={u.id} name={u.union_name} sub={(u.upazilas as any)?.upazila_name} onEdit={() => { setEditUnId(u.id); setUnName(u.union_name); setUnUpId(u.upazila_id); }} onDelete={() => deleteUnion.mutate(u.id)} />
                  ))}
                </div>
              </>
            )}

            {activeTab === "villages" && (
              <>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Village name" value={vilName} onChange={(e) => setVilName(e.target.value)} />
                  <Select value={vilUnId} onValueChange={setVilUnId}>
                    <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Union" /></SelectTrigger>
                    <SelectContent>{unions?.map((u) => <SelectItem key={u.id} value={u.id}>{u.union_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={() => saveVillage.mutate()} className="gap-1"><Plus className="h-4 w-4" />{editVilId ? "Update" : "Add"}</Button>
                  {editVilId && <Button variant="outline" onClick={() => { setEditVilId(null); setVilName(""); setVilUnId(""); }}>Cancel</Button>}
                </div>
                <div className="space-y-2">
                  {villages?.map((v) => (
                    <ItemRow key={v.id} name={v.village_name} sub={(v.unions as any)?.union_name} onEdit={() => { setEditVilId(v.id); setVilName(v.village_name); setVilUnId(v.union_id); }} onDelete={() => deleteVillage.mutate(v.id)} />
                  ))}
                </div>
              </>
            )}

            {activeTab === "institutes" && (
              <>
                <div className="mb-4 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input placeholder="Institute name" value={instName} onChange={(e) => setInstName(e.target.value)} />
                    <Select value={instType} onValueChange={setInstType}>
                      <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="School">School</SelectItem>
                        <SelectItem value="College">College</SelectItem>
                        <SelectItem value="Madrasa">Madrasa</SelectItem>
                        <SelectItem value="Mosque">Mosque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input placeholder="Address" value={instAddr} onChange={(e) => setInstAddr(e.target.value)} />
                    <Input placeholder="Phone" value={instPhone} onChange={(e) => setInstPhone(e.target.value)} />
                    <Select value={instVilId} onValueChange={setInstVilId}>
                      <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Village" /></SelectTrigger>
                      <SelectContent>{villages?.map((v) => <SelectItem key={v.id} value={v.id}>{v.village_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveInstitute.mutate()} className="gap-1"><Plus className="h-4 w-4" />{editInstId ? "Update" : "Add"}</Button>
                    {editInstId && <Button variant="outline" onClick={() => { setEditInstId(null); setInstName(""); setInstType("School"); setInstAddr(""); setInstPhone(""); setInstVilId(""); }}>Cancel</Button>}
                  </div>
                </div>
                <div className="space-y-2">
                  {institutes?.map((inst) => (
                    <ItemRow key={inst.id} name={`${inst.name} (${inst.type})`} sub={(inst.villages as any)?.village_name} onEdit={() => { setEditInstId(inst.id); setInstName(inst.name); setInstType(inst.type); setInstAddr(inst.address || ""); setInstPhone(inst.phone || ""); setInstVilId(inst.village_id); }} onDelete={() => deleteInstitute.mutate(inst.id)} />
                  ))}
                </div>
              </>
            )}

            {activeTab === "prayer-times" && <PrayerTimeManager />}

            {activeTab === "stories" && userRole === "super_admin" && <StoryManager />}

            {activeTab === "roles" && userRole === "super_admin" && <RoleManagement />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
