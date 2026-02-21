import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { Ban, Plus } from "lucide-react";
import { format } from "date-fns";

export default function AdminBlacklist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tipo, setTipo] = useState<"produtor" | "engenheiro">("produtor");
  const [motivo, setMotivo] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["admin_blacklist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blacklist").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch profile names for user_ids
      const userIds = [...new Set(data?.map((e) => e.user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, nome, email").in("id", userIds);
        profiles?.forEach((p) => { profileMap[p.id] = `${p.nome} (${p.email})`; });
      }
      return data?.map((e) => ({ ...e, user_label: profileMap[e.user_id] || e.user_id })) ?? [];
    },
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all_profiles_bl"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, nome, email").order("nome");
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("blacklist").insert({
        user_id: selectedUserId,
        tipo,
        motivo,
        criado_por: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_blacklist"] });
      toast({ title: "Usuário adicionado à blacklist." });
      setOpen(false); setSelectedUserId(""); setMotivo("");
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("blacklist").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_blacklist"] });
      toast({ title: "Status atualizado." });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Blacklist</h1>
          <p className="text-muted-foreground">Bloqueie produtores ou engenheiros de operar na plataforma.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !entries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Ban className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum usuário na blacklist.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-sm">{e.user_label}</TableCell>
                    <TableCell>
                      <Badge variant={e.tipo === "produtor" ? "outline" : "secondary"}>{e.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-40 truncate">{e.motivo || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(e.created_at), "dd/MM/yy")}</TableCell>
                    <TableCell>
                      <Badge variant={e.ativo ? "destructive" : "outline"}>{e.ativo ? "Bloqueado" : "Desbloqueado"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate({ id: e.id, ativo: !e.ativo })} disabled={toggleMutation.isPending}>
                        {e.ativo ? "Desbloquear" : "Bloquear"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Blacklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="produtor">Produtor</SelectItem>
                  <SelectItem value="engenheiro">Engenheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário" /></SelectTrigger>
                <SelectContent>
                  {allUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva o motivo do bloqueio..." rows={3} />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!selectedUserId || addMutation.isPending} className="w-full">
              {addMutation.isPending ? "Salvando..." : "Bloquear Usuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
