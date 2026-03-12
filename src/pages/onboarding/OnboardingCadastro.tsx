import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { onboardingDb } from "@/lib/onboarding-db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCnpjLookup, useDocumentExtraction } from "@/hooks/useOnboardingAutomation";
import { Building2, UserCheck, GitBranch, ShieldCheck, ChevronRight, ChevronLeft, Check, Upload, X, FileText, Search, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { UF_LIST, COMPLIANCE_CHECKLIST, DOC_TYPES } from "@/types/onboarding";
import type { CadastroFormData, OnboardingEmpresa } from "@/types/onboarding";

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
  const [files, setFiles] = useState<{ tipo: string; file: File; extracted?: Record<string, any> }[]>([]);
  const [parents, setParents] = useState<OnboardingEmpresa[]>([]);
  const [saving, setSaving] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<{ situacao: string; ativa: boolean } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lookup: lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const { extract: extractDoc, loading: extracting } = useDocumentExtraction();

  useEffect(() => {
    onboardingDb.empresas()
      .select("id, nome_fantasia, razao_social, tipo")
      .in("tipo", ["master", "subestabelecido"])
      .eq("status", "ativo")
      .then(({ data }: any) => setParents((data as OnboardingEmpresa[]) || []));
  }, []);

  function updateForm(field: keyof CadastroFormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCnpjLookup() {
    const result = await lookupCnpj(form.cnpj);
    if (result) {
      setForm((prev) => ({
        ...prev,
        razao_social: result.razao_social || prev.razao_social,
        nome_fantasia: result.nome_fantasia || prev.nome_fantasia,
        endereco: result.endereco || prev.endereco,
        municipio: result.municipio || prev.municipio,
        uf: result.uf || prev.uf,
        telefone: result.telefone || prev.telefone,
        email: result.email || prev.email,
      }));
      setCnpjStatus({
        situacao: result.situacao_cadastral,
        ativa: result.situacao_cadastral === "ATIVA",
      });
    }
  }

  async function handleFileUpload(tipo: string, file: File) {
    setFiles((prev) => [...prev.filter((f) => f.tipo !== tipo), { tipo, file }]);

    // Auto-extract data from uploaded document
    const extracted = await extractDoc(file, tipo);
    if (extracted) {
      setFiles((prev) =>
        prev.map((f) => (f.tipo === tipo ? { ...f, extracted } : f))
      );

      // Auto-fill form fields from extracted data
      setForm((prev) => ({
        ...prev,
        ...(extracted.cnpj && !prev.cnpj ? { cnpj: extracted.cnpj } : {}),
        ...(extracted.razao_social && !prev.razao_social ? { razao_social: extracted.razao_social } : {}),
        ...(extracted.nome_fantasia && !prev.nome_fantasia ? { nome_fantasia: extracted.nome_fantasia } : {}),
        ...(extracted.endereco && !prev.endereco ? { endereco: extracted.endereco } : {}),
        ...(extracted.municipio && !prev.municipio ? { municipio: extracted.municipio } : {}),
        ...(extracted.uf && !prev.uf ? { uf: extracted.uf } : {}),
        ...(extracted.responsavel_nome && !prev.responsavel_nome ? { responsavel_nome: extracted.responsavel_nome } : {}),
        ...(extracted.responsavel_cpf && !prev.responsavel_cpf ? { responsavel_cpf: extracted.responsavel_cpf } : {}),
      }));

      toast({ title: "Dados extraídos do documento", description: "Campos preenchidos automaticamente. Verifique e ajuste se necessário." });
    }
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

      const { data: empresa, error: empError } = await onboardingDb.empresas()
        .insert({
          cnpj: form.cnpj, razao_social: form.razao_social, nome_fantasia: form.nome_fantasia,
          tipo: form.tipo, uf: form.uf, municipio: form.municipio, endereco: form.endereco,
          telefone: form.telefone, email: form.email, parent_id: form.parent_id || null,
          regiao_atuacao: form.regiao_atuacao, comissao_percentual: form.comissao_percentual,
          created_by: user.user.id, status: "pendente",
          ...(cnpjStatus ? { situacao_cadastral: cnpjStatus.situacao } : {}),
        })
        .select("id")
        .single();

      if (empError) throw empError;

      await onboardingDb.responsaveis().insert({
        empresa_id: empresa.id, nome: form.responsavel_nome, cpf: form.responsavel_cpf,
        email: form.responsavel_email, telefone: form.responsavel_telefone, cargo: form.responsavel_cargo,
      });

      for (const { tipo, file, extracted } of files) {
        const path = `${empresa.id}/${tipo}-${file.name}`;
        const { error: upErr } = await onboardingDb.storage().upload(path, file);
        if (!upErr) {
          await onboardingDb.documentos().insert({
            empresa_id: empresa.id, tipo_documento: tipo, nome_arquivo: file.name,
            caminho_arquivo: path, status: "enviado",
            dados_extraidos: extracted || {},
            data_validade: extracted?.data_validade || null,
            data_emissao: extracted?.data_emissao || null,
            orgao_emissor: extracted?.orgao_emissor || "",
          });
        }
      }

      for (const item of COMPLIANCE_CHECKLIST) {
        await onboardingDb.compliance().insert({
          empresa_id: empresa.id, item: item.item, descricao: item.descricao, status: "pendente",
          fonte_validacao: "manual",
        });
      }

      // Trigger automatic compliance validation
      try {
        await supabase.functions.invoke("validate-compliance", {
          body: { empresa_id: empresa.id, cnpj: form.cnpj, action: "validate_all" },
        });
      } catch {
        // Non-blocking - validation can be retried later
      }

      toast({ title: "Cadastro criado!", description: "A empresa foi registrada. Validações automáticas em andamento." });
      navigate("/onboarding/empresas");
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title="Novo Cadastro" description="Cadastre uma nova empresa no ecossistema Guatã" icon={<Building2 className="h-5 w-5" />} />

      {/* Step Indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isDone ? "bg-primary border-primary text-primary-foreground"
                    : isActive ? "border-primary text-primary bg-primary/10"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}>
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
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>CNPJ *</Label>
                <div className="flex gap-2">
                  <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={(e) => updateForm("cnpj", e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" onClick={handleCnpjLookup} disabled={cnpjLoading || !form.cnpj}>
                    {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-1 hidden sm:inline">Consultar</span>
                  </Button>
                </div>
                {cnpjStatus && (
                  <div className={`flex items-center gap-2 text-xs p-2 rounded ${cnpjStatus.ativa ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {cnpjStatus.ativa ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    Situação cadastral: <strong>{cnpjStatus.situacao}</strong>
                  </div>
                )}
              </div>
              <div className="space-y-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => updateForm("razao_social", e.target.value)} /></div>
              <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => updateForm("nome_fantasia", e.target.value)} /></div>
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
                  <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Município</Label><Input value={form.municipio} onChange={(e) => updateForm("municipio", e.target.value)} /></div>
              <div className="sm:col-span-2 space-y-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => updateForm("endereco", e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => updateForm("telefone", e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Responsável Legal</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Nome Completo *</Label><Input value={form.responsavel_nome} onChange={(e) => updateForm("responsavel_nome", e.target.value)} /></div>
                  <div className="space-y-2"><Label>CPF *</Label><Input placeholder="000.000.000-00" value={form.responsavel_cpf} onChange={(e) => updateForm("responsavel_cpf", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.responsavel_email} onChange={(e) => updateForm("responsavel_email", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.responsavel_telefone} onChange={(e) => updateForm("responsavel_telefone", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Cargo</Label><Input value={form.responsavel_cargo} onChange={(e) => updateForm("responsavel_cargo", e.target.value)} /></div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold">Documentação</h3>
                  {extracting && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Extraindo dados...
                    </span>
                  )}
                </div>
                <div className="grid gap-3">
                  {DOC_TYPES.map((doc) => {
                    const uploaded = files.find((f) => f.tipo === doc.value);
                    return (
                      <div key={doc.value} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{doc.label}</span>
                          {uploaded?.extracted && (
                            <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Dados extraídos automaticamente
                            </p>
                          )}
                        </div>
                        {uploaded ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-medium truncate max-w-[120px]">{uploaded.file.name}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(doc.value)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input type="file" className="hidden" accept=".pdf,.jpg,.png,.jpeg"
                              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(doc.value, file); }}
                              disabled={extracting} />
                            <div className="flex items-center gap-1 text-xs text-primary hover:underline"><Upload className="h-3 w-3" /> Enviar</div>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
              <div className="space-y-2"><Label>Região de Atuação</Label><Input placeholder="Ex: Norte do Mato Grosso" value={form.regiao_atuacao} onChange={(e) => updateForm("regiao_atuacao", e.target.value)} /></div>
              <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" min={0} max={100} step={0.5} value={form.comissao_percentual} onChange={(e) => updateForm("comissao_percentual", parseFloat(e.target.value) || 0)} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Resumo do Cadastro</h3>
                <div className="grid gap-2 text-sm bg-muted/30 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Empresa:</span><span className="font-medium">{form.nome_fantasia || form.razao_social}</span>
                    <span className="text-muted-foreground">CNPJ:</span><span>{form.cnpj}</span>
                    <span className="text-muted-foreground">Tipo:</span><span className="capitalize">{form.tipo}</span>
                    <span className="text-muted-foreground">UF / Município:</span><span>{form.uf} - {form.municipio}</span>
                    <span className="text-muted-foreground">Responsável:</span><span>{form.responsavel_nome}</span>
                    <span className="text-muted-foreground">CPF:</span><span>{form.responsavel_cpf}</span>
                    <span className="text-muted-foreground">Documentos:</span><span>{files.length} enviado(s)</span>
                    <span className="text-muted-foreground">Vinculado a:</span><span>{parents.find((p) => p.id === form.parent_id)?.nome_fantasia || "—"}</span>
                    <span className="text-muted-foreground">Comissão:</span><span>{form.comissao_percentual}%</span>
                    {cnpjStatus && (
                      <>
                        <span className="text-muted-foreground">Receita Federal:</span>
                        <span className={cnpjStatus.ativa ? "text-primary font-medium" : "text-destructive font-medium"}>
                          {cnpjStatus.situacao}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Checklist de Compliance</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Os itens abaixo serão validados automaticamente junto aos órgãos reguladores. Você também pode fazer a validação manual a qualquer momento.
                </p>
                <div className="space-y-2">
                  {COMPLIANCE_CHECKLIST.map((item) => {
                    const docExtracted = files.some(f => f.extracted);
                    const hasCnpjCheck = cnpjStatus && item.item === "cnpj_valido";
                    return (
                      <div key={item.item} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm">
                        <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          hasCnpjCheck && cnpjStatus.ativa ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                        }`}>
                          {hasCnpjCheck && cnpjStatus.ativa && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1">{item.descricao}</span>
                        {hasCnpjCheck && (
                          <span className={`text-xs px-2 py-0.5 rounded ${cnpjStatus.ativa ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                            Auto ✓
                          </span>
                        )}
                        {!hasCnpjCheck && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                            {docExtracted ? "Auto + Manual" : "Manual"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => (step === 0 ? navigate("/onboarding") : setStep(step - 1))}>
              <ChevronLeft className="mr-1 h-4 w-4" />{step === 0 ? "Cancelar" : "Voltar"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>Próximo<ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>{saving ? "Salvando..." : "Finalizar Cadastro"}<Check className="ml-1 h-4 w-4" /></Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
