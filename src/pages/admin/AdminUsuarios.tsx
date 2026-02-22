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
import { Users, ShieldCheck, Info } from "lucide-react";
import { useState } from "react";

type AppRole = "produtor" | "engenheiro" | "admin" | "mesa_produtos" | "banco";

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  role: AppRole | null;
  role_id: string | null;
  banco_parceiro_id: string | null;
}

export default function AdminUsuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: bancosParceiros } = useQuery({
    queryKey: ["bancos_parceiros_ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bancos_parceiros")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

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

      const { data: bancoUsers } = await supabase
        .from("banco_usuarios")
        .select("user_id, banco_parceiro_id");

      const roleMap = new Map(
        (roles ?? []).map((r) => [r.user_id, { role: r.role as AppRole, role_id: r.id }])
      );

      const bancoMap = new Map(
        (bancoUsers ?? []).map((b) => [b.user_id, b.banco_parceiro_id])
      );

      return (profiles ?? []).map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        role: roleMap.get(p.id)?.role ?? null,
        role_id: roleMap.get(p.id)?.role_id ?? null,
        banco_parceiro_id: bancoMap.get(p.id) ?? null,
      })) as UserWithRole[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, newRole, bancoParcId }: { userId: string; newRole: AppRole; bancoParcId?: string }) => {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Remove existing banco_usuarios link
      await supabase.from("banco_usuarios").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;

      // If banco, link to banco parceiro
      if (newRole === "banco" && bancoParcId) {
        const { error: err2 } = await supabase
          .from("banco_usuarios")
          .insert({ user_id: userId, banco_parceiro_id: bancoParcId });
        if (err2) throw err2;
      }
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
      engenheiro: "Engenheiro/Projetista",
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

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm flex items-start gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Como cadastrar usuários por papel:</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground list-disc pl-4">
            <li><strong>Mesa de Produtos:</strong> selecione o papel "Mesa de Produtos" e salve.</li>
            <li><strong>Banco Parceiro:</strong> selecione o papel "Banco Parceiro", escolha o banco correspondente e salve.</li>
            <li><strong>Produtor / Engenheiro:</strong> o usuário se cadastra e o papel é atribuído automaticamente no registro. Você pode alterar manualmente aqui.</li>
          </ul>
        </div>
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
                  <TableHead>Alterar Papel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    roleLabel={roleLabel}
                    roleBadgeVariant={roleBadgeVariant}
                    bancosParceiros={bancosParceiros ?? []}
                    onAssign={(newRole, bancoParcId) => assignRole.mutate({ userId: u.id, newRole, bancoParcId })}
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
  bancosParceiros,
  onAssign,
  isLoading,
}: {
  user: UserWithRole;
  roleLabel: (r: AppRole | null) => string;
  roleBadgeVariant: (r: AppRole | null) => "default" | "secondary" | "outline";
  bancosParceiros: { id: string; nome: string }[];
  onAssign: (role: AppRole, bancoParcId?: string) => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<AppRole | "">(user.role ?? "");
  const [bancoParcId, setBancoParcId] = useState<string>(user.banco_parceiro_id ?? "");

  const bancoNome = bancosParceiros.find((b) => b.id === user.banco_parceiro_id)?.nome;

  return (
    <TableRow>
      <TableCell className="font-medium">{user.nome || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
          {user.role === "banco" && bancoNome && (
            <span className="text-xs text-muted-foreground">🏦 {bancoNome}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Select value={selected} onValueChange={(v) => setSelected(v as AppRole)}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produtor">Produtor</SelectItem>
                <SelectItem value="engenheiro">Engenheiro/Projetista</SelectItem>
                <SelectItem value="mesa_produtos">Mesa de Produtos</SelectItem>
                <SelectItem value="banco">Banco Parceiro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!selected || (selected === user.role && (selected !== "banco" || bancoParcId === (user.banco_parceiro_id ?? ""))) || isLoading || (selected === "banco" && !bancoParcId)}
              onClick={() => selected && onAssign(selected, selected === "banco" ? bancoParcId : undefined)}
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Salvar
            </Button>
          </div>
          {selected === "banco" && (
            <Select value={bancoParcId} onValueChange={setBancoParcId}>
              <SelectTrigger className="h-8 w-52">
                <SelectValue placeholder="Selecione o banco..." />
              </SelectTrigger>
              <SelectContent>
                {bancosParceiros.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}