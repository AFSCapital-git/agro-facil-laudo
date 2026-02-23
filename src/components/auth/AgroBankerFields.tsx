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

export function AgroBankerFields({
  cnpj, setCnpj,
  razaoSocial, setRazaoSocial,
  nomeFantasia, setNomeFantasia,
  tipoEntidade, setTipoEntidade,
  descricaoTipo, setDescricaoTipo,
  municipio, setMunicipio,
  uf, setUf,
}: AgroBankerFieldsProps) {
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
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="municipioAb">Município</Label>
          <Input id="municipioAb" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ufAb">UF</Label>
          <Input id="ufAb" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} className="uppercase" />
        </div>
      </div>
    </>
  );
}

export { TIPOS_ENTIDADE };
