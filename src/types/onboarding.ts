export interface OnboardingEmpresa {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo: 'master' | 'subestabelecido' | 'agrobanker';
  parent_id: string | null;
  user_id: string | null;
  uf: string;
  municipio: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'ativo' | 'inativo';
  regiao_atuacao: string | null;
  comissao_percentual: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  parent?: OnboardingEmpresa | null;
  children?: OnboardingEmpresa[];
  responsaveis?: OnboardingResponsavel[];
  documentos?: OnboardingDocumento[];
  compliance?: OnboardingComplianceItem[];
}

export interface OnboardingResponsavel {
  id: string;
  empresa_id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  cargo: string | null;
  created_at: string;
}

export interface OnboardingDocumento {
  id: string;
  empresa_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  caminho_arquivo: string;
  status: 'enviado' | 'aprovado' | 'rejeitado';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingComplianceItem {
  id: string;
  empresa_id: string;
  item: string;
  descricao: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  verificado_por: string | null;
  verificado_em: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface CadastroFormData {
  // Step 1
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo: 'subestabelecido' | 'agrobanker';
  uf: string;
  municipio: string;
  endereco: string;
  telefone: string;
  email: string;
  // Step 2
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  responsavel_telefone: string;
  responsavel_cargo: string;
  // Step 3
  parent_id: string;
  regiao_atuacao: string;
  comissao_percentual: number;
}

export const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
] as const;

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-800' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  pendente_renovacao: { label: 'Renovação Pendente', color: 'bg-orange-100 text-orange-800' },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
};

export const TIPO_LABELS: Record<string, string> = {
  master: 'COBAN Master',
  subestabelecido: 'Subestabelecido',
  agrobanker: 'Agrobanker',
};

export const DOC_TYPES = [
  { value: 'contrato_social', label: 'Contrato Social' },
  { value: 'alvara', label: 'Alvará de Funcionamento' },
  { value: 'certidao_negativa', label: 'Certidão Negativa de Débitos' },
  { value: 'comprovante_endereco', label: 'Comprovante de Endereço' },
  { value: 'outro', label: 'Outro Documento' },
];

export const COMPLIANCE_CHECKLIST = [
  { item: 'cnpj_valido', descricao: 'CNPJ válido e ativo na Receita Federal' },
  { item: 'contrato_social', descricao: 'Contrato Social verificado e atualizado' },
  { item: 'alvara_vigente', descricao: 'Alvará de funcionamento dentro da validade' },
  { item: 'certidao_negativa', descricao: 'Certidão negativa de débitos apresentada' },
  { item: 'responsavel_identificado', descricao: 'Responsável legal devidamente identificado' },
  { item: 'endereco_confirmado', descricao: 'Endereço comercial confirmado' },
];
