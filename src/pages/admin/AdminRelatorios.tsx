import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Download } from "lucide-react";

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

export default function AdminRelatorios() {
  const [de, setDe] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [ate, setAte] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: laudos } = useQuery({
    queryKey: ["admin_relatorio_laudos", de, ate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laudos")
        .select("*, engenheiros(crea, profiles:user_id(nome)), solicitacoes_laudo(propriedades(nome_propriedade))")
        .eq("status_laudo", "finalizado")
        .gte("created_at", de)
        .lte("created_at", ate + "T23:59:59")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pagPendente } = useQuery({
    queryKey: ["admin_relatorio_pag_pendente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos_engenheiro")
        .select("valor_bruto")
        .eq("status_pagamento", "pendente");
      if (error) throw error;
      return data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
    },
  });

  // Laudos by engineer
  const engMap = new Map<string, { nome: string; crea: string; count: number }>();
  laudos?.forEach((l) => {
    const eng = (l as any).engenheiros;
    const key = eng?.crea || "?";
    const prev = engMap.get(key) || { nome: eng?.profiles?.nome || "—", crea: key, count: 0 };
    prev.count++;
    engMap.set(key, prev);
  });
  const engRows = Array.from(engMap.values()).sort((a, b) => b.count - a.count);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleExportLaudos = () => {
    if (!laudos) return;
    const headers = ["Data", "Propriedade", "Engenheiro", "CREA"];
    const rows = laudos.map((l) => [
      new Date(l.created_at).toLocaleDateString("pt-BR"),
      (l as any).solicitacoes_laudo?.propriedades?.nome_propriedade || "—",
      (l as any).engenheiros?.profiles?.nome || "—",
      (l as any).engenheiros?.crea || "—",
    ]);
    exportCSV(headers, rows, `laudos_${de}_${ate}.csv`);
  };

  const handleExportEng = () => {
    const headers = ["Engenheiro", "CREA", "Laudos"];
    const rows = engRows.map((e) => [e.nome, e.crea, String(e.count)]);
    exportCSV(headers, rows, `laudos_por_engenheiro_${de}_${ate}.csv`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Relatórios da plataforma com exportação CSV.</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Laudos finalizados no período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-display">{laudos?.length ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total pendente (geral)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-display text-warning">{formatCurrency(pagPendente ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Laudos by engineer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Laudos por Engenheiro</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExportEng}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {engRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engenheiro</TableHead>
                  <TableHead>CREA</TableHead>
                  <TableHead className="text-right">Laudos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engRows.map((e) => (
                  <TableRow key={e.crea}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.crea}</TableCell>
                    <TableCell className="text-right">{e.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Full laudos list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Laudos Finalizados</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExportLaudos}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!laudos?.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum laudo no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Engenheiro</TableHead>
                  <TableHead>CREA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laudos.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{(l as any).solicitacoes_laudo?.propriedades?.nome_propriedade || "—"}</TableCell>
                    <TableCell>{(l as any).engenheiros?.profiles?.nome || "—"}</TableCell>
                    <TableCell>{(l as any).engenheiros?.crea || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
