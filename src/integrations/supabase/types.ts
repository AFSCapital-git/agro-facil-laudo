export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assinatura_laudo: {
        Row: {
          created_at: string
          data_hora_assinatura: string
          engenheiro_id: string
          hash_assinatura: string
          id: string
          ip_assinatura: string | null
          laudo_id: string
          tipo_assinatura: string
        }
        Insert: {
          created_at?: string
          data_hora_assinatura?: string
          engenheiro_id: string
          hash_assinatura: string
          id?: string
          ip_assinatura?: string | null
          laudo_id: string
          tipo_assinatura?: string
        }
        Update: {
          created_at?: string
          data_hora_assinatura?: string
          engenheiro_id?: string
          hash_assinatura?: string
          id?: string
          ip_assinatura?: string | null
          laudo_id?: string
          tipo_assinatura?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_laudo_engenheiro_id_fkey"
            columns: ["engenheiro_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinatura_laudo_laudo_id_fkey"
            columns: ["laudo_id"]
            isOneToOne: true
            referencedRelation: "laudos"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_mensagens: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          remetente_id: string
          remetente_role: string
          solicitacao_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          remetente_id: string
          remetente_role: string
          solicitacao_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          remetente_id?: string
          remetente_role?: string
          solicitacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_mensagens_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_laudo"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_plataforma: {
        Row: {
          id: string
          percentual_taxa_plataforma: number
          prazo_padrao_pagamento_dias: number
          updated_at: string
          valor_base_laudo: number
        }
        Insert: {
          id?: string
          percentual_taxa_plataforma?: number
          prazo_padrao_pagamento_dias?: number
          updated_at?: string
          valor_base_laudo?: number
        }
        Update: {
          id?: string
          percentual_taxa_plataforma?: number
          prazo_padrao_pagamento_dias?: number
          updated_at?: string
          valor_base_laudo?: number
        }
        Relationships: []
      }
      engenheiros: {
        Row: {
          area_atuacao: string | null
          conta_bancaria_agencia: string | null
          conta_bancaria_banco: string | null
          conta_bancaria_conta: string | null
          conta_bancaria_tipo: string | null
          crea: string
          created_at: string
          id: string
          raio_atendimento_km: number | null
          rating: number | null
          status_verificacao: string
          total_laudos_concluidos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_atuacao?: string | null
          conta_bancaria_agencia?: string | null
          conta_bancaria_banco?: string | null
          conta_bancaria_conta?: string | null
          conta_bancaria_tipo?: string | null
          crea?: string
          created_at?: string
          id?: string
          raio_atendimento_km?: number | null
          rating?: number | null
          status_verificacao?: string
          total_laudos_concluidos?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area_atuacao?: string | null
          conta_bancaria_agencia?: string | null
          conta_bancaria_banco?: string | null
          conta_bancaria_conta?: string | null
          conta_bancaria_tipo?: string | null
          crea?: string
          created_at?: string
          id?: string
          raio_atendimento_km?: number | null
          rating?: number | null
          status_verificacao?: string
          total_laudos_concluidos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      laudos: {
        Row: {
          caminho_pdf_laudo: string | null
          created_at: string
          data_agendada_visita: string | null
          data_hora_inicio_vistoria: string | null
          data_limite_visita: string | null
          data_visita_efetiva: string | null
          disponibilidade_hidrica: string | null
          engenheiro_id: string
          garantias_observadas: string | null
          historico_produtividade: string | null
          id: string
          latitude_inicio_vistoria: number | null
          longitude_inicio_vistoria: number | null
          observacoes_adicionais: string | null
          observacoes_internas: string | null
          parecer_final: string | null
          pronaf_produto_confirmado_id: string | null
          recomendacoes_tecnicas: string | null
          resumo_viabilidade: string | null
          riscos_identificados: string | null
          score_risco: number | null
          situacao_cultura: string | null
          solicitacao_id: string
          status_laudo: string
          tipo_solo: string | null
          updated_at: string
        }
        Insert: {
          caminho_pdf_laudo?: string | null
          created_at?: string
          data_agendada_visita?: string | null
          data_hora_inicio_vistoria?: string | null
          data_limite_visita?: string | null
          data_visita_efetiva?: string | null
          disponibilidade_hidrica?: string | null
          engenheiro_id: string
          garantias_observadas?: string | null
          historico_produtividade?: string | null
          id?: string
          latitude_inicio_vistoria?: number | null
          longitude_inicio_vistoria?: number | null
          observacoes_adicionais?: string | null
          observacoes_internas?: string | null
          parecer_final?: string | null
          pronaf_produto_confirmado_id?: string | null
          recomendacoes_tecnicas?: string | null
          resumo_viabilidade?: string | null
          riscos_identificados?: string | null
          score_risco?: number | null
          situacao_cultura?: string | null
          solicitacao_id: string
          status_laudo?: string
          tipo_solo?: string | null
          updated_at?: string
        }
        Update: {
          caminho_pdf_laudo?: string | null
          created_at?: string
          data_agendada_visita?: string | null
          data_hora_inicio_vistoria?: string | null
          data_limite_visita?: string | null
          data_visita_efetiva?: string | null
          disponibilidade_hidrica?: string | null
          engenheiro_id?: string
          garantias_observadas?: string | null
          historico_produtividade?: string | null
          id?: string
          latitude_inicio_vistoria?: number | null
          longitude_inicio_vistoria?: number | null
          observacoes_adicionais?: string | null
          observacoes_internas?: string | null
          parecer_final?: string | null
          pronaf_produto_confirmado_id?: string | null
          recomendacoes_tecnicas?: string | null
          resumo_viabilidade?: string | null
          riscos_identificados?: string | null
          score_risco?: number | null
          situacao_cultura?: string | null
          solicitacao_id?: string
          status_laudo?: string
          tipo_solo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laudos_engenheiro_id_fkey"
            columns: ["engenheiro_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laudos_pronaf_produto_confirmado_id_fkey"
            columns: ["pronaf_produto_confirmado_id"]
            isOneToOne: false
            referencedRelation: "pronaf_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laudos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_laudo"
            referencedColumns: ["id"]
          },
        ]
      }
      midia_laudo: {
        Row: {
          created_at: string
          data_hora_captura: string | null
          descricao: string | null
          id: string
          latitude: number | null
          laudo_id: string
          longitude: number | null
          tipo: string
          url_arquivo: string
        }
        Insert: {
          created_at?: string
          data_hora_captura?: string | null
          descricao?: string | null
          id?: string
          latitude?: number | null
          laudo_id: string
          longitude?: number | null
          tipo?: string
          url_arquivo: string
        }
        Update: {
          created_at?: string
          data_hora_captura?: string | null
          descricao?: string | null
          id?: string
          latitude?: number | null
          laudo_id?: string
          longitude?: number | null
          tipo?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "midia_laudo_laudo_id_fkey"
            columns: ["laudo_id"]
            isOneToOne: false
            referencedRelation: "laudos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_engenheiro: {
        Row: {
          created_at: string
          data_pagamento: string | null
          data_prevista_pagamento: string | null
          engenheiro_id: string
          id: string
          laudo_id: string
          metodo_pagamento: string
          status_pagamento: string
          updated_at: string
          valor_bruto: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          data_prevista_pagamento?: string | null
          engenheiro_id: string
          id?: string
          laudo_id: string
          metodo_pagamento?: string
          status_pagamento?: string
          updated_at?: string
          valor_bruto?: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          data_prevista_pagamento?: string | null
          engenheiro_id?: string
          id?: string
          laudo_id?: string
          metodo_pagamento?: string
          status_pagamento?: string
          updated_at?: string
          valor_bruto?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_engenheiro_engenheiro_id_fkey"
            columns: ["engenheiro_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_engenheiro_laudo_id_fkey"
            columns: ["laudo_id"]
            isOneToOne: true
            referencedRelation: "laudos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtores: {
        Row: {
          cpf_cnpj: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf_cnpj?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pronaf_documentos: {
        Row: {
          created_at: string
          descricao: string
          id: string
          nome_documento: string
          obrigatorio: boolean
          ordem: number
          produto_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          nome_documento: string
          obrigatorio?: boolean
          ordem?: number
          produto_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          nome_documento?: string
          obrigatorio?: boolean
          ordem?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronaf_documentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "pronaf_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pronaf_produtos: {
        Row: {
          ativo: boolean
          bonus_adimplencia: string
          carencia: string
          created_at: string
          finalidade: string
          grupo_alvo: string
          id: string
          juros: string
          limite_valor: string
          nome: string
          o_que_financia: string
          prazo_reembolso: string
          tipo_valor_engenheiro: string
          updated_at: string
          valor_engenheiro: number
        }
        Insert: {
          ativo?: boolean
          bonus_adimplencia?: string
          carencia?: string
          created_at?: string
          finalidade?: string
          grupo_alvo?: string
          id?: string
          juros?: string
          limite_valor?: string
          nome: string
          o_que_financia?: string
          prazo_reembolso?: string
          tipo_valor_engenheiro?: string
          updated_at?: string
          valor_engenheiro?: number
        }
        Update: {
          ativo?: boolean
          bonus_adimplencia?: string
          carencia?: string
          created_at?: string
          finalidade?: string
          grupo_alvo?: string
          id?: string
          juros?: string
          limite_valor?: string
          nome?: string
          o_que_financia?: string
          prazo_reembolso?: string
          tipo_valor_engenheiro?: string
          updated_at?: string
          valor_engenheiro?: number
        }
        Relationships: []
      }
      propriedades: {
        Row: {
          area_total_ha: number
          codigo_car: string | null
          created_at: string
          endereco: string
          id: string
          latitude: number | null
          longitude: number | null
          nome_propriedade: string
          produtor_id: string
          updated_at: string
        }
        Insert: {
          area_total_ha?: number
          codigo_car?: string | null
          created_at?: string
          endereco?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_propriedade: string
          produtor_id: string
          updated_at?: string
        }
        Update: {
          area_total_ha?: number
          codigo_car?: string | null
          created_at?: string
          endereco?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_propriedade?: string
          produtor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propriedades_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacao_documentos: {
        Row: {
          caminho_arquivo: string
          created_at: string
          id: string
          nome_arquivo: string
          observacoes: string | null
          pronaf_documento_id: string | null
          solicitacao_id: string
          status_documento: string
          updated_at: string
        }
        Insert: {
          caminho_arquivo: string
          created_at?: string
          id?: string
          nome_arquivo: string
          observacoes?: string | null
          pronaf_documento_id?: string | null
          solicitacao_id: string
          status_documento?: string
          updated_at?: string
        }
        Update: {
          caminho_arquivo?: string
          created_at?: string
          id?: string
          nome_arquivo?: string
          observacoes?: string | null
          pronaf_documento_id?: string | null
          solicitacao_id?: string
          status_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_documentos_pronaf_documento_id_fkey"
            columns: ["pronaf_documento_id"]
            isOneToOne: false
            referencedRelation: "pronaf_documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacao_documentos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_laudo"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_laudo: {
        Row: {
          aprovado_mesa_em: string | null
          aprovado_mesa_por: string | null
          area_cultivo_ha: number
          banco_destino: string | null
          created_at: string
          cultura_principal: string
          data_envio_banco: string | null
          data_retorno_banco: string | null
          docs_habilitados: boolean
          engenheiro_atribuido_id: string | null
          id: string
          notas_mesa: string | null
          observacoes_banco: string | null
          observacoes_produtor: string | null
          produtor_id: string
          pronaf_produto_id: string | null
          propriedade_id: string
          status_banco: string
          status_mesa: string
          status_solicitacao: string
          tipo_credito: string
          tipo_valor_engenheiro_override: string | null
          updated_at: string
          valor_engenheiro_override: number | null
          valor_pagamento_engenheiro: number
          valor_solicitado: number
        }
        Insert: {
          aprovado_mesa_em?: string | null
          aprovado_mesa_por?: string | null
          area_cultivo_ha?: number
          banco_destino?: string | null
          created_at?: string
          cultura_principal?: string
          data_envio_banco?: string | null
          data_retorno_banco?: string | null
          docs_habilitados?: boolean
          engenheiro_atribuido_id?: string | null
          id?: string
          notas_mesa?: string | null
          observacoes_banco?: string | null
          observacoes_produtor?: string | null
          produtor_id: string
          pronaf_produto_id?: string | null
          propriedade_id: string
          status_banco?: string
          status_mesa?: string
          status_solicitacao?: string
          tipo_credito?: string
          tipo_valor_engenheiro_override?: string | null
          updated_at?: string
          valor_engenheiro_override?: number | null
          valor_pagamento_engenheiro?: number
          valor_solicitado?: number
        }
        Update: {
          aprovado_mesa_em?: string | null
          aprovado_mesa_por?: string | null
          area_cultivo_ha?: number
          banco_destino?: string | null
          created_at?: string
          cultura_principal?: string
          data_envio_banco?: string | null
          data_retorno_banco?: string | null
          docs_habilitados?: boolean
          engenheiro_atribuido_id?: string | null
          id?: string
          notas_mesa?: string | null
          observacoes_banco?: string | null
          observacoes_produtor?: string | null
          produtor_id?: string
          pronaf_produto_id?: string | null
          propriedade_id?: string
          status_banco?: string
          status_mesa?: string
          status_solicitacao?: string
          tipo_credito?: string
          tipo_valor_engenheiro_override?: string | null
          updated_at?: string
          valor_engenheiro_override?: number | null
          valor_pagamento_engenheiro?: number
          valor_solicitado?: number
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_laudo_engenheiro_atribuido_id_fkey"
            columns: ["engenheiro_atribuido_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_pronaf_produto_id_fkey"
            columns: ["pronaf_produto_id"]
            isOneToOne: false
            referencedRelation: "pronaf_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_propriedade_id_fkey"
            columns: ["propriedade_id"]
            isOneToOne: false
            referencedRelation: "propriedades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_engenheiro_id: { Args: never; Returns: string }
      get_engenheiro_laudo_solicitacao_ids: { Args: never; Returns: string[] }
      get_produtor_id: { Args: never; Returns: string }
      get_produtor_solicitacao_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_engenheiro: { Args: never; Returns: boolean }
      is_mesa_produtos: { Args: never; Returns: boolean }
      is_produtor: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "produtor" | "engenheiro" | "admin" | "mesa_produtos"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["produtor", "engenheiro", "admin", "mesa_produtos"],
    },
  },
} as const
