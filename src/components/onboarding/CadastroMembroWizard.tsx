import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onboardingDb } from "@/lib/onboarding-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCnpjLookup, useDocumentExtraction } from "@/hooks/useOnboardingAutomation";
import { ChevronLeft, ChevronRight, Check, Search, Loader2, Sparkles, User, Building2, MapPin, Phone, FileUp, Upload } from "lucide-react";
import { UF_LIST } from "@/types/onboarding";
import {
  SEGMENTOS, GENEROS, ESTADOS_CIVIS, REGIMES_CASAMENTO,
  CAPACIDADES_CIVIS, GRAUS_INSTRUCAO, TIPOS_DOCUMENTO,
  TIPOS_ENDERECO, TIPOS_IMOVEL,
} from "@/types/rede-membro";

const STEPS = [
  { label: "Tipo & Segmento", icon: User },
  { label: "Dados Pessoais", icon: User },
  { label: "Documento", icon: Building2 },
  { label: "Localização", icon: MapPin },
  { label: "Contato", icon: Phone },
  { label: "Anexos", icon: FileUp },
];

const DOC_UPLOAD_TYPES = [
  { key: "rg_cnh", label: "RG / CNH / CTPS", required: true },
  { key: "comprovante_endereco", label: "Comprovante de Endereço", required: true },
  { key: "contrato_social", label: "Contrato Social / CNPJ (PJ)", required: false, pjOnly: true },
  { key: "crea_licenca", label: "CREA / Licença Profissional", required: false, segmentos: ["engenheiro", "projetista"] },
];

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CadastroMembroWizard({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    tipo_pessoa: 'pf',
    segmento: 'agrobanker',
    nacionalidade: 'brasileira',
    tipo_documento: 'rg',
    tipo_endereco: 'residencial',
    zona_urbana: false,
    endereco_correspondencia: false,
    local_correio: false,
    imovel_proprio: false,
    pessoa_exposta_politicamente: false,
    corresp_imovel_proprio: false,
  });
  const [uploads, setUploads] = useState<Record<string, { file: File; uploading: boolean; done: boolean }>>({});
  const { toast } = useToast();
  const { lookup: lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const { extract: extractDoc, loading: extracting } = useDocumentExtraction();

  const u = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  async function handleCnpjLookup() {
    const result = await lookupCnpj(form.cnpj || '');
    if (result) {
      setForm((p) => ({
        ...p,
        razao_social: result.razao_social || p.razao_social,
        nome_fantasia: result.nome_fantasia || p.nome_fantasia,
        logradouro: result.endereco || p.logradouro,
        cidade: result.municipio || p.cidade,
        uf: result.uf || p.uf,
        telefone: result.telefone || p.telefone,
        email: result.email || p.email,
        situacao_cadastral: result.situacao_cadastral,
        dados_receita: result.dados_completos || {},
      }));
    }
  }

  async function handleFileUpload(docKey: string, file: File) {
    setUploads(prev => ({ ...prev, [docKey]: { file, uploading: true, done: false } }));
    
    // Try OCR extraction
    const extracted = await extractDoc(file, docKey);
    
    if (extracted) {
      // Auto-fill form fields based on extracted data
      setForm((p) => {
        const updates: Record<string, any> = {};
        if (extracted.cnpj && !p.cnpj) updates.cnpj = extracted.cnpj;
        if (extracted.razao_social && !p.razao_social) updates.razao_social = extracted.razao_social;
        if (extracted.nome_fantasia && !p.nome_fantasia) updates.nome_fantasia = extracted.nome_fantasia;
        if (extracted.endereco && !p.logradouro) updates.logradouro = extracted.endereco;
        if (extracted.municipio && !p.cidade) updates.cidade = extracted.municipio;
        if (extracted.uf && !p.uf) updates.uf = extracted.uf;
        if (extracted.responsavel_nome && !p.nome_completo) updates.nome_completo = extracted.responsavel_nome;
        if (extracted.responsavel_cpf && !p.cpf) updates.cpf = extracted.responsavel_cpf;
        return { ...p, ...updates };
      });
    }
    
    setUploads(prev => ({ ...prev, [docKey]: { file, uploading: false, done: true } }));
  }

  function getVisibleDocTypes() {
    return DOC_UPLOAD_TYPES.filter(d => {
      if (d.pjOnly && form.tipo_pessoa !== 'pj') return false;
      if (d.segmentos && !d.segmentos.includes(form.segmento)) return false;
      return true;
    });
  }

  function canAdvance(): boolean {
    if (step === 0) return !!(form.tipo_pessoa && form.segmento);
    if (step === 1) return !!(form.nome_completo && (form.tipo_pessoa === 'pf' ? form.cpf : form.cnpj));
    return true;
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      const { data: empresas } = await (onboardingDb as any).empresas()
        .select("id")
        .eq("user_id", user.user.id)
        .limit(1);

      let empresaId = empresas?.[0]?.id;

      if (!empresaId) {
        const { data: created } = await (onboardingDb as any).empresas()
          .select("id")
          .eq("created_by", user.user.id)
          .limit(1);
        empresaId = created?.[0]?.id;
      }

      if (!empresaId) {
        const { data: master } = await (onboardingDb as any).empresas()
          .select("id")
          .eq("tipo", "master")
          .limit(1);
        empresaId = master?.[0]?.id;
      }

      if (!empresaId) throw new Error("Nenhuma empresa vinculada encontrada");

      // Insert member
      const { data: membro, error } = await (onboardingDb as any).redeMembros()
        .insert({
          empresa_id: empresaId,
          created_by: user.user.id,
          ...form,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Upload documents to storage and register
      const uploadedDocs = Object.entries(uploads).filter(([_, v]) => v.done && v.file);
      for (const [docKey, { file }] of uploadedDocs) {
        const filePath = `rede/${membro.id}/${docKey}_${Date.now()}_${file.name}`;
        const { error: storageError } = await onboardingDb.storage().upload(filePath, file);
        if (!storageError) {
          await (onboardingDb as any).redeDocumentos().insert({
            membro_id: membro.id,
            tipo_documento: docKey,
            nome_arquivo: file.name,
            caminho_arquivo: filePath,
          });
        }
      }

      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar membro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all text-xs ${
                  isDone ? "bg-primary border-primary text-primary-foreground"
                    : isActive ? "border-primary text-primary bg-primary/10"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}>
                  {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </div>
                <span className={`text-[10px] text-center truncate max-w-[60px] ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mb-5 mx-1 ${isDone ? "bg-primary" : "bg-muted-foreground/20"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 0: Tipo & Segmento */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Pessoa</Label>
            <RadioGroup value={form.tipo_pessoa} onValueChange={(v) => u('tipo_pessoa', v)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pf" id="pf" />
                <Label htmlFor="pf">Pessoa Física</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pj" id="pj" />
                <Label htmlFor="pj">Pessoa Jurídica</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Segmento *</Label>
            <Select value={form.segmento} onValueChange={(v) => u('segmento', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.segmento === 'outro' && (
            <div className="space-y-2">
              <Label>Especifique o segmento</Label>
              <Input value={form.segmento_outro || ''} onChange={(e) => u('segmento_outro', e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Step 1: Dados Pessoais */}
      {step === 1 && (
        <div className="space-y-4">
          {form.tipo_pessoa === 'pj' && (
            <div className="space-y-4 pb-4 border-b">
              <h4 className="font-semibold text-primary">Dados da Empresa</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>CNPJ *</Label>
                  <div className="flex gap-2">
                    <Input placeholder="00.000.000/0001-00" value={form.cnpj || ''} onChange={(e) => u('cnpj', e.target.value)} className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={handleCnpjLookup} disabled={cnpjLoading}>
                      {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /><Sparkles className="h-3 w-3" /></>}
                    </Button>
                  </div>
                  {form.situacao_cadastral && (
                    <p className={`text-xs p-1.5 rounded ${form.situacao_cadastral === 'ATIVA' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      Situação: <strong>{form.situacao_cadastral}</strong>
                    </p>
                  )}
                </div>
                <div className="space-y-2"><Label>Razão Social</Label><Input value={form.razao_social || ''} onChange={(e) => u('razao_social', e.target.value)} /></div>
                <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia || ''} onChange={(e) => u('nome_fantasia', e.target.value)} /></div>
                <div className="space-y-2"><Label>Inscrição Estadual</Label><Input value={form.inscricao_estadual || ''} onChange={(e) => u('inscricao_estadual', e.target.value)} /></div>
              </div>
            </div>
          )}

          <h4 className="font-semibold text-primary">{form.tipo_pessoa === 'pj' ? 'Responsável Legal' : 'Dados Pessoais'}</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2"><Label>Nome Completo *</Label><Input value={form.nome_completo || ''} onChange={(e) => u('nome_completo', e.target.value)} /></div>
            <div className="space-y-2"><Label>CPF *</Label><Input placeholder="000.000.000-00" value={form.cpf || ''} onChange={(e) => u('cpf', e.target.value)} /></div>
            <div className="space-y-2"><Label>Nome da Mãe</Label><Input value={form.nome_mae || ''} onChange={(e) => u('nome_mae', e.target.value)} /></div>
            <div className="space-y-2"><Label>Nome do Pai</Label><Input value={form.nome_pai || ''} onChange={(e) => u('nome_pai', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select value={form.genero || ''} onValueChange={(v) => u('genero', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{GENEROS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nacionalidade</Label><Input value={form.nacionalidade || 'brasileira'} onChange={(e) => u('nacionalidade', e.target.value)} /></div>
            <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" value={form.data_nascimento || ''} onChange={(e) => u('data_nascimento', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Estado Civil</Label>
              <Select value={form.estado_civil || ''} onValueChange={(v) => u('estado_civil', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{ESTADOS_CIVIS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {(form.estado_civil === 'casado' || form.estado_civil === 'uniao_estavel') && (
              <>
                <div className="space-y-2">
                  <Label>Regime de Casamento</Label>
                  <Select value={form.regime_casamento || ''} onValueChange={(v) => u('regime_casamento', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{REGIMES_CASAMENTO.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>CPF Cônjuge</Label><Input value={form.cpf_conjuge || ''} onChange={(e) => u('cpf_conjuge', e.target.value)} /></div>
                <div className="space-y-2"><Label>Nome Cônjuge</Label><Input value={form.nome_conjuge || ''} onChange={(e) => u('nome_conjuge', e.target.value)} /></div>
              </>
            )}
            <div className="space-y-2">
              <Label>Capacidade Civil</Label>
              <Select value={form.capacidade_civil || ''} onValueChange={(v) => u('capacidade_civil', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{CAPACIDADES_CIVIS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grau de Instrução</Label>
              <Select value={form.grau_instrucao || ''} onValueChange={(v) => u('grau_instrucao', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{GRAUS_INSTRUCAO.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch checked={form.pessoa_exposta_politicamente || false} onCheckedChange={(v) => u('pessoa_exposta_politicamente', v)} />
              <Label>Pessoa Exposta Politicamente</Label>
            </div>
          </div>

          {(form.segmento === 'engenheiro' || form.segmento === 'projetista') && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-primary">Dados Profissionais</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2"><Label>CREA</Label><Input value={form.crea || ''} onChange={(e) => u('crea', e.target.value)} /></div>
                <div className="space-y-2"><Label>Tipo de Licença</Label><Input value={form.tipo_licenca || ''} onChange={(e) => u('tipo_licenca', e.target.value)} /></div>
                <div className="space-y-2"><Label>Nº Licença</Label><Input value={form.numero_licenca || ''} onChange={(e) => u('numero_licenca', e.target.value)} /></div>
                <div className="sm:col-span-3 space-y-2"><Label>Área de Atuação</Label><Input value={form.area_atuacao || ''} onChange={(e) => u('area_atuacao', e.target.value)} /></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Documento de Identificação */}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-primary">Documento de Identificação</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={form.tipo_documento || 'rg'} onValueChange={(v) => u('tipo_documento', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_DOCUMENTO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.documento_uf || ''} onValueChange={(v) => u('documento_uf', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cidade</Label><Input value={form.documento_cidade || ''} onChange={(e) => u('documento_cidade', e.target.value)} /></div>
            <div className="space-y-2"><Label>Órgão Emissor</Label><Input value={form.documento_orgao_emissor || ''} onChange={(e) => u('documento_orgao_emissor', e.target.value)} /></div>
            <div className="space-y-2"><Label>Número do Documento</Label><Input value={form.numero_documento || ''} onChange={(e) => u('numero_documento', e.target.value)} /></div>
            <div className="space-y-2"><Label>Número da Via</Label><Input value={form.documento_numero_via || ''} onChange={(e) => u('documento_numero_via', e.target.value)} /></div>
            {form.tipo_documento === 'identidade_indigena' && (
              <div className="space-y-2"><Label>Unidade FUNAI</Label><Input value={form.documento_unidade_funai || ''} onChange={(e) => u('documento_unidade_funai', e.target.value)} /></div>
            )}
            <div className="space-y-2"><Label>Número Registro</Label><Input value={form.documento_numero_registro || ''} onChange={(e) => u('documento_numero_registro', e.target.value)} /></div>
            <div className="space-y-2"><Label>Data de Emissão</Label><Input type="date" value={form.documento_data_emissao || ''} onChange={(e) => u('documento_data_emissao', e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Step 3: Localização */}
      {step === 3 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-primary">Localização</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Endereço</Label>
              <Select value={form.tipo_endereco || 'residencial'} onValueChange={(v) => u('tipo_endereco', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_ENDERECO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Comprovante de Endereço</Label><Input value={form.comprovante_endereco || ''} onChange={(e) => u('comprovante_endereco', e.target.value)} placeholder="Tipo do comprovante" /></div>
            <div className="space-y-2"><Label>Tempo de Utilização (meses)</Label><Input type="number" value={form.tempo_utilizacao_meses || 0} onChange={(e) => u('tempo_utilizacao_meses', parseInt(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>CEP</Label><Input value={form.cep || ''} onChange={(e) => u('cep', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.uf || ''} onValueChange={(v) => u('uf', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cidade</Label><Input value={form.cidade || ''} onChange={(e) => u('cidade', e.target.value)} /></div>
            <div className="space-y-2"><Label>Bairro</Label><Input value={form.bairro || ''} onChange={(e) => u('bairro', e.target.value)} /></div>
            <div className="space-y-2"><Label>Logradouro</Label><Input value={form.logradouro || ''} onChange={(e) => u('logradouro', e.target.value)} /></div>
            <div className="space-y-2"><Label>Perímetro</Label><Input value={form.perimetro || ''} onChange={(e) => u('perimetro', e.target.value)} /></div>
            <div className="space-y-2"><Label>Número</Label><Input value={form.numero || ''} onChange={(e) => u('numero', e.target.value)} /></div>
            <div className="sm:col-span-2 space-y-2"><Label>Complemento/Distrito/Comunidade</Label><Input value={form.complemento || ''} onChange={(e) => u('complemento', e.target.value)} /></div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center space-x-2"><Switch checked={form.zona_urbana || false} onCheckedChange={(v) => u('zona_urbana', v)} /><Label>Zona Urbana</Label></div>
            <div className="flex items-center space-x-2"><Switch checked={form.endereco_correspondencia || false} onCheckedChange={(v) => u('endereco_correspondencia', v)} /><Label>Endereço Correspondência</Label></div>
            <div className="flex items-center space-x-2"><Switch checked={form.local_correio || false} onCheckedChange={(v) => u('local_correio', v)} /><Label>Local Correio</Label></div>
            <div className="flex items-center space-x-2"><Switch checked={form.imovel_proprio || false} onCheckedChange={(v) => u('imovel_proprio', v)} /><Label>Imóvel Próprio</Label></div>
          </div>

          {!form.imovel_proprio && (
            <div className="space-y-2">
              <Label>Tipo de Imóvel</Label>
              <Select value={form.tipo_imovel || ''} onValueChange={(v) => u('tipo_imovel', v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{TIPOS_IMOVEL.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {form.endereco_correspondencia && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-primary">Endereço de Correspondência</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2"><Label>CEP</Label><Input value={form.corresp_cep || ''} onChange={(e) => u('corresp_cep', e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.corresp_uf || ''} onValueChange={(v) => u('corresp_uf', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={form.corresp_cidade || ''} onChange={(e) => u('corresp_cidade', e.target.value)} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={form.corresp_bairro || ''} onChange={(e) => u('corresp_bairro', e.target.value)} /></div>
                <div className="space-y-2"><Label>Logradouro</Label><Input value={form.corresp_logradouro || ''} onChange={(e) => u('corresp_logradouro', e.target.value)} /></div>
                <div className="space-y-2"><Label>Perímetro</Label><Input value={form.corresp_perimetro || ''} onChange={(e) => u('corresp_perimetro', e.target.value)} /></div>
                <div className="space-y-2"><Label>Número</Label><Input value={form.corresp_numero || ''} onChange={(e) => u('corresp_numero', e.target.value)} /></div>
                <div className="sm:col-span-2 space-y-2"><Label>Complemento</Label><Input value={form.corresp_complemento || ''} onChange={(e) => u('corresp_complemento', e.target.value)} /></div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center space-x-2"><Switch checked={form.corresp_imovel_proprio || false} onCheckedChange={(v) => u('corresp_imovel_proprio', v)} /><Label>Imóvel Próprio</Label></div>
                {!form.corresp_imovel_proprio && (
                  <div className="space-y-2">
                    <Select value={form.corresp_tipo_imovel || ''} onValueChange={(v) => u('corresp_tipo_imovel', v)}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo Imóvel" /></SelectTrigger>
                      <SelectContent>{TIPOS_IMOVEL.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Contato */}
      {step === 4 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-primary">Contatos</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2"><Label>DDD</Label><Input placeholder="00" value={form.ddd || ''} onChange={(e) => u('ddd', e.target.value)} className="w-20" /></div>
            <div className="sm:col-span-2 space-y-2"><Label>Número do Telefone</Label><Input value={form.telefone || ''} onChange={(e) => u('telefone', e.target.value)} /></div>
          </div>
          <div className="pt-2">
            <h4 className="font-semibold text-primary mb-3">Email</h4>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email || ''} onChange={(e) => u('email', e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Step 5: Anexos / Document Upload */}
      {step === 5 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-primary">Documentos Obrigatórios</h4>
          <p className="text-xs text-muted-foreground">Faça o upload dos documentos. A IA extrairá dados automaticamente para preencher campos do cadastro.</p>
          
          <div className="space-y-3">
            {getVisibleDocTypes().map((doc) => {
              const upload = uploads[doc.key];
              return (
                <div key={doc.key} className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{doc.label}</span>
                      {doc.required && <Badge variant="destructive" className="text-[9px] px-1 py-0">Obrigatório</Badge>}
                    </div>
                    {upload?.done && (
                      <p className="text-xs text-muted-foreground truncate">{upload.file.name}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {upload?.uploading || (extracting && upload?.file) ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span>Extraindo...</span>
                      </div>
                    ) : upload?.done ? (
                      <Badge variant="outline" className="text-primary border-primary"><Check className="h-3 w-3 mr-1" />Enviado</Badge>
                    ) : (
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.key, file);
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span><Upload className="h-3 w-3 mr-1" />Upload</span>
                        </Button>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>
          <ChevronLeft className="mr-1 h-4 w-4" />{step === 0 ? "Cancelar" : "Voltar"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>Próximo<ChevronRight className="ml-1 h-4 w-4" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Salvando..." : "Finalizar Cadastro"}<Check className="ml-1 h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
