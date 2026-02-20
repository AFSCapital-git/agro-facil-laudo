import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Camera, CheckCircle2, Clock, Pen, ShieldCheck, Download, MapPin, AlertTriangle, Info } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  em_vistoria: { label: "Em vistoria", variant: "secondary" },
  aguardando_assinatura: { label: "Aguardando assinatura", variant: "outline" },
  finalizado: { label: "Finalizado", variant: "default" },
};

interface ChecklistForm {
  situacao_cultura: string;
  tipo_solo: string;
  historico_produtividade: string;
  disponibilidade_hidrica: string;
  riscos_identificados: string;
  garantias_observadas: string;
  recomendacoes_tecnicas: string;
  resumo_viabilidade: string;
  parecer_final: string;
  observacoes_adicionais: string;
  pronaf_produto_confirmado_id: string;
}

function MidiaImage({ midia }: { midia: any }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("laudo-media").createSignedUrl(midia.url_arquivo, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [midia.url_arquivo]);
  if (!url) return <div className="rounded-md bg-muted aspect-square animate-pulse" />;
  return <img src={url} alt={midia.descricao || "Foto"} className="rounded-md object-cover aspect-square w-full" />;
}

function MidiaPdfLink({ midia }: { midia: any }) {
  const handleClick = async () => {
    const { data } = await supabase.storage.from("laudo-media").createSignedUrl(midia.url_arquivo, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  return (
    <div
      onClick={handleClick}
      className="rounded-md bg-muted aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors p-2"
    >
      <FileText className="h-6 w-6 text-muted-foreground" />
      <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">{midia.descricao || "PDF"}</span>
    </div>
  );
}

export default function MeusLaudos() {
  const [selectedLaudo, setSelectedLaudo] = useState<any | null>(null);
  const [form, setForm] = useState<ChecklistForm>({
    situacao_cultura: "",
    tipo_solo: "",
    historico_produtividade: "",
    disponibilidade_hidrica: "",
    riscos_identificados: "",
    garantias_observadas: "",
    recomendacoes_tecnicas: "",
    resumo_viabilidade: "",
    parecer_final: "",
    observacoes_adicionais: "",
    pronaf_produto_confirmado_id: "",
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [signConfirm, setSignConfirm] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: laudos, isLoading } = useQuery({
    queryKey: ["meus_laudos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laudos")
        .select("*, solicitacoes_laudo(cultura_principal, area_cultivo_ha, valor_solicitado, pronaf_produto_id, propriedades(nome_propriedade, endereco, latitude, longitude))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: midias } = useQuery({
    queryKey: ["midias_laudo", selectedLaudo?.id],
    enabled: !!selectedLaudo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("midia_laudo")
        .select("*")
        .eq("laudo_id", selectedLaudo.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: pronafProdutos } = useQuery({
    queryKey: ["pronaf_produtos_ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_produtos")
        .select("id, nome, finalidade")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Documents for the confirmed product
  const confirmedProductId = form.pronaf_produto_confirmado_id || (selectedLaudo as any)?.solicitacoes_laudo?.pronaf_produto_id;
  const { data: pronafDocumentos } = useQuery({
    queryKey: ["pronaf_documentos_laudo", confirmedProductId],
    enabled: !!confirmedProductId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_documentos")
        .select("*")
        .eq("produto_id", confirmedProductId)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const openLaudo = (laudo: any) => {
    setSelectedLaudo(laudo);
    setSignConfirm(false);
    setForm({
      situacao_cultura: laudo.situacao_cultura || "",
      tipo_solo: laudo.tipo_solo || "",
      historico_produtividade: laudo.historico_produtividade || "",
      disponibilidade_hidrica: laudo.disponibilidade_hidrica || "",
      riscos_identificados: laudo.riscos_identificados || "",
      garantias_observadas: laudo.garantias_observadas || "",
      recomendacoes_tecnicas: laudo.recomendacoes_tecnicas || "",
      resumo_viabilidade: laudo.resumo_viabilidade || "",
      parecer_final: laudo.parecer_final || "",
      observacoes_adicionais: laudo.observacoes_adicionais || "",
      pronaf_produto_confirmado_id: laudo.pronaf_produto_confirmado_id || "",
    });
  };

  // Geolocation: start visit
  const iniciarVistoriaMutation = useMutation({
    mutationFn: async () => {
      return new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocalização não suportada pelo navegador."));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const prop = (selectedLaudo as any)?.solicitacoes_laudo?.propriedades;
            
            // Check distance if property has coordinates
            if (prop?.latitude && prop?.longitude) {
              const dist = haversineDistance(latitude, longitude, prop.latitude, prop.longitude);
              if (dist > 500) {
                reject(new Error(`Você está a ${Math.round(dist)}m da propriedade. Aproxime-se (máx. 500m) para iniciar a vistoria.`));
                return;
              }
            }

            const { error } = await supabase
              .from("laudos")
              .update({
                latitude_inicio_vistoria: latitude,
                longitude_inicio_vistoria: longitude,
                data_hora_inicio_vistoria: new Date().toISOString(),
                data_visita_efetiva: new Date().toISOString().split("T")[0],
              })
              .eq("id", selectedLaudo.id);
            if (error) { reject(error); return; }
            resolve();
          },
          (err) => reject(new Error(`Erro ao obter localização: ${err.message}`)),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meus_laudos"] });
      toast({ title: "Vistoria iniciada! Localização registrada." });
      // Refresh selected laudo
      const updated = { ...selectedLaudo, data_hora_inicio_vistoria: new Date().toISOString() };
      setSelectedLaudo(updated);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { pronaf_produto_confirmado_id, ...rest } = form;
      const { error } = await supabase
        .from("laudos")
        .update({
          ...rest,
          pronaf_produto_confirmado_id: pronaf_produto_confirmado_id || null,
        })
        .eq("id", selectedLaudo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meus_laudos"] });
      toast({ title: "Laudo salvo!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async () => {
      const { pronaf_produto_confirmado_id, ...rest } = form;
      const { error } = await supabase
        .from("laudos")
        .update({ ...rest, pronaf_produto_confirmado_id: pronaf_produto_confirmado_id || null, status_laudo: "aguardando_assinatura" })
        .eq("id", selectedLaudo.id);
      if (error) throw error;

      const { error: solErr } = await supabase
        .from("solicitacoes_laudo")
        .update({ status_solicitacao: "aguardando_assinatura" })
        .eq("id", selectedLaudo.solicitacao_id);
      if (solErr) throw solErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meus_laudos"] });
      toast({ title: "Vistoria concluída! Laudo aguardando assinatura." });
      setSelectedLaudo(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const content = JSON.stringify({
        laudo_id: selectedLaudo.id,
        ...form,
        timestamp: new Date().toISOString(),
      });
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const { data: engId } = await supabase.rpc("get_engenheiro_id");

      const { error: sigErr } = await supabase.from("assinatura_laudo").insert({
        laudo_id: selectedLaudo.id,
        engenheiro_id: engId!,
        hash_assinatura: hashHex,
        tipo_assinatura: "simples_mvp",
        ip_assinatura: "",
      });
      if (sigErr) throw sigErr;

      const { error: laudoErr } = await supabase
        .from("laudos")
        .update({ status_laudo: "finalizado" })
        .eq("id", selectedLaudo.id);
      if (laudoErr) throw laudoErr;

      const { error: solErr } = await supabase
        .from("solicitacoes_laudo")
        .update({ status_solicitacao: "finalizada" })
        .eq("id", selectedLaudo.solicitacao_id);
      if (solErr) throw solErr;

      try {
        await supabase.functions.invoke("generate-laudo-pdf", {
          body: { laudo_id: selectedLaudo.id },
        });
      } catch {
        console.warn("PDF generation failed, can be retried later");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meus_laudos"] });
      toast({ title: "Laudo assinado e finalizado com sucesso!" });
      setSelectedLaudo(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro na assinatura", description: err.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!photoFiles.length) return;
      for (const file of photoFiles) {
        const ext = file.name.split(".").pop();
        const filePath = `${selectedLaudo.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("laudo-media")
          .upload(filePath, file);
        if (upErr) throw upErr;

        const tipo = file.type.startsWith("image/") ? "foto" : "documento";

        const { error: dbErr } = await supabase.from("midia_laudo").insert({
          laudo_id: selectedLaudo.id,
          url_arquivo: filePath,
          tipo,
          descricao: file.name,
        });
        if (dbErr) throw dbErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["midias_laudo", selectedLaudo?.id] });
      setPhotoFiles([]);
      toast({ title: `${photoFiles.length} arquivo(s) enviado(s)!` });
    },
    onError: (err: Error) => {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    },
  });

  const handleDownloadPdf = async (laudoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const laudo = laudos?.find((l) => l.id === laudoId);
    if (!laudo?.caminho_pdf_laudo) {
      toast({ title: "PDF ainda não gerado." });
      return;
    }
    const { data } = await supabase.storage.from("laudo-pdfs").createSignedUrl(laudo.caminho_pdf_laudo, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const set = (field: keyof ChecklistForm) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const isEditable = selectedLaudo?.status_laudo === "em_vistoria";
  const isAwaitingSignature = selectedLaudo?.status_laudo === "aguardando_assinatura";
  const hasStartedVisit = !!selectedLaudo?.data_hora_inicio_vistoria;
  const isOverDeadline = selectedLaudo?.data_limite_visita && new Date(selectedLaudo.data_limite_visita) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meus Laudos</h1>
        <p className="text-muted-foreground">Gerencie seus laudos e vistorias.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !laudos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum laudo encontrado. Aceite uma demanda para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {laudos.map((l) => {
            const sol = (l as any).solicitacoes_laudo;
            const prop = sol?.propriedades;
            const st = statusLabels[l.status_laudo] || { label: l.status_laudo, variant: "outline" as const };
            const deadlineDate = l.data_limite_visita ? new Date(l.data_limite_visita) : null;
            const overDeadline = deadlineDate && deadlineDate < new Date() && l.status_laudo === "em_vistoria";
            return (
              <Card key={l.id} className="cursor-pointer hover:ring-1 hover:ring-ring transition-shadow" onClick={() => openLaudo(l)}>
                <CardContent className="flex items-center gap-4 py-4">
                  {l.status_laudo === "finalizado" ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : overDeadline ? (
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{prop?.nome_propriedade}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {l.data_hora_inicio_vistoria && <Badge variant="outline" className="text-xs">Visita iniciada</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sol?.cultura_principal} · {sol?.area_cultivo_ha} ha
                      {deadlineDate && l.status_laudo === "em_vistoria" && (
                        <span className={overDeadline ? " text-destructive font-medium" : ""}>
                          {" "}· Prazo: {deadlineDate.toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.status_laudo === "finalizado" && l.caminho_pdf_laudo && (
                      <Button size="icon" variant="ghost" onClick={(e) => handleDownloadPdf(l.id, e)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Laudo detail dialog */}
      <Dialog open={!!selectedLaudo} onOpenChange={(v) => { if (!v) setSelectedLaudo(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {isAwaitingSignature ? (
                <><ShieldCheck className="h-5 w-5" /> Assinar Laudo</>
              ) : (
                <><Pen className="h-5 w-5" /> {isEditable ? "Checklist de Vistoria" : "Detalhes do Laudo"}</>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Geolocation start button */}
            {isEditable && !hasStartedVisit && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Iniciar Vistoria
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aproxime-se da propriedade (até 500m) e ative sua localização para iniciar a vistoria.
                  {selectedLaudo?.data_limite_visita && (
                    <span className={isOverDeadline ? " text-destructive font-medium" : ""}>
                      {" "}Prazo limite: {new Date(selectedLaudo.data_limite_visita).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </p>
                <Button
                  onClick={() => iniciarVistoriaMutation.mutate()}
                  disabled={iniciarVistoriaMutation.isPending}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {iniciarVistoriaMutation.isPending ? "Obtendo localização..." : "Iniciar por Geolocalização"}
                </Button>
              </div>
            )}

            {hasStartedVisit && isEditable && (
              <div className="text-xs text-muted-foreground bg-muted rounded-md p-2 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Visita iniciada em {new Date(selectedLaudo.data_hora_inicio_vistoria).toLocaleString("pt-BR")}
              </div>
            )}

            {/* Product confirmation by engineer */}
            {isEditable && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirmar Produto PRONAF</Label>
                <Select
                  value={form.pronaf_produto_confirmado_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, pronaf_produto_confirmado_id: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o produto confirmado..." /></SelectTrigger>
                  <SelectContent>
                    {pronafProdutos?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({p.finalidade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Required documents for confirmed product */}
            {pronafDocumentos && pronafDocumentos.length > 0 && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4 text-primary" />
                  Documentação exigida (pré-requisitos):
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
                  {pronafDocumentos.map((doc) => (
                    <li key={doc.id}>
                      {doc.nome_documento}
                      {doc.obrigatorio && <span className="text-destructive ml-1">*</span>}
                      {doc.descricao && <span className="text-xs block text-muted-foreground/70">{doc.descricao}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklist fields - only show if visit started or viewing */}
            {(hasStartedVisit || !isEditable) && [
              { key: "situacao_cultura" as const, label: "Situação da Cultura" },
              { key: "tipo_solo" as const, label: "Tipo de Solo" },
              { key: "historico_produtividade" as const, label: "Histórico de Produtividade" },
              { key: "disponibilidade_hidrica" as const, label: "Disponibilidade Hídrica" },
              { key: "riscos_identificados" as const, label: "Riscos Identificados" },
              { key: "garantias_observadas" as const, label: "Garantias Observadas" },
              { key: "recomendacoes_tecnicas" as const, label: "Recomendações Técnicas" },
              { key: "resumo_viabilidade" as const, label: "Resumo de Viabilidade" },
              { key: "parecer_final" as const, label: "Parecer Final" },
              { key: "observacoes_adicionais" as const, label: "Observações Adicionais" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
                {isEditable ? (
                  <Textarea value={form[key]} onChange={set(key)} rows={2} />
                ) : (
                  <p className="text-sm rounded-md bg-muted p-2">{form[key] || "—"}</p>
                )}
              </div>
            ))}

            {/* Photo upload */}
            {isEditable && hasStartedVisit && (
              <div className="space-y-2 border-t pt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fotos / Documentos da Vistoria</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!photoFiles.length || uploadMutation.isPending}
                    onClick={() => uploadMutation.mutate()}
                    className="gap-1 shrink-0"
                  >
                    <Camera className="h-4 w-4" />
                    {uploadMutation.isPending ? "Enviando..." : `Enviar (${photoFiles.length})`}
                  </Button>
                </div>
                {photoFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">{photoFiles.map(f => f.name).join(", ")}</p>
                )}
              </div>
            )}

            {/* Media gallery */}
            {midias && midias.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Arquivos Enviados ({midias.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {midias.map((m) => {
                    const isImage = m.tipo === "foto" || m.url_arquivo.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return isImage ? (
                      <MidiaImage key={m.id} midia={m} />
                    ) : (
                      <MidiaPdfLink key={m.id} midia={m} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signature section */}
            {isAwaitingSignature && (
              <div className="space-y-4 border-t pt-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Assinatura Digital
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ao assinar, você declara que todas as informações contidas neste laudo são verdadeiras
                    e que a vistoria foi realizada de acordo com as normas técnicas vigentes.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="sign-confirm"
                      checked={signConfirm}
                      onCheckedChange={(v) => setSignConfirm(v === true)}
                    />
                    <label htmlFor="sign-confirm" className="text-sm leading-tight cursor-pointer">
                      Declaro que li e confirmo todas as informações do laudo acima e autorizo a assinatura digital.
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => signMutation.mutate()}
                    disabled={!signConfirm || signMutation.isPending}
                    className="gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {signMutation.isPending ? "Assinando..." : "Assinar Digitalmente"}
                  </Button>
                </div>
              </div>
            )}

            {/* Action buttons for editable */}
            {isEditable && hasStartedVisit && (
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
                </Button>
                <Button onClick={() => concluirMutation.mutate()} disabled={concluirMutation.isPending}>
                  {concluirMutation.isPending ? "Concluindo..." : "Concluir Vistoria"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Haversine distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
