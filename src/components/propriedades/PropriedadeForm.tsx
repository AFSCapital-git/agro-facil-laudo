import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PropriedadeFormData } from "@/pages/Propriedades";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const TIPO_POSSE_OPTIONS = [
  { value: "propria", label: "Própria" },
  { value: "arrendada", label: "Arrendada" },
  { value: "parceria", label: "Parceria" },
  { value: "comodato", label: "Comodato" },
  { value: "posse", label: "Posse" },
  { value: "assentamento", label: "Assentamento" },
];

const FONTE_AGUA_OPTIONS = [
  { value: "rio", label: "Rio" },
  { value: "nascente", label: "Nascente" },
  { value: "poço_artesiano", label: "Poço artesiano" },
  { value: "represa", label: "Represa / Açude" },
  { value: "irrigacao", label: "Irrigação" },
  { value: "sequeiro", label: "Sequeiro (sem irrigação)" },
  { value: "outro", label: "Outro" },
];

const TIPO_SOLO_OPTIONS = [
  { value: "argiloso", label: "Argiloso" },
  { value: "arenoso", label: "Arenoso" },
  { value: "siltoso", label: "Siltoso" },
  { value: "humifero", label: "Humífero" },
  { value: "misto", label: "Misto" },
];

interface Props {
  form: PropriedadeFormData;
  setForm: React.Dispatch<React.SetStateAction<PropriedadeFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit: boolean;
}

export default function PropriedadeForm({ form, setForm, onSubmit, onCancel, isPending, isEdit }: Props) {
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  useEffect(() => {
    if (!form.uf) {
      setMunicipios([]);
      return;
    }
    setLoadingMunicipios(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.uf}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => {
        setMunicipios(data.map((m) => m.nome));
      })
      .catch(() => setMunicipios([]))
      .finally(() => setLoadingMunicipios(false));
  }, [form.uf]);

  const set = (field: keyof PropriedadeFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setSelect = (field: keyof PropriedadeFormData) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Identificação */}
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identificação</p>
      <div className="space-y-2">
        <Label>Nome da propriedade *</Label>
        <Input value={form.nome_propriedade} onChange={set("nome_propriedade")} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>UF *</Label>
          <Select value={form.uf} onValueChange={(v) => { setForm((f) => ({ ...f, uf: v, municipio: "" })); }}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {UF_LIST.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Município *</Label>
          <Select value={form.municipio} onValueChange={setSelect("municipio")} disabled={!form.uf || loadingMunicipios}>
            <SelectTrigger>
              <SelectValue placeholder={loadingMunicipios ? "Carregando..." : form.uf ? "Selecione o município" : "Selecione o UF primeiro"} />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-60">
                {municipios.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço / Referência</Label>
        <Input value={form.endereco} onChange={set("endereco")} placeholder="Estrada, rodovia, comunidade, etc." />
      </div>

      <Separator />

      {/* Documentação */}
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documentação</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de posse *</Label>
          <Select value={form.tipo_posse} onValueChange={setSelect("tipo_posse")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPO_POSSE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Matrícula do imóvel</Label>
          <Input value={form.matricula_imovel} onChange={set("matricula_imovel")} placeholder="Nº do registro" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Código CAR</Label>
          <Input value={form.codigo_car} onChange={set("codigo_car")} placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <Label>Nº CCIR (INCRA)</Label>
          <Input value={form.numero_ccir} onChange={set("numero_ccir")} placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <Label>Nº ITR</Label>
          <Input value={form.numero_itr} onChange={set("numero_itr")} placeholder="Opcional" />
        </div>
      </div>

      <Separator />

      {/* Áreas */}
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Áreas (hectares)</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Área total (ha) *</Label>
          <Input type="number" step="0.01" value={form.area_total_ha} onChange={set("area_total_ha")} required />
        </div>
        <div className="space-y-2">
          <Label>Reserva legal (ha)</Label>
          <Input type="number" step="0.01" value={form.area_reserva_legal_ha} onChange={set("area_reserva_legal_ha")} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>APP (ha)</Label>
          <Input type="number" step="0.01" value={form.area_app_ha} onChange={set("area_app_ha")} placeholder="0" />
        </div>
      </div>

      <Separator />

      {/* Características */}
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Características</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de solo predominante</Label>
          <Select value={form.tipo_solo} onValueChange={setSelect("tipo_solo")}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {TIPO_SOLO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fonte de água</Label>
          <Select value={form.fonte_agua} onValueChange={setSelect("fonte_agua")}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {FONTE_AGUA_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Geolocalização */}
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Geolocalização</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input type="number" step="any" value={form.latitude} onChange={set("latitude")} placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input type="number" step="any" value={form.longitude} onChange={set("longitude")} placeholder="Opcional" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
