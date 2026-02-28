import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, ShieldCheck, Info, UserPlus, Eye, EyeOff, Pencil, Trash2, UserCheck, Landmark } from "lucide-react";
import { useState } from "react";

type AppRole = "produtor" | "engenheiro" | "admin" | "mesa_produtos" | "banco" | "agrobanker";

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: AppRole | null;
  role_id: string | null;
  banco_parceiro_id: string | null;
}

const roleLabel = (role: AppRole | null) => {
  const labels: Record<string, string> = {
    produtor: "Produtor",
    engenheiro: "Engenheiro/Projetista",
    admin: "Administrador",
    mesa_produtos: "Mesa de Produtos",
    banco: "Banco Parceiro",
    agrobanker: "AgroBanker",
  };
  return role ? labels[role] ?? role : "Sem papel";
};

const roleBadgeVariant = (role: AppRole | null): "default" | "secondary" | "outline" => {
  if (role === "admin") return "default";
  if (role === "mesa_produtos") return "secondary";
  return "outline";
};

export default function AdminUsuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithRole | null>(null);

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
        .select("id, nome, email, telefone")
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
        telefone: p.telefone,
        role: roleMap.get(p.id)?.role ?? null,
        role_id: roleMap.get(p.id)?.role_id ?? null,
        banco_parceiro_id: bancoMap.get(p.id) ?? null,
      })) as UserWithRole[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, newRole, bancoParcId }: { userId: string; newRole: AppRole; bancoParcId?: string }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("banco_usuarios").delete().eq("user_id", userId);

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;

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

  const updateProfile = useMutation({
    mutationFn: async ({ userId, nome, telefone }: { userId: string; nome: string; telefone: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ nome, telefone })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_usuarios"] });
      toast({ title: "Perfil atualizado com sucesso!" });
      setEditUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("banco_usuarios").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_usuarios"] });
      toast({ title: "Usuário removido com sucesso!" });
      setDeleteUser(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const mesaUsers = users?.filter((u) => u.role === "mesa_produtos") ?? [];
  const bancoUsersFiltered = users?.filter((u) => u.role === "banco") ?? [];
  const totalUsers = users?.length ?? 0;
  const withRole = users?.filter((u) => u.role !== null).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os papéis dos usuários da plataforma."
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1">
            <UserPlus className="h-4 w-4" />
            Criar Usuário Interno
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} title="Total Usuários" value={String(totalUsers)} loading={isLoading} delay={0} />
        <StatCard icon={<UserCheck className="h-4 w-4" />} title="Com Papel Atribuído" value={String(withRole)} loading={isLoading} delay={100} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} title="Mesa de Produtos" value={String(mesaUsers.length)} loading={isLoading} delay={200} />
        <StatCard icon={<Landmark className="h-4 w-4" />} title="Bancos Parceiros" value={String(bancoUsersFiltered.length)} loading={isLoading} delay={300} />
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm flex items-start gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Gestão de equipes internas:</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground list-disc pl-4">
            <li><strong>Mesa de Produtos / Banco:</strong> use "Criar Usuário Interno" para cadastrar membros da equipe.</li>
            <li><strong>Produtor / Engenheiro:</strong> se cadastram pela tela de registro.</li>
          </ul>
        </div>
      </div>

      {(mesaUsers.length > 0 || bancoUsersFiltered.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
                <Badge variant="secondary">Mesa de Produtos</Badge>
                <span className="text-muted-foreground font-normal">{mesaUsers.length} membro(s)</span>
              </h3>
              {mesaUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum membro cadastrado.</p>
              ) : (
                <ul className="space-y-1">
                  {mesaUsers.map((u) => (
                    <li key={u.id} className="text-sm flex items-center gap-2">
                      <span className="font-medium">{u.nome || "—"}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
                <Badge variant="outline">Banco Parceiro</Badge>
                <span className="text-muted-foreground font-normal">{bancoUsersFiltered.length} membro(s)</span>
              </h3>
              {bancoUsersFiltered.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum membro cadastrado.</p>
              ) : (
                <ul className="space-y-1">
                  {bancoUsersFiltered.map((u) => {
                    const bancoNome = bancosParceiros?.find((b) => b.id === u.banco_parceiro_id)?.nome;
                    return (
                      <li key={u.id} className="text-sm flex items-center gap-2">
                        <span className="font-medium">{u.nome || "—"}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                        {bancoNome && <Badge variant="outline" className="text-xs">{bancoNome}</Badge>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <Card><CardContent className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </CardContent></Card>
      ) : !users?.length ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum usuário encontrado" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Papel Atual</TableHead>
                  <TableHead>Alterar Papel</TableHead>
                  <TableHead className="w-24 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    bancosParceiros={bancosParceiros ?? []}
                    onAssign={(newRole, bancoParcId) => assignRole.mutate({ userId: u.id, newRole, bancoParcId })}
                    isLoading={assignRole.isPending}
                    onEdit={() => setEditUser(u)}
                    onDelete={() => setDeleteUser(u)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateInternalUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        bancosParceiros={bancosParceiros ?? []}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["admin_usuarios"] });
          setCreateOpen(false);
        }}
      />

      <EditProfileDialog
        user={editUser}
        onOpenChange={(open) => { if (!open) setEditUser(null); }}
        onSave={(userId, nome, telefone) => updateProfile.mutate({ userId, nome, telefone })}
        isLoading={updateProfile.isPending}
      />

      <AlertDialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o perfil de <strong>{deleteUser?.nome || deleteUser?.email}</strong>?
              Esta ação removerá o papel e os vínculos do usuário. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUser && deleteUserMutation.mutate(deleteUser.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Edit Profile Dialog ── */

function EditProfileDialog({
  user,
  onOpenChange,
  onSave,
  isLoading,
}: {
  user: UserWithRole | null;
  onOpenChange: (v: boolean) => void;
  onSave: (userId: string, nome: string, telefone: string) => void;
  isLoading: boolean;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const isOpen = !!user;

  if (user && nome === "" && telefone === "" && !isLoading) {
    // Use effect-like initialization
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setNome("");
          setTelefone("");
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <EditProfileForm
          user={user}
          onSave={onSave}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditProfileForm({
  user,
  onSave,
  isLoading,
}: {
  user: UserWithRole | null;
  onSave: (userId: string, nome: string, telefone: string) => void;
  isLoading: boolean;
}) {
  const [nome, setNome] = useState(user?.nome ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");

  if (!user) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(user.id, nome.trim(), telefone.trim());
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Nome completo</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={user.email} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
      </div>
      <Button type="submit" className="w-full gap-1" disabled={isLoading || !nome.trim()}>
        <Pencil className="h-4 w-4" />
        {isLoading ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}

/* ── Create Internal User Dialog ── */

function CreateInternalUserDialog({
  open,
  onOpenChange,
  bancosParceiros,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bancosParceiros: { id: string; nome: string }[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [role, setRole] = useState<"mesa_produtos" | "banco">("mesa_produtos");
  const [bancoParcId, setBancoParcId] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNome(""); setEmail(""); setSenha("");
    setRole("mesa_produtos"); setBancoParcId(""); setShowSenha(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) return;
    if (role === "banco" && !bancoParcId) {
      toast({ title: "Selecione o banco parceiro", variant: "destructive" });
      return;
    }
    if (senha.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await supabase.functions.invoke("create-internal-user", {
        body: {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          role,
          banco_parceiro_id: role === "banco" ? bancoParcId : undefined,
        },
      });

      if (res.error) throw new Error(res.error.message || "Erro ao criar usuário");
      const result = res.data;
      if (result?.error) throw new Error(result.error);

      toast({ title: "Usuário criado com sucesso!", description: `${nome} (${roleLabel(role)}) já pode acessar a plataforma.` });
      reset();
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Usuário Interno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Senha *</Label>
            <div className="relative">
              <Input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-2 top-2.5 text-muted-foreground"
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mesa_produtos">Mesa de Produtos</SelectItem>
                <SelectItem value="banco">Banco Parceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "banco" && (
            <div className="space-y-2">
              <Label>Banco Parceiro *</Label>
              <Select value={bancoParcId} onValueChange={setBancoParcId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {bancosParceiros.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full gap-1" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? "Criando..." : "Criar Usuário"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── User Row ── */

function UserRow({
  user,
  bancosParceiros,
  onAssign,
  isLoading,
  onEdit,
  onDelete,
}: {
  user: UserWithRole;
  bancosParceiros: { id: string; nome: string }[];
  onAssign: (role: AppRole, bancoParcId?: string) => void;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<AppRole | "">(user.role ?? "");
  const [selectedBanco, setSelectedBanco] = useState(user.banco_parceiro_id ?? "");

  return (
    <TableRow>
      <TableCell>
        <div>
          <span className="font-medium">{user.nome || "—"}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
      <TableCell className="text-sm">{user.telefone || "—"}</TableCell>
      <TableCell>
        <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5 items-center">
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Papel..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="produtor">Produtor</SelectItem>
              <SelectItem value="engenheiro">Engenheiro</SelectItem>
              <SelectItem value="mesa_produtos">Mesa Produtos</SelectItem>
              <SelectItem value="banco">Banco</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="agrobanker">AgroBanker</SelectItem>
            </SelectContent>
          </Select>
          {selectedRole === "banco" && (
            <Select value={selectedBanco} onValueChange={setSelectedBanco}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Banco..." /></SelectTrigger>
              <SelectContent>
                {bancosParceiros.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!selectedRole || isLoading}
            onClick={() => onAssign(selectedRole as AppRole, selectedBanco)}
          >
            Salvar
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1 justify-center">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
