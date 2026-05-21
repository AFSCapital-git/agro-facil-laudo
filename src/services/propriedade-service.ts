// src/services/propriedade-service.ts
import apiClient from '@/lib/api-client';

export interface PropriedadeCreate {
  nome_propriedade: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  area_total_ha: number;
  codigo_car?: string;
}

export interface PropriedadeUpdate {
  nome_propriedade?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  area_total_ha?: number;
  codigo_car?: string;
}

export interface PropriedadeResponse extends PropriedadeCreate {
  id: string;
  produtor_id: string;
  created_at: string;
  updated_at: string;
}

export const propriedadeService = {
  async create(data: PropriedadeCreate): Promise<PropriedadeResponse> {
    const response = await apiClient.post<PropriedadeResponse>('/api/propriedades/', data);
    return response.data;
  },

  async list(): Promise<PropriedadeResponse[]> {
    const response = await apiClient.get<PropriedadeResponse[]>('/api/propriedades/');
    return response.data;
  },

  async get(id: string): Promise<PropriedadeResponse> {
    const response = await apiClient.get<PropriedadeResponse>(`/api/propriedades/${id}`);
    return response.data;
  },

  async update(id: string, data: PropriedadeUpdate): Promise<PropriedadeResponse> {
    const response = await apiClient.put<PropriedadeResponse>(`/api/propriedades/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/propriedades/${id}`);
  }
};
