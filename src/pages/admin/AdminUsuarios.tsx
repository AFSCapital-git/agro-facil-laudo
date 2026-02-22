import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, ShieldCheck } from "lucide-react";
import { useState } from "react";

type AppRole = "produtor" | "engenheiro" | "admin" | "mesa_produtos" | "banco";

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  role: AppRole | null;
  role_id: string | null;
}

export default function AdminUsuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_usuarios"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      const roleMap = new Map(
        (roles ?? []).map((r) => [r.user_id, { role: r.role as AppRole, role_id: r.id }])
      );

      return (profiles ?? []).map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        role: roleMap.get(p.id)?.role ?? null,
        role_id: roleMap.get(p.id)?.role_id ?? null,
      })) as UserWithRole[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_usuarios"] });
      toast({ title: "Papel atualizado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const roleBadgeVariant = (role: AppRole | null): "default" | "secondary" | "outline" => {
    if (role === "admin") return "default";
    if (role === "mesa_produtos") return "secondary";
    return "outline";
  };

  const roleLabel = (role: AppRole | null) => {
    const labels: Record<string, string> = {
      produtor: "Produtor",
      engenheiro: "Engenheiro",
      admin: "Administrador",
      mesa_produtos: "Mesa de Produtos",
      banco: "Banco Parceiro",
    };
    return role ? labels[role] ?? role : "Sem papel";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os papéis dos usuários da plataforma.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !users?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel Atual</TableHead>
                  <TableHead className="w-52">Alterar Papel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    roleLabel={roleLabel}
                    roleBadgeVariant={roleBadgeVariant}
                    onAssign={(newRole) => assignRole.mutate({ userId: u.id, newRole })}
                    isLoading={assignRole.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserRow({
  user,
  roleLabel,
  roleBadgeVariant,
  onAssign,
  isLoading,
}: {
  user: UserWithRole;
  roleLabel: (r: AppRole | null) => string;
  roleBadgeVariant: (r: AppRole | null) => "default" | "secondary" | "outline";
  onAssign: (role: AppRole) => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<AppRole | "">(user.role ?? "");

  return (
    <TableRow>
      <TableCell className="font-medium">{user.nome || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select value={selected} onValueChange={(v) => setSelected(v as AppRole)}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="produtor">Produtor</SelectItem>
              <SelectItem value="engenheiro">Engenheiro</SelectItem>
              <SelectItem value="mesa_produtos">Mesa de Produtos</SelectItem>
              <SelectItem value="banco">Banco Parceiro</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected || selected === user.role || isLoading}
            onClick={() => selected && onAssign(selected)}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Salvar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
