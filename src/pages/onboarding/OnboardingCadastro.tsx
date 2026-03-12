import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserCheck, GitBranch, ShieldCheck, ChevronRight, ChevronLeft, Check, Upload, X, FileText } from "lucide-react";
import { UF_LIST, COMPLIANCE_CHECKLIST, DOC_TYPES } from "@/types/onboarding";
import type { CadastroFormData } from "@/types/onboarding";
import { useEffect } from "react";
import type { OnboardingEmpresa } from "@/types/onboarding";

const STEPS = [
  { label: "Dados da Empresa", icon: Building2 },
  { label: "Responsável + Docs", icon: UserCheck },
  { label: "Vínculo Comercial", icon: GitBranch },
  { label: "Compliance & Ativação", icon: ShieldCheck },
];

const initialForm: CadastroFormData = {
  cnpj: "", razao_social: "", nome_fantasia: "", tipo: "subestabelecido",
  uf: "", municipio: "", endereco: "", telefone: "", email: "",
  responsavel_nome: "", responsavel_cpf: "", responsavel_email: "",
  responsavel_telefone: "", responsavel_cargo: "",
  parent_id: "00000000-0000-0000-0000-000000000001", regiao_atuacao: "", comissao_percentual: 0,
};

export default function OnboardingCadastro() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CadastroFormData>(initialForm);
  const [files, setFiles] = useState<{ tipo: string; file: File }[]>([]);
  const [parents, setParents] = useState<OnboardingEmpresa[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("onboarding_empresas")
      .select("id, nome_fantasia, razao_social, tipo")
      .in("tipo", ["master", "subestabelecido"])
      .eq("status", "ativo")
      .then(({ data }) => setParents((data as OnboardingEmpresa[]) || []));
  }, []);

  function updateForm(field: keyof CadastroFormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addFile(tipo: string, file: File) {
    setFiles((prev) => [...prev.filter((f) => f.tipo !== tipo), { tipo, file }]);
  }

  function removeFile(tipo: string) {
    setFiles((prev) => prev.filter((f) => f.tipo !== tipo));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!(form.cnpj && form.razao_social && form.tipo && form.uf);
    if (step === 1) return !!(form.responsavel_nome && form.responsavel_cpf && form.responsavel_email);
    if (step === 2) return !!form.parent_id;
    return true;
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      // 1. Create empresa
      const { data: empresa, error: empError } = await supabase
        .from("onboarding_empresas")
        .insert({
          cnpj: form.cnpj,
          razao_social: form.razao_social,
          nome_fantasia: form.nome_fantasia,
          tipo: form.tipo,
          uf: form.uf,
          municipio: form.municipio,
          endereco: form.endereco,
          telefone: form.telefone,
          email: form.email,
          parent_id: form.parent_id || null,
          regiao_atuacao: form.regiao_atuacao,
          comissao_percentual: form.comissao_percentual,
          created_by: user.user.id,
          status: "pendente",
        } as any)
        .select("id")
        .single();

      if (empError) throw empError;

      // 2. Create responsavel
      await supabase.from("onboarding_responsaveis").insert({
        empresa_id: empresa.id,
        nome: form.responsavel_nome,
        cpf: form.responsavel_cpf,
        email: form.responsavel_email,
        telefone: form.responsavel_telefone,
        cargo: form.responsavel_cargo,
      } as any);

      // 3. Upload documents
      for (const { tipo, file } of files) {
        const path = `${empresa.id}/${tipo}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("onboarding-docs")
          .upload(path, file);
        if (!upErr) {
          await supabase.from("onboarding_documentos").insert({
            empresa_id: empresa.id,
            tipo_documento: tipo,
            nome_arquivo: file.name,
            caminho_arquivo: path,
            status: "enviado",
          } as any);
        }
      }

      // 4. Create compliance checklist
      for (const item of COMPLIANCE_CHECKLIST) {
        await supabase.from("onboarding_compliance").insert({
          empresa_id: empresa.id,
          item: item.item,
          descricao: item.descricao,
          status: "pendente",
        } as any);
      }

      toast({ title: "Cadastro criado!", description: "A empresa foi registrada e está pendente de análise." });
      navigate("/onboarding/empresas");
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Novo Cadastro"
        description="Cadastre uma nova empresa no ecossistema Guatã"
        icon={<Building2 className="h-5 w-5" />}
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs text-center truncate max-w-[80px] ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 ${isDone ? "bg-primary" : "bg-muted-foreground/20"}`} />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* STEP 0: Dados da Empresa */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={(e) => updateForm("cnpj", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input value={form.razao_social} onChange={(e) => updateForm("razao_social", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input value={form.nome_fantasia} onChange={(e) => updateForm("nome_fantasia", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => updateForm("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subestabelecido">Subestabelecido</SelectItem>
                    <SelectItem value="agrobanker">Agrobanker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>UF *</Label>
                <Select value={form.uf} onValueChange={(v) => updateForm("uf", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Município</Label>
                <Input value={form.municipio} onChange={(e) => updateForm("municipio", e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={(e) => updateForm("endereco", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => updateForm("telefone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 1: Responsável + Docs */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Responsável Legal</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input value={form.responsavel_nome} onChange={(e) => updateForm("responsavel_nome", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input placeholder="000.000.000-00" value={form.responsavel_cpf} onChange={(e) => updateForm("responsavel_cpf", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.responsavel_email} onChange={(e) => updateForm("responsavel_email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={form.responsavel_telefone} onChange={(e) => updateForm("responsavel_telefone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input value={form.responsavel_cargo} onChange={(e) => updateForm("responsavel_cargo", e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Documentação</h3>
                <div className="grid gap-3">
                  {DOC_TYPES.map((doc) => {
                    const uploaded = files.find((f) => f.tipo === doc.value);
                    return (
                      <div key={doc.value} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{doc.label}</span>
                        {uploaded ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 font-medium">{uploaded.file.name}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(doc.value)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.png,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) addFile(doc.value, file);
                              }}
                            />
                            <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Upload className="h-3 w-3" /> Enviar
                            </div>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Vínculo Comercial */}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>Vinculado a *</Label>
                <Select value={form.parent_id} onValueChange={(v) => updateForm("parent_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a empresa pai" /></SelectTrigger>
                  <SelectContent>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_fantasia || p.razao_social} ({p.tipo === "master" ? "COBAN Master" : "Subestabelecido"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Região de Atuação</Label>
                <Input placeholder="Ex: Norte do Mato Grosso" value={form.regiao_atuacao} onChange={(e) => updateForm("regiao_atuacao", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={form.comissao_percentual} onChange={(e) => updateForm("comissao_percentual", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* STEP 3: Review + Compliance */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Resumo do Cadastro</h3>
                <div className="grid gap-2 text-sm bg-muted/30 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Empresa:</span>
                    <span className="font-medium">{form.nome_fantasia || form.razao_social}</span>
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span>{form.cnpj}</span>
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="capitalize">{form.tipo}</span>
                    <span className="text-muted-foreground">UF / Município:</span>
                    <span>{form.uf} - {form.municipio}</span>
                    <span className="text-muted-foreground">Responsável:</span>
                    <span>{form.responsavel_nome}</span>
                    <span className="text-muted-foreground">CPF:</span>
                    <span>{form.responsavel_cpf}</span>
                    <span className="text-muted-foreground">Documentos:</span>
                    <span>{files.length} enviado(s)</span>
                    <span className="text-muted-foreground">Vinculado a:</span>
                    <span>{parents.find((p) => p.id === form.parent_id)?.nome_fantasia || "—"}</span>
                    <span className="text-muted-foreground">Comissão:</span>
                    <span>{form.comissao_percentual}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Checklist de Compliance</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Os itens abaixo serão criados automaticamente para verificação posterior.
                </p>
                <div className="space-y-2">
                  {COMPLIANCE_CHECKLIST.map((item) => (
                    <div key={item.item} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm">
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      <span>{item.descricao}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => (step === 0 ? navigate("/onboarding") : setStep(step - 1))}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {step === 0 ? "Cancelar" : "Voltar"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
                Próximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Salvando..." : "Finalizar Cadastro"}
                <Check className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
