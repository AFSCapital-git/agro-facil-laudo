import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Plus, Pencil, UserPlus, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";

export default function AdminBancos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [expandedBanco, setExpandedBanco] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkBancoId, setLinkBancoId] = useState<string | null>(null);
  const [linkUserId, setLinkUserId] = useState("");

  const { data: bancos, isLoading } = useQuery({
    queryKey: ["admin_bancos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bancos_parceiros").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  // All banco_usuarios with profile info
  const { data: bancoUsuarios } = useQuery({
    queryKey: ["admin_banco_usuarios"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banco_usuarios")
        .select("*, profiles:user_id(nome, email)");
      if (error) throw error;
      return data as any[];
    },
  });

  // All profiles with banco role for the link selector
  const { data: bancoPossibleUsers } = useQuery({
    queryKey: ["admin_banco_role_users"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "banco" as any);
      if (error) throw error;
      if (!roles?.length) return [];
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);
      if (pErr) throw pErr;
      return profiles ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("bancos_parceiros").update({ nome, codigo, ativo }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bancos_parceiros").insert({ nome, codigo, ativo });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_bancos"] });
      toast({ title: editing ? "Banco atualizado!" : "Banco adicionado!" });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const linkUserMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("banco_usuarios").insert({
        user_id: linkUserId,
        banco_parceiro_id: linkBancoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_banco_usuarios"] });
      toast({ title: "Usuário vinculado ao banco!" });
      setLinkOpen(false);
      setLinkUserId("");
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const unlinkUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("banco_usuarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_banco_usuarios"] });
      toast({ title: "Vínculo removido!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setNome(""); setCodigo(""); setAtivo(true); setOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setNome(b.nome); setCodigo(b.codigo); setAtivo(b.ativo); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditing(null); };

  const getUsersForBanco = (bancoId: string) =>
    bancoUsuarios?.filter((bu) => bu.banco_parceiro_id === bancoId) ?? [];

  const alreadyLinkedUserIds = new Set(bancoUsuarios?.map((bu) => bu.user_id) ?? []);
  const availableUsers = bancoPossibleUsers?.filter((u) => !alreadyLinkedUserIds.has(u.id)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Bancos Parceiros</h1>
          <p className="text-muted-foreground">Gerencie os bancos e seus usuários vinculados.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Novo Banco</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !bancos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Landmark className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum banco cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bancos.map((b) => {
            const isExpanded = expandedBanco === b.id;
            const linkedUsers = getUsersForBanco(b.id);
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedBanco(isExpanded ? null : b.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{b.nome}</span>
                        <Badge variant={b.ativo ? "default" : "outline"}>
                          {b.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {b.codigo && <span className="text-xs text-muted-foreground">({b.codigo})</span>}
                        <Badge variant="secondary" className="ml-2">
                          <Users className="h-3 w-3 mr-1" /> {linkedUsers.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setExpandedBanco(isExpanded ? null : b.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t pt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Usuários Vinculados</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setLinkBancoId(b.id); setLinkUserId(""); setLinkOpen(true); }}
                          disabled={availableUsers.length === 0}
                        >
                          <UserPlus className="h-3 w-3 mr-1" /> Vincular Usuário
                        </Button>
                      </div>
                      {linkedUsers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum usuário vinculado. Atribua o papel "Banco Parceiro" a um usuário na página de Usuários e depois vincule aqui.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="w-16" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {linkedUsers.map((bu) => (
                              <TableRow key={bu.id}>
                                <TableCell className="font-medium">{bu.profiles?.nome || "—"}</TableCell>
                                <TableCell className="text-muted-foreground">{bu.profiles?.email || "—"}</TableCell>
                                <TableCell>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => unlinkUserMutation.mutate(bu.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create banco dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Banco" : "Novo Banco"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Banco</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Banco do Brasil" />
            </div>
            <div className="space-y-2">
              <Label>Código (opcional)</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: 001" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Ativo</Label>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={!nome.trim() || saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link user dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Usuário ao Banco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um usuário com papel "Banco Parceiro" para vincular.
            </p>
            {availableUsers.length === 0 ? (
              <p className="text-sm text-destructive">
                Nenhum usuário disponível. Atribua o papel "Banco Parceiro" na página de Usuários primeiro.
              </p>
            ) : (
              <Select value={linkUserId} onValueChange={setLinkUserId}>
                <SelectTrigger><SelectValue placeholder="Selecione o usuário..." /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => linkUserMutation.mutate()}
              disabled={!linkUserId || linkUserMutation.isPending}
              className="w-full"
            >
              {linkUserMutation.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
