import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, Mail, Link2, Users, Copy, Trash2 } from "lucide-react";

export default function AgroBankerCarteira() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState("cadastrar");
  const [searchExisting, setSearchExisting] = useState("");

  // Form state – cadastro completo
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nivelAcesso, setNivelAcesso] = useState("indicacao");

  // Form state – convite
  const [conviteEmail, setConviteEmail] = useState("");
  const [conviteNome, setConviteNome] = useState("");

  const { data: agrobankerId } = useQuery({
    queryKey: ["agrobanker_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_agrobanker_id");
      return data as string;
    },
  });

  const { data: produtores = [], isLoading } = useQuery({
    queryKey: ["ab_carteira", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("agrobanker_produtores")
        .select("*, produtores(id, cpf_cnpj, user_id)")
        .eq("agrobanker_id", agrobankerId!);
      if (!links) return [];
      const userIds = links.map((l: any) => l.produtores?.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone")
        .in("id", userIds);
      return links.map((l: any) => ({
        ...l,
        profile: profiles?.find((p) => p.id === l.produtores?.user_id),
      }));
    },
  });

  const { data: convites = [] } = useQuery({
    queryKey: ["ab_convites", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_convites" as any)
        .select("*")
        .eq("agrobanker_id", agrobankerId!)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Search existing producers (not yet linked)
  const { data: searchResults = [] } = useQuery({
    queryKey: ["ab_search_produtores", searchExisting],
    enabled: searchExisting.length >= 3,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .or(`nome.ilike.%${searchExisting}%,email.ilike.%${searchExisting}%`)
        .limit(10);
      if (!profiles) return [];
      const { data: prods } = await supabase
        .from("produtores")
        .select("id, user_id")
        .in("user_id", profiles.map((p) => p.id));
      if (!prods) return [];
      const linkedIds = produtores.map((p: any) => p.produtor_id);
      return prods
        .filter((p) => !linkedIds.includes(p.id))
        .map((p) => ({
          ...p,
          profile: profiles.find((pr) => pr.id === p.user_id),
        }));
    },
  });

  const linkMutation = useMutation({
    mutationFn: async ({ produtorId, nivel }: { produtorId: string; nivel: string }) => {
      const { error } = await supabase.from("agrobanker_produtores").insert({
        agrobanker_id: agrobankerId!,
        produtor_id: produtorId,
        nivel_acesso: nivel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_carteira"] });
      toast({ title: "Produtor vinculado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const cadastroMutation = useMutation({
    mutationFn: async () => {
      // Create user via edge function
      const { data, error } = await supabase.functions.invoke("create-internal-user", {
        body: { email, password: Math.random().toString(36).slice(-10) + "A1!", nome, telefone, role: "produtor", cpf_cnpj: cpfCnpj },
      });
      if (error) throw error;
      const userId = data?.user_id;
      if (!userId) throw new Error("Falha ao criar usuário");
      // Wait a moment then link
      const { data: prod } = await supabase.from("produtores").select("id").eq("user_id", userId).single();
      if (prod) {
        await supabase.from("agrobanker_produtores").insert({
          agrobanker_id: agrobankerId!,
          produtor_id: prod.id,
          nivel_acesso: nivelAcesso,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_carteira"] });
      toast({ title: "Produtor cadastrado e vinculado!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const conviteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agrobanker_convites" as any).insert({
        agrobanker_id: agrobankerId!,
        email: conviteEmail,
        nome_produtor: conviteNome,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_convites"] });
      toast({ title: "Convite registrado!" });
      setConviteEmail("");
      setConviteNome("");
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agrobanker_produtores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_carteira"] });
      toast({ title: "Produtor removido da carteira" });
    },
  });

  const resetForm = () => {
    setNome(""); setEmail(""); setCpfCnpj(""); setTelefone(""); setNivelAcesso("indicacao");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Carteira"
        description="Gerencie os produtores vinculados ao seu canal"
      />

      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          <Users className="mr-1 h-3 w-3" /> {produtores.length} produtor(es)
        </Badge>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Adicionar Produtor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Adicionar Produtor</DialogTitle></DialogHeader>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cadastrar"><UserPlus className="mr-1 h-3 w-3" /> Cadastrar</TabsTrigger>
                <TabsTrigger value="convidar"><Mail className="mr-1 h-3 w-3" /> Convidar</TabsTrigger>
                <TabsTrigger value="vincular"><Link2 className="mr-1 h-3 w-3" /> Vincular</TabsTrigger>
              </TabsList>

              {/* TAB: Cadastro Completo */}
              <TabsContent value="cadastrar" className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>CPF/CNPJ</Label>
                    <Input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nível de acesso</Label>
                  <Select value={nivelAcesso} onValueChange={setNivelAcesso}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="gestao_ativa">Gestão Ativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!nome || !email || cadastroMutation.isPending}
                  onClick={() => cadastroMutation.mutate()}
                >
                  {cadastroMutation.isPending ? "Cadastrando..." : "Cadastrar e Vincular"}
                </Button>
              </TabsContent>

              {/* TAB: Convite */}
              <TabsContent value="convidar" className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Envie um convite por e-mail. O produtor se cadastrará sozinho e ficará vinculado à sua carteira.
                </p>
                <div className="space-y-2">
                  <Label>Nome do produtor</Label>
                  <Input value={conviteNome} onChange={(e) => setConviteNome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={conviteEmail} onChange={(e) => setConviteEmail(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  disabled={!conviteEmail || conviteMutation.isPending}
                  onClick={() => conviteMutation.mutate()}
                >
                  {conviteMutation.isPending ? "Enviando..." : "Registrar Convite"}
                </Button>
                {convites.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Convites recentes:</p>
                    {convites.slice(0, 5).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                        <span>{c.email}</span>
                        <Badge variant={c.status === "aceito" ? "default" : "secondary"}>{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB: Vincular existente */}
              <TabsContent value="vincular" className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Busque por nome ou e-mail para vincular um produtor já cadastrado na plataforma.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nome ou email..."
                    value={searchExisting}
                    onChange={(e) => setSearchExisting(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between rounded border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{r.profile?.nome || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{r.profile?.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => linkMutation.mutate({ produtorId: r.id, nivel: "indicacao" })}
                          disabled={linkMutation.isPending}
                        >
                          <Link2 className="mr-1 h-3 w-3" /> Vincular
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {searchExisting.length >= 3 && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum produtor encontrado.</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Producers table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum produtor na carteira. Adicione seu primeiro produtor.
                  </TableCell>
                </TableRow>
              ) : (
                produtores.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.profile?.nome || "—"}</TableCell>
                    <TableCell>{p.profile?.email || "—"}</TableCell>
                    <TableCell>{p.produtores?.cpf_cnpj || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.nivel_acesso === "gestao_ativa" ? "default" : "secondary"}>
                        {p.nivel_acesso === "gestao_ativa" ? "Gestão Ativa" : "Indicação"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "ativo" ? "default" : "outline"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => unlinkMutation.mutate(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
