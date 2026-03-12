export interface RedeMembro {
  id: string;
  empresa_id: string;
  tipo_pessoa: 'pf' | 'pj';
  segmento: string;
  segmento_outro: string;
  status: string;
  // PJ
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual: string;
  // PF
  nome_completo: string;
  cpf: string;
  rg: string;
  rg_orgao_emissor: string;
  rg_uf: string;
  nome_mae: string;
  nome_pai: string;
  genero: string;
  nacionalidade: string;
  data_nascimento: string | null;
  estado_civil: string;
  regime_casamento: string;
  cpf_conjuge: string;
  nome_conjuge: string;
  capacidade_civil: string;
  grau_instrucao: string;
  pessoa_exposta_politicamente: boolean;
  // Documento
  tipo_documento: string;
  numero_documento: string;
  documento_uf: string;
  documento_cidade: string;
  documento_orgao_emissor: string;
  documento_numero_registro: string;
  documento_numero_via: string;
  documento_unidade_funai: string;
  documento_data_emissao: string | null;
  // Endereço
  tipo_endereco: string;
  comprovante_endereco: string;
  tempo_utilizacao_meses: number;
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  perimetro: string;
  numero: string;
  complemento: string;
  zona_urbana: boolean;
  endereco_correspondencia: boolean;
  local_correio: boolean;
  imovel_proprio: boolean;
  tipo_imovel: string;
  // Correspondência
  corresp_cep: string;
  corresp_uf: string;
  corresp_cidade: string;
  corresp_bairro: string;
  corresp_logradouro: string;
  corresp_perimetro: string;
  corresp_numero: string;
  corresp_complemento: string;
  corresp_imovel_proprio: boolean;
  corresp_tipo_imovel: string;
  // Contato
  ddd: string;
  telefone: string;
  email: string;
  // Profissional
  crea: string;
  tipo_licenca: string;
  numero_licenca: string;
  area_atuacao: string;
  // Sistema
  user_id: string | null;
  user_criado: boolean;
  dados_receita: Record<string, any>;
  situacao_cadastral: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const SEGMENTOS = [
  { value: 'agrobanker', label: 'Agrobanker' },
  { value: 'engenheiro', label: 'Engenheiro Agrônomo' },
  { value: 'projetista', label: 'Projetista' },
  { value: 'revenda', label: 'Revenda Agrícola' },
  { value: 'sindicato', label: 'Sindicato Rural' },
  { value: 'associacao', label: 'Associação de Produtores' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'consultoria', label: 'Consultoria Agronômica' },
  { value: 'corretora', label: 'Corretora de Seguros' },
  { value: 'outro', label: 'Outro' },
] as const;

export const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
] as const;

export const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
] as const;

export const REGIMES_CASAMENTO = [
  { value: 'comunhao_parcial', label: 'Comunhão Parcial de Bens' },
  { value: 'comunhao_universal', label: 'Comunhão Universal de Bens' },
  { value: 'separacao_total', label: 'Separação Total de Bens' },
  { value: 'participacao_final', label: 'Participação Final nos Aquestos' },
] as const;

export const CAPACIDADES_CIVIS = [
  { value: 'capaz', label: 'Capaz' },
  { value: 'relativamente_incapaz', label: 'Relativamente Incapaz' },
  { value: 'emancipado', label: 'Emancipado' },
] as const;

export const GRAUS_INSTRUCAO = [
  { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Médio Incompleto' },
  { value: 'medio_completo', label: 'Médio Completo' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
] as const;

export const TIPOS_DOCUMENTO = [
  { value: 'rg', label: 'RG' },
  { value: 'cnh', label: 'CNH' },
  { value: 'carteira_classe', label: 'Carteira de Classe' },
  { value: 'carteira_militar', label: 'Carteira Militar' },
  { value: 'passaporte', label: 'Passaporte' },
  { value: 'ctps', label: 'CTPS' },
  { value: 'identidade_indigena', label: 'Identidade Indígena' },
] as const;

export const TIPOS_ENDERECO = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
] as const;

export const TIPOS_IMOVEL = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'sala_comercial', label: 'Sala Comercial' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'fazenda', label: 'Fazenda/Sítio' },
  { value: 'outro', label: 'Outro' },
] as const;

export const STATUS_MEMBRO_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-800' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  bloqueado: { label: 'Bloqueado', color: 'bg-red-200 text-red-900' },
};
