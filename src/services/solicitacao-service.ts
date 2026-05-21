// src/services/solicitacao-service.ts
import apiClient from '@/lib/api-client';

export interface SolicitacaoCreate {
  propriedade_id: string;
  tipo_credito: string;
  cultura_principal: string;
  area_cultivo_ha: number;
  valor_solicitado: number;
  observacoes_produtor?: string;
}

export interface SolicitacaoUpdate {
  status?: string;
  observacoes_produtor?: string;
}

export interface SolicitacaoResponse extends SolicitacaoCreate {
  id: string;
  produtor_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const solicitacaoService = {
  async create(data: SolicitacaoCreate): Promise<SolicitacaoResponse> {
    const response = await apiClient.post<SolicitacaoResponse>('/api/solicitacoes/', data);
    return response.data;
  },

  async list(): Promise<SolicitacaoResponse[]> {
    const response = await apiClient.get<SolicitacaoResponse[]>('/api/solicitacoes/');
    return response.data;
  },

  async get(id: string): Promise<SolicitacaoResponse> {
    const response = await apiClient.get<SolicitacaoResponse>(`/api/solicitacoes/${id}`);
    return response.data;
  },

  async update(id: string, data: SolicitacaoUpdate): Promise<SolicitacaoResponse> {
    const response = await apiClient.put<SolicitacaoResponse>(`/api/solicitacoes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/solicitacoes/${id}`);
  }
};
