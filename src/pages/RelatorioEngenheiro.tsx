import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";

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

export default function RelatorioEngenheiro() {
  const [de, setDe] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [ate, setAte] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: laudos } = useQuery({
    queryKey: ["eng_relatorio_laudos", de, ate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laudos")
        .select("*, solicitacoes_laudo:solicitacao_id(propriedades:propriedade_id(nome_propriedade), cultura_principal, valor_pagamento_engenheiro)")
        .gte("created_at", de)
        .lte("created_at", ate + "T23:59:59")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pagamentos } = useQuery({
    queryKey: ["eng_relatorio_pag", de, ate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos_engenheiro")
        .select("*")
        .gte("created_at", de)
        .lte("created_at", ate + "T23:59:59");
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const totalLaudos = laudos?.length ?? 0;
  const finalizados = laudos?.filter((l) => l.status_laudo === "finalizado").length ?? 0;
  const totalPendente = pagamentos?.filter((p) => p.status_pagamento === "pendente").reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
  const totalPago = pagamentos?.filter((p) => p.status_pagamento === "pago").reduce((s, p) => s + p.valor_bruto, 0) ?? 0;

  const handleExport = () => {
    if (!laudos) return;
    const headers = ["Data", "Propriedade", "Cultura", "Status", "Valor Eng."];
    const rows = laudos.map((l) => {
      const sol = (l as any).solicitacoes_laudo;
      return [
        new Date(l.created_at).toLocaleDateString("pt-BR"),
        sol?.propriedades?.nome_propriedade || "—",
        sol?.cultura_principal || "—",
        l.status_laudo,
        String(sol?.valor_pagamento_engenheiro ?? 0),
      ];
    });
    exportCSV(headers, rows, `meus_laudos_${de}_${ate}.csv`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meus Relatórios</h1>
        <p className="text-muted-foreground">Resumo de laudos e pagamentos no período.</p>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de laudos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display">{totalLaudos}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Finalizados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display text-success">{finalizados}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">A receber</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display text-warning">{formatCurrency(totalPendente)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recebido</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display text-success">{formatCurrency(totalPago)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Laudos no Período</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!laudos?.length ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sem laudos no período.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor Eng.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laudos.map((l) => {
                  const sol = (l as any).solicitacoes_laudo;
                  return (
                    <TableRow key={l.id}>
                      <TableCell>{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{sol?.propriedades?.nome_propriedade || "—"}</TableCell>
                      <TableCell>{sol?.cultura_principal || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={l.status_laudo === "finalizado" ? "default" : "secondary"}>
                          {l.status_laudo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(sol?.valor_pagamento_engenheiro ?? 0)}</TableCell>
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
