import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPOS_ENTIDADE = [
  { value: "revenda_agricola", label: "Revenda Agrícola" },
  { value: "cooperativa", label: "Cooperativa Agropecuária" },
  { value: "sindicato_rural", label: "Sindicato Rural" },
  { value: "associacao_produtores", label: "Associação de Produtores" },
  { value: "consultoria_agronomica", label: "Consultoria Agronômica" },
  { value: "escritorio_contabilidade", label: "Escritório de Contabilidade Rural" },
  { value: "corretora_seguros", label: "Corretora de Seguros Agrícolas" },
  { value: "casa_agropecuaria", label: "Casa Agropecuária" },
  { value: "ater", label: "Empresa de Assistência Técnica (ATER)" },
  { value: "trading_cerealista", label: "Trading / Cerealista" },
  { value: "outro", label: "Outro" },
];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface AgroBankerFieldsProps {
  cnpj: string;
  setCnpj: (v: string) => void;
  razaoSocial: string;
  setRazaoSocial: (v: string) => void;
  nomeFantasia: string;
  setNomeFantasia: (v: string) => void;
  tipoEntidade: string;
  setTipoEntidade: (v: string) => void;
  descricaoTipo: string;
  setDescricaoTipo: (v: string) => void;
  municipio: string;
  setMunicipio: (v: string) => void;
  uf: string;
  setUf: (v: string) => void;
}

interface MunicipioIBGE {
  nome: string;
}

export function AgroBankerFields({
  cnpj, setCnpj,
  razaoSocial, setRazaoSocial,
  nomeFantasia, setNomeFantasia,
  tipoEntidade, setTipoEntidade,
  descricaoTipo, setDescricaoTipo,
  municipio, setMunicipio,
  uf, setUf,
}: AgroBankerFieldsProps) {
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  useEffect(() => {
    if (!uf || uf.length !== 2) {
      setMunicipios([]);
      return;
    }
    setLoadingMunicipios(true);
    setMunicipio("");
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data: MunicipioIBGE[]) => {
        setMunicipios(data.map((m) => m.nome));
      })
      .catch(() => setMunicipios([]))
      .finally(() => setLoadingMunicipios(false));
  }, [uf]);

  return (
    <>
      <div className="space-y-2">
        <Label>Tipo de entidade</Label>
        <Select value={tipoEntidade} onValueChange={setTipoEntidade}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {TIPOS_ENTIDADE.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {tipoEntidade === "outro" && (
        <div className="space-y-2">
          <Label htmlFor="descTipo">Especifique o tipo</Label>
          <Input id="descTipo" value={descricaoTipo} onChange={(e) => setDescricaoTipo(e.target.value)} placeholder="Descreva o tipo de entidade" required />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="razaoSocial">Razão Social</Label>
        <Input id="razaoSocial" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
        <Input id="nomeFantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>UF</Label>
        <Select value={uf} onValueChange={setUf}>
          <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
          <SelectContent>
            {UFS.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Município</Label>
        <Select value={municipio} onValueChange={setMunicipio} disabled={!uf || loadingMunicipios}>
          <SelectTrigger>
            <SelectValue placeholder={loadingMunicipios ? "Carregando..." : "Selecione o município"} />
          </SelectTrigger>
          <SelectContent>
            {municipios.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export { TIPOS_ENTIDADE };
