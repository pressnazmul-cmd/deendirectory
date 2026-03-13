import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Shield } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: AppRole[] = ["super_admin", "admin", "editor", "user"];

const RoleManagement = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["role-management-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, mobile")
        .order("full_name");

      if (!profiles) return [];

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = new Map<string, AppRole>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role as AppRole));

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.id) || ("user" as AppRole),
      }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Upsert role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-management-users"] });
      toast.success("Role আপডেট হয়েছে");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = users?.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search)
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>মোবাইল</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell>{u.mobile || "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(val) =>
                        updateRole.mutate({ userId: u.id, newRole: val as AppRole })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {r}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "super_admin" ? "bg-destructive/10 text-destructive" :
                      u.role === "admin" ? "bg-primary/10 text-primary" :
                      u.role === "editor" ? "bg-accent text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {u.role}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    কোন ইউজার পাওয়া যায়নি
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
