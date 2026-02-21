import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, FileText } from "lucide-react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise_mesa: { label: "Em Análise", variant: "secondary" },
  docs_pendentes_produtor: { label: "Docs Pendentes", variant: "outline" },
  docs_em_validacao: { label: "Validando Docs", variant: "secondary" },
  elegivel: { label: "Elegível", variant: "secondary" },
  reprovada: { label: "Reprovada", variant: "destructive" },
  aguardando_laudo: { label: "Aguard. Laudo", variant: "secondary" },
  pronta_para_banco: { label: "Pronta p/ Banco", variant: "default" },
};

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatorioProdutor() {
  const { data: solicitacoes } = useQuery({
    queryKey: ["produtor_relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade), laudos(id, status_laudo, caminho_pdf_laudo), pronaf_produtos(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = solicitacoes?.length ?? 0;
  const aprovados = solicitacoes?.filter((s) => s.status_banco === "aprovado").length ?? 0;
  const emAndamento = solicitacoes?.filter((s) => !["reprovada"].includes(s.status_solicitacao) && s.status_banco !== "aprovado").length ?? 0;

  const handleExport = () => {
    if (!solicitacoes) return;
    const headers = ["Data", "Propriedade", "Produto", "Status", "Banco"];
    const rows = solicitacoes.map((s) => [
      new Date(s.created_at).toLocaleDateString("pt-BR"),
      (s as any).propriedades?.nome_propriedade || "—",
      (s as any).pronaf_produtos?.nome || "—",
      statusMap[s.status_solicitacao]?.label || s.status_solicitacao,
      s.status_banco,
    ]);
    exportCSV(headers, rows, `minhas_solicitacoes.csv`);
  };

  const handleDownloadPdf = async (s: any) => {
    const laudoArr = (s as any).laudos;
    const laudo = Array.isArray(laudoArr) ? laudoArr[0] : laudoArr;
    if (!laudo?.caminho_pdf_laudo) return;
    const { data } = await supabase.storage.from("laudo-pdfs").createSignedUrl(laudo.caminho_pdf_laudo, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meu Histórico</h1>
        <p className="text-muted-foreground">Histórico completo de solicitações com status e PDF.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display">{total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Em andamento</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display">{emAndamento}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aprovados banco</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display text-success">{aprovados}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Solicitações</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!solicitacoes?.length ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((s) => {
                  const st = statusMap[s.status_solicitacao] || { label: s.status_solicitacao, variant: "outline" as const };
                  const laudoArr = (s as any).laudos;
                  const laudo = Array.isArray(laudoArr) ? laudoArr[0] : laudoArr;
                  const hasPdf = laudo?.status_laudo === "finalizado" && laudo?.caminho_pdf_laudo;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{(s as any).propriedades?.nome_propriedade || "—"}</TableCell>
                      <TableCell>{(s as any).pronaf_produtos?.nome || "—"}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>{s.status_banco}</TableCell>
                      <TableCell>
                        {hasPdf && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadPdf(s)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
