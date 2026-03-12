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
      agrobanker_comissoes: {
        Row: {
          agrobanker_id: string
          created_at: string
          data_pagamento: string | null
          id: string
          solicitacao_id: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          agrobanker_id: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          solicitacao_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          agrobanker_id?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          solicitacao_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "agrobanker_comissoes_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrobanker_comissoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_laudo"
            referencedColumns: ["id"]
          },
        ]
      }
      agrobanker_convites: {
        Row: {
          agrobanker_id: string
          cpf_cnpj: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          nome_produtor: string | null
          produtor_id: string | null
          status: string
          telefone: string | null
          token: string
        }
        Insert: {
          agrobanker_id: string
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          nome_produtor?: string | null
          produtor_id?: string | null
          status?: string
          telefone?: string | null
          token?: string
        }
        Update: {
          agrobanker_id?: string
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          nome_produtor?: string | null
          produtor_id?: string | null
          status?: string
          telefone?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrobanker_convites_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrobanker_convites_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
      }
      agrobanker_metas: {
        Row: {
          agrobanker_id: string
          created_at: string
          id: string
          meta_captacoes: number
          meta_valor: number
          observacoes: string | null
          periodo_fim: string
          periodo_inicio: string
          realizado_captacoes: number
          realizado_valor: number
          updated_at: string
        }
        Insert: {
          agrobanker_id: string
          created_at?: string
          id?: string
          meta_captacoes?: number
          meta_valor?: number
          observacoes?: string | null
          periodo_fim: string
          periodo_inicio: string
          realizado_captacoes?: number
          realizado_valor?: number
          updated_at?: string
        }
        Update: {
          agrobanker_id?: string
          created_at?: string
          id?: string
          meta_captacoes?: number
          meta_valor?: number
          observacoes?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          realizado_captacoes?: number
          realizado_valor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrobanker_metas_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
        ]
      }
      agrobanker_produtores: {
        Row: {
          agrobanker_id: string
          created_at: string
          id: string
          nivel_acesso: string
          produtor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agrobanker_id: string
          created_at?: string
          id?: string
          nivel_acesso?: string
          produtor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agrobanker_id?: string
          created_at?: string
          id?: string
          nivel_acesso?: string
          produtor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrobanker_produtores_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrobanker_produtores_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
      }
      agrobanker_produtos: {
        Row: {
          agrobanker_id: string
          ativo: boolean
          comissao_fixa: number
          comissao_percentual: number
          created_at: string
          id: string
          observacoes: string | null
          pronaf_produto_id: string
          updated_at: string
        }
        Insert: {
          agrobanker_id: string
          ativo?: boolean
          comissao_fixa?: number
          comissao_percentual?: number
          created_at?: string
          id?: string
          observacoes?: string | null
          pronaf_produto_id: string
          updated_at?: string
        }
        Update: {
          agrobanker_id?: string
          ativo?: boolean
          comissao_fixa?: number
          comissao_percentual?: number
          created_at?: string
          id?: string
          observacoes?: string | null
          pronaf_produto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrobanker_produtos_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrobanker_produtos_pronaf_produto_id_fkey"
            columns: ["pronaf_produto_id"]
            isOneToOne: false
            referencedRelation: "pronaf_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      agrobanker_regioes: {
        Row: {
          agrobanker_id: string
          ativo: boolean
          created_at: string
          id: string
          municipio: string | null
          uf: string
        }
        Insert: {
          agrobanker_id: string
          ativo?: boolean
          created_at?: string
          id?: string
          municipio?: string | null
          uf: string
        }
        Update: {
          agrobanker_id?: string
          ativo?: boolean
          created_at?: string
          id?: string
          municipio?: string | null
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrobanker_regioes_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
        ]
      }
      agrobankers: {
        Row: {
          cnpj: string
          created_at: string
          descricao_tipo: string | null
          endereco: string | null
          id: string
          municipio: string | null
          nome_fantasia: string
          razao_social: string
          status_verificacao: string
          telefone_comercial: string | null
          tipo_entidade: string
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string
          created_at?: string
          descricao_tipo?: string | null
          endereco?: string | null
          id?: string
          municipio?: string | null
          nome_fantasia?: string
          razao_social?: string
          status_verificacao?: string
          telefone_comercial?: string | null
          tipo_entidade?: string
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          descricao_tipo?: string | null
          endereco?: string | null
          id?: string
          municipio?: string | null
          nome_fantasia?: string
          razao_social?: string
          status_verificacao?: string
          telefone_comercial?: string | null
          tipo_entidade?: string
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: string | null
          perfil: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          perfil?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          perfil?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banco_usuarios: {
        Row: {
          banco_parceiro_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          banco_parceiro_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          banco_parceiro_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_usuarios_banco_parceiro_id_fkey"
            columns: ["banco_parceiro_id"]
            isOneToOne: false
            referencedRelation: "bancos_parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos_parceiros: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      blacklist: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          id: string
          motivo: string
          tipo: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          id?: string
          motivo?: string
          tipo: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          id?: string
          motivo?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_mensagens: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          mensagem: string
          remetente_id: string
          remetente_role: string
          solicitacao_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          mensagem: string
          remetente_id: string
          remetente_role: string
          solicitacao_id?: string | null
        }
        Update: {
          audio_url?: string | null
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
          sla_global_dias: number
          updated_at: string
          valor_base_laudo: number
        }
        Insert: {
          id?: string
          percentual_taxa_plataforma?: number
          prazo_padrao_pagamento_dias?: number
          sla_global_dias?: number
          updated_at?: string
          valor_base_laudo?: number
        }
        Update: {
          id?: string
          percentual_taxa_plataforma?: number
          prazo_padrao_pagamento_dias?: number
          sla_global_dias?: number
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
          ja_engenheiro: boolean
          numero_licenca: string
          raio_atendimento_km: number | null
          rating: number | null
          regiao_id: string | null
          status_verificacao: string
          tipo_licenca: string
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
          ja_engenheiro?: boolean
          numero_licenca?: string
          raio_atendimento_km?: number | null
          rating?: number | null
          regiao_id?: string | null
          status_verificacao?: string
          tipo_licenca?: string
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
          ja_engenheiro?: boolean
          numero_licenca?: string
          raio_atendimento_km?: number | null
          rating?: number | null
          regiao_id?: string | null
          status_verificacao?: string
          tipo_licenca?: string
          total_laudos_concluidos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engenheiros_regiao_id_fkey"
            columns: ["regiao_id"]
            isOneToOne: false
            referencedRelation: "regioes"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          ativo: boolean
          chave: string
          created_at: string
          descricao: string
          escopo_id: string | null
          escopo_tipo: string
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          ativo?: boolean
          chave: string
          created_at?: string
          descricao?: string
          escopo_id?: string | null
          escopo_tipo?: string
          id?: string
          updated_at?: string
          valor?: Json
        }
        Update: {
          ativo?: boolean
          chave?: string
          created_at?: string
          descricao?: string
          escopo_id?: string | null
          escopo_tipo?: string
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      grupo_documentos_compartilhados: {
        Row: {
          caminho_arquivo: string
          created_at: string
          grupo_id: string
          id: string
          nome_arquivo: string
          nome_documento: string
          observacoes: string | null
          pronaf_documento_id: string | null
          status_documento: string
          updated_at: string
        }
        Insert: {
          caminho_arquivo: string
          created_at?: string
          grupo_id: string
          id?: string
          nome_arquivo: string
          nome_documento?: string
          observacoes?: string | null
          pronaf_documento_id?: string | null
          status_documento?: string
          updated_at?: string
        }
        Update: {
          caminho_arquivo?: string
          created_at?: string
          grupo_id?: string
          id?: string
          nome_arquivo?: string
          nome_documento?: string
          observacoes?: string | null
          pronaf_documento_id?: string | null
          status_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_documentos_compartilhados_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_solicitacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_documentos_compartilhados_pronaf_documento_id_fkey"
            columns: ["pronaf_documento_id"]
            isOneToOne: false
            referencedRelation: "pronaf_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_solicitacao: {
        Row: {
          assistido: boolean
          created_at: string
          engenheiro_assistente_id: string | null
          id: string
          observacoes_produtor: string | null
          produtor_id: string
          propriedade_id: string
          status_grupo: string
          tipo_valor_assistencia: string | null
          updated_at: string
          valor_assistencia: number | null
        }
        Insert: {
          assistido?: boolean
          created_at?: string
          engenheiro_assistente_id?: string | null
          id?: string
          observacoes_produtor?: string | null
          produtor_id: string
          propriedade_id: string
          status_grupo?: string
          tipo_valor_assistencia?: string | null
          updated_at?: string
          valor_assistencia?: number | null
        }
        Update: {
          assistido?: boolean
          created_at?: string
          engenheiro_assistente_id?: string | null
          id?: string
          observacoes_produtor?: string | null
          produtor_id?: string
          propriedade_id?: string
          status_grupo?: string
          tipo_valor_assistencia?: string | null
          updated_at?: string
          valor_assistencia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_solicitacao_engenheiro_assistente_id_fkey"
            columns: ["engenheiro_assistente_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_solicitacao_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_solicitacao_propriedade_id_fkey"
            columns: ["propriedade_id"]
            isOneToOne: false
            referencedRelation: "propriedades"
            referencedColumns: ["id"]
          },
        ]
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
      login_logs: {
        Row: {
          id: string
          ip: string | null
          login_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip?: string | null
          login_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip?: string | null
          login_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      notificacoes: {
        Row: {
          created_at: string
          entidade: string | null
          entidade_id: string | null
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_compliance: {
        Row: {
          created_at: string
          dados_validacao: Json | null
          descricao: string | null
          empresa_id: string
          fonte_validacao: string | null
          id: string
          item: string
          observacoes: string | null
          proxima_verificacao: string | null
          status: string
          ultima_verificacao_auto: string | null
          valido_ate: string | null
          verificado_em: string | null
          verificado_por: string | null
        }
        Insert: {
          created_at?: string
          dados_validacao?: Json | null
          descricao?: string | null
          empresa_id: string
          fonte_validacao?: string | null
          id?: string
          item?: string
          observacoes?: string | null
          proxima_verificacao?: string | null
          status?: string
          ultima_verificacao_auto?: string | null
          valido_ate?: string | null
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Update: {
          created_at?: string
          dados_validacao?: Json | null
          descricao?: string | null
          empresa_id?: string
          fonte_validacao?: string | null
          id?: string
          item?: string
          observacoes?: string | null
          proxima_verificacao?: string | null
          status?: string
          ultima_verificacao_auto?: string | null
          valido_ate?: string | null
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_compliance_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_documentos: {
        Row: {
          caminho_arquivo: string
          created_at: string
          dados_extraidos: Json | null
          data_emissao: string | null
          data_validade: string | null
          empresa_id: string
          id: string
          nome_arquivo: string
          observacoes: string | null
          orgao_emissor: string | null
          status: string
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          caminho_arquivo?: string
          created_at?: string
          dados_extraidos?: Json | null
          data_emissao?: string | null
          data_validade?: string | null
          empresa_id: string
          id?: string
          nome_arquivo?: string
          observacoes?: string | null
          orgao_emissor?: string | null
          status?: string
          tipo_documento?: string
          updated_at?: string
        }
        Update: {
          caminho_arquivo?: string
          created_at?: string
          dados_extraidos?: Json | null
          data_emissao?: string | null
          data_validade?: string | null
          empresa_id?: string
          id?: string
          nome_arquivo?: string
          observacoes?: string | null
          orgao_emissor?: string | null
          status?: string
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_empresas: {
        Row: {
          cnpj: string
          comissao_percentual: number | null
          created_at: string
          created_by: string | null
          dados_receita: Json | null
          email: string | null
          endereco: string | null
          id: string
          municipio: string
          nome_fantasia: string
          parent_id: string | null
          razao_social: string
          regiao_atuacao: string | null
          situacao_cadastral: string | null
          status: string
          telefone: string | null
          tipo: string
          uf: string
          ultima_consulta_cnpj: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cnpj?: string
          comissao_percentual?: number | null
          created_at?: string
          created_by?: string | null
          dados_receita?: Json | null
          email?: string | null
          endereco?: string | null
          id?: string
          municipio?: string
          nome_fantasia?: string
          parent_id?: string | null
          razao_social?: string
          regiao_atuacao?: string | null
          situacao_cadastral?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          uf?: string
          ultima_consulta_cnpj?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cnpj?: string
          comissao_percentual?: number | null
          created_at?: string
          created_by?: string | null
          dados_receita?: Json | null
          email?: string | null
          endereco?: string | null
          id?: string
          municipio?: string
          nome_fantasia?: string
          parent_id?: string | null
          razao_social?: string
          regiao_atuacao?: string | null
          situacao_cadastral?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          uf?: string
          ultima_consulta_cnpj?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_empresas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "onboarding_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_rede_membros: {
        Row: {
          area_atuacao: string | null
          bairro: string | null
          capacidade_civil: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          comprovante_endereco: string | null
          corresp_bairro: string | null
          corresp_cep: string | null
          corresp_cidade: string | null
          corresp_complemento: string | null
          corresp_imovel_proprio: boolean | null
          corresp_logradouro: string | null
          corresp_numero: string | null
          corresp_perimetro: string | null
          corresp_tipo_imovel: string | null
          corresp_uf: string | null
          cpf: string | null
          cpf_conjuge: string | null
          crea: string | null
          created_at: string
          created_by: string | null
          dados_receita: Json | null
          data_nascimento: string | null
          ddd: string | null
          documento_cidade: string | null
          documento_data_emissao: string | null
          documento_numero_registro: string | null
          documento_numero_via: string | null
          documento_orgao_emissor: string | null
          documento_uf: string | null
          documento_unidade_funai: string | null
          email: string | null
          empresa_id: string
          endereco_correspondencia: boolean | null
          estado_civil: string | null
          genero: string | null
          grau_instrucao: string | null
          id: string
          imovel_proprio: boolean | null
          inscricao_estadual: string | null
          local_correio: boolean | null
          logradouro: string | null
          nacionalidade: string | null
          nome_completo: string
          nome_conjuge: string | null
          nome_fantasia: string | null
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          numero_documento: string | null
          numero_licenca: string | null
          perimetro: string | null
          pessoa_exposta_politicamente: boolean | null
          razao_social: string | null
          regime_casamento: string | null
          rg: string | null
          rg_orgao_emissor: string | null
          rg_uf: string | null
          segmento: string
          segmento_outro: string | null
          situacao_cadastral: string | null
          status: string
          telefone: string | null
          tempo_utilizacao_meses: number | null
          tipo_documento: string | null
          tipo_endereco: string | null
          tipo_imovel: string | null
          tipo_licenca: string | null
          tipo_pessoa: string
          uf: string | null
          updated_at: string
          user_criado: boolean | null
          user_id: string | null
          zona_urbana: boolean | null
        }
        Insert: {
          area_atuacao?: string | null
          bairro?: string | null
          capacidade_civil?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          comprovante_endereco?: string | null
          corresp_bairro?: string | null
          corresp_cep?: string | null
          corresp_cidade?: string | null
          corresp_complemento?: string | null
          corresp_imovel_proprio?: boolean | null
          corresp_logradouro?: string | null
          corresp_numero?: string | null
          corresp_perimetro?: string | null
          corresp_tipo_imovel?: string | null
          corresp_uf?: string | null
          cpf?: string | null
          cpf_conjuge?: string | null
          crea?: string | null
          created_at?: string
          created_by?: string | null
          dados_receita?: Json | null
          data_nascimento?: string | null
          ddd?: string | null
          documento_cidade?: string | null
          documento_data_emissao?: string | null
          documento_numero_registro?: string | null
          documento_numero_via?: string | null
          documento_orgao_emissor?: string | null
          documento_uf?: string | null
          documento_unidade_funai?: string | null
          email?: string | null
          empresa_id: string
          endereco_correspondencia?: boolean | null
          estado_civil?: string | null
          genero?: string | null
          grau_instrucao?: string | null
          id?: string
          imovel_proprio?: boolean | null
          inscricao_estadual?: string | null
          local_correio?: boolean | null
          logradouro?: string | null
          nacionalidade?: string | null
          nome_completo?: string
          nome_conjuge?: string | null
          nome_fantasia?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          numero_documento?: string | null
          numero_licenca?: string | null
          perimetro?: string | null
          pessoa_exposta_politicamente?: boolean | null
          razao_social?: string | null
          regime_casamento?: string | null
          rg?: string | null
          rg_orgao_emissor?: string | null
          rg_uf?: string | null
          segmento?: string
          segmento_outro?: string | null
          situacao_cadastral?: string | null
          status?: string
          telefone?: string | null
          tempo_utilizacao_meses?: number | null
          tipo_documento?: string | null
          tipo_endereco?: string | null
          tipo_imovel?: string | null
          tipo_licenca?: string | null
          tipo_pessoa?: string
          uf?: string | null
          updated_at?: string
          user_criado?: boolean | null
          user_id?: string | null
          zona_urbana?: boolean | null
        }
        Update: {
          area_atuacao?: string | null
          bairro?: string | null
          capacidade_civil?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          comprovante_endereco?: string | null
          corresp_bairro?: string | null
          corresp_cep?: string | null
          corresp_cidade?: string | null
          corresp_complemento?: string | null
          corresp_imovel_proprio?: boolean | null
          corresp_logradouro?: string | null
          corresp_numero?: string | null
          corresp_perimetro?: string | null
          corresp_tipo_imovel?: string | null
          corresp_uf?: string | null
          cpf?: string | null
          cpf_conjuge?: string | null
          crea?: string | null
          created_at?: string
          created_by?: string | null
          dados_receita?: Json | null
          data_nascimento?: string | null
          ddd?: string | null
          documento_cidade?: string | null
          documento_data_emissao?: string | null
          documento_numero_registro?: string | null
          documento_numero_via?: string | null
          documento_orgao_emissor?: string | null
          documento_uf?: string | null
          documento_unidade_funai?: string | null
          email?: string | null
          empresa_id?: string
          endereco_correspondencia?: boolean | null
          estado_civil?: string | null
          genero?: string | null
          grau_instrucao?: string | null
          id?: string
          imovel_proprio?: boolean | null
          inscricao_estadual?: string | null
          local_correio?: boolean | null
          logradouro?: string | null
          nacionalidade?: string | null
          nome_completo?: string
          nome_conjuge?: string | null
          nome_fantasia?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          numero_documento?: string | null
          numero_licenca?: string | null
          perimetro?: string | null
          pessoa_exposta_politicamente?: boolean | null
          razao_social?: string | null
          regime_casamento?: string | null
          rg?: string | null
          rg_orgao_emissor?: string | null
          rg_uf?: string | null
          segmento?: string
          segmento_outro?: string | null
          situacao_cadastral?: string | null
          status?: string
          telefone?: string | null
          tempo_utilizacao_meses?: number | null
          tipo_documento?: string | null
          tipo_endereco?: string | null
          tipo_imovel?: string | null
          tipo_licenca?: string | null
          tipo_pessoa?: string
          uf?: string | null
          updated_at?: string
          user_criado?: boolean | null
          user_id?: string | null
          zona_urbana?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_rede_membros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responsaveis: {
        Row: {
          cargo: string | null
          cpf: string
          created_at: string
          email: string
          empresa_id: string
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          cpf?: string
          created_at?: string
          email?: string
          empresa_id: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string
          created_at?: string
          email?: string
          empresa_id?: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_responsaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_custeio_itens: {
        Row: {
          categoria: string
          created_at: string
          descricao: string
          id: string
          quantidade: number
          solicitacao_id: string
          unidade: string
          updated_at: string
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          solicitacao_id: string
          unidade?: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          solicitacao_id?: string
          unidade?: string
          updated_at?: string
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_custeio_itens_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_laudo"
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
          area_app_ha: number | null
          area_reserva_legal_ha: number | null
          area_total_ha: number
          codigo_car: string | null
          created_at: string
          endereco: string
          fonte_agua: string | null
          id: string
          latitude: number | null
          longitude: number | null
          matricula_imovel: string | null
          municipio: string
          nome_propriedade: string
          numero_ccir: string | null
          numero_itr: string | null
          produtor_id: string
          regiao_id: string | null
          tipo_posse: string
          tipo_solo: string | null
          uf: string
          updated_at: string
        }
        Insert: {
          area_app_ha?: number | null
          area_reserva_legal_ha?: number | null
          area_total_ha?: number
          codigo_car?: string | null
          created_at?: string
          endereco?: string
          fonte_agua?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          matricula_imovel?: string | null
          municipio?: string
          nome_propriedade: string
          numero_ccir?: string | null
          numero_itr?: string | null
          produtor_id: string
          regiao_id?: string | null
          tipo_posse?: string
          tipo_solo?: string | null
          uf?: string
          updated_at?: string
        }
        Update: {
          area_app_ha?: number | null
          area_reserva_legal_ha?: number | null
          area_total_ha?: number
          codigo_car?: string | null
          created_at?: string
          endereco?: string
          fonte_agua?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          matricula_imovel?: string | null
          municipio?: string
          nome_propriedade?: string
          numero_ccir?: string | null
          numero_itr?: string | null
          produtor_id?: string
          regiao_id?: string | null
          tipo_posse?: string
          tipo_solo?: string | null
          uf?: string
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
          {
            foreignKeyName: "propriedades_regiao_id_fkey"
            columns: ["regiao_id"]
            isOneToOne: false
            referencedRelation: "regioes"
            referencedColumns: ["id"]
          },
        ]
      }
      regioes: {
        Row: {
          created_at: string
          id: string
          nome: string
          uf: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          uf: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      sla_config: {
        Row: {
          created_at: string
          id: string
          prazo_horas: number
          status_solicitacao: string
        }
        Insert: {
          created_at?: string
          id?: string
          prazo_horas?: number
          status_solicitacao: string
        }
        Update: {
          created_at?: string
          id?: string
          prazo_horas?: number
          status_solicitacao?: string
        }
        Relationships: []
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
      solicitacao_eventos: {
        Row: {
          autor_id: string | null
          autor_tipo: string
          campo_alterado: string | null
          created_at: string
          descricao: string | null
          id: string
          solicitacao_id: string
          tipo_evento: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          autor_id?: string | null
          autor_tipo?: string
          campo_alterado?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          solicitacao_id: string
          tipo_evento: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          autor_id?: string | null
          autor_tipo?: string
          campo_alterado?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          solicitacao_id?: string
          tipo_evento?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_eventos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_laudo"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_laudo: {
        Row: {
          agrobanker_id: string | null
          aprovado_mesa_em: string | null
          aprovado_mesa_por: string | null
          area_cultivo_ha: number
          assistido: boolean
          banco_destino: string | null
          banco_parceiro_id: string | null
          created_at: string
          cultura_principal: string
          data_envio_banco: string | null
          data_retorno_banco: string | null
          docs_habilitados: boolean
          engenheiro_assistente_id: string | null
          engenheiro_atribuido_id: string | null
          grupo_id: string | null
          id: string
          notas_mesa: string | null
          observacoes_banco: string | null
          observacoes_produtor: string | null
          produtor_id: string
          pronaf_produto_id: string | null
          propriedade_id: string
          status_banco: string
          status_solicitacao: string
          tipo_credito: string
          tipo_valor_engenheiro_override: string | null
          updated_at: string
          valor_engenheiro_override: number | null
          valor_pagamento_engenheiro: number
          valor_solicitado: number
        }
        Insert: {
          agrobanker_id?: string | null
          aprovado_mesa_em?: string | null
          aprovado_mesa_por?: string | null
          area_cultivo_ha?: number
          assistido?: boolean
          banco_destino?: string | null
          banco_parceiro_id?: string | null
          created_at?: string
          cultura_principal?: string
          data_envio_banco?: string | null
          data_retorno_banco?: string | null
          docs_habilitados?: boolean
          engenheiro_assistente_id?: string | null
          engenheiro_atribuido_id?: string | null
          grupo_id?: string | null
          id?: string
          notas_mesa?: string | null
          observacoes_banco?: string | null
          observacoes_produtor?: string | null
          produtor_id: string
          pronaf_produto_id?: string | null
          propriedade_id: string
          status_banco?: string
          status_solicitacao?: string
          tipo_credito?: string
          tipo_valor_engenheiro_override?: string | null
          updated_at?: string
          valor_engenheiro_override?: number | null
          valor_pagamento_engenheiro?: number
          valor_solicitado?: number
        }
        Update: {
          agrobanker_id?: string | null
          aprovado_mesa_em?: string | null
          aprovado_mesa_por?: string | null
          area_cultivo_ha?: number
          assistido?: boolean
          banco_destino?: string | null
          banco_parceiro_id?: string | null
          created_at?: string
          cultura_principal?: string
          data_envio_banco?: string | null
          data_retorno_banco?: string | null
          docs_habilitados?: boolean
          engenheiro_assistente_id?: string | null
          engenheiro_atribuido_id?: string | null
          grupo_id?: string | null
          id?: string
          notas_mesa?: string | null
          observacoes_banco?: string | null
          observacoes_produtor?: string | null
          produtor_id?: string
          pronaf_produto_id?: string | null
          propriedade_id?: string
          status_banco?: string
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
            foreignKeyName: "solicitacoes_laudo_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_banco_parceiro_id_fkey"
            columns: ["banco_parceiro_id"]
            isOneToOne: false
            referencedRelation: "bancos_parceiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_engenheiro_assistente_id_fkey"
            columns: ["engenheiro_assistente_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_engenheiro_atribuido_id_fkey"
            columns: ["engenheiro_atribuido_id"]
            isOneToOne: false
            referencedRelation: "engenheiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_laudo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_solicitacao"
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
      treinamento_agenda: {
        Row: {
          ativo: boolean
          created_at: string
          data_evento: string
          descricao: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          max_participantes: number | null
          modulo_id: string | null
          obrigatorio: boolean
          recorrencia: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_evento: string
          descricao?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          max_participantes?: number | null
          modulo_id?: string | null
          obrigatorio?: boolean
          recorrencia?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_evento?: string
          descricao?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          max_participantes?: number | null
          modulo_id?: string | null
          obrigatorio?: boolean
          recorrencia?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_agenda_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "treinamento_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_badges: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          criterio_tipo: string
          criterio_valor: string
          descricao: string
          icone: string
          id: string
          nome: string
          pontos_bonus: number
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          criterio_tipo?: string
          criterio_valor?: string
          descricao?: string
          icone?: string
          id?: string
          nome: string
          pontos_bonus?: number
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          criterio_tipo?: string
          criterio_valor?: string
          descricao?: string
          icone?: string
          id?: string
          nome?: string
          pontos_bonus?: number
        }
        Relationships: []
      }
      treinamento_badges_conquistados: {
        Row: {
          agrobanker_id: string
          badge_id: string
          data_conquista: string
          id: string
        }
        Insert: {
          agrobanker_id: string
          badge_id: string
          data_conquista?: string
          id?: string
        }
        Update: {
          agrobanker_id?: string
          badge_id?: string
          data_conquista?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_badges_conquistados_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_badges_conquistados_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "treinamento_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_modulos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          duracao_minutos: number
          id: string
          obrigatorio: boolean
          ordem: number
          pontos: number
          pre_requisito_id: string | null
          titulo: string
          trilha_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          duracao_minutos?: number
          id?: string
          obrigatorio?: boolean
          ordem?: number
          pontos?: number
          pre_requisito_id?: string | null
          titulo: string
          trilha_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          duracao_minutos?: number
          id?: string
          obrigatorio?: boolean
          ordem?: number
          pontos?: number
          pre_requisito_id?: string | null
          titulo?: string
          trilha_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_modulos_pre_requisito_id_fkey"
            columns: ["pre_requisito_id"]
            isOneToOne: false
            referencedRelation: "treinamento_modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_modulos_trilha_id_fkey"
            columns: ["trilha_id"]
            isOneToOne: false
            referencedRelation: "treinamento_trilhas"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_progresso: {
        Row: {
          agrobanker_id: string
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          modulo_id: string
          pontuacao: number
          status: string
          tentativas: number
          updated_at: string
        }
        Insert: {
          agrobanker_id: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          modulo_id: string
          pontuacao?: number
          status?: string
          tentativas?: number
          updated_at?: string
        }
        Update: {
          agrobanker_id?: string
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          modulo_id?: string
          pontuacao?: number
          status?: string
          tentativas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_progresso_agrobanker_id_fkey"
            columns: ["agrobanker_id"]
            isOneToOne: false
            referencedRelation: "agrobankers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_progresso_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "treinamento_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_sla: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          id: string
          nome: string
          penalidade: string
          prazo_dias: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          penalidade?: string
          prazo_dias?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          penalidade?: string
          prazo_dias?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      treinamento_trilhas: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string
          icone: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string
          icone?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string
          icone?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
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
      zarc_regras: {
        Row: {
          ativo: boolean
          ciclo: string
          created_at: string
          cultura: string
          id: string
          municipio: string
          observacoes: string | null
          periodo_plantio_fim: number | null
          periodo_plantio_inicio: number | null
          risco: string
          safra: string
          tipo_solo: string
          uf: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          ciclo?: string
          created_at?: string
          cultura: string
          id?: string
          municipio?: string
          observacoes?: string | null
          periodo_plantio_fim?: number | null
          periodo_plantio_inicio?: number | null
          risco?: string
          safra?: string
          tipo_solo?: string
          uf: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          ciclo?: string
          created_at?: string
          cultura?: string
          id?: string
          municipio?: string
          observacoes?: string | null
          periodo_plantio_fim?: number | null
          periodo_plantio_inicio?: number | null
          risco?: string
          safra?: string
          tipo_solo?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_notificacao: {
        Args: {
          _entidade?: string
          _entidade_id?: string
          _link?: string
          _mensagem?: string
          _tipo?: string
          _titulo: string
          _user_id: string
        }
        Returns: undefined
      }
      get_agrobanker_id: { Args: never; Returns: string }
      get_banco_parceiro_id: { Args: never; Returns: string }
      get_engenheiro_assistente_grupo_ids: { Args: never; Returns: string[] }
      get_engenheiro_id: { Args: never; Returns: string }
      get_engenheiro_laudo_solicitacao_ids: { Args: never; Returns: string[] }
      get_onboarding_empresa_id: { Args: never; Returns: string }
      get_produtor_grupo_ids: { Args: never; Returns: string[] }
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
      is_agrobanker: { Args: never; Returns: boolean }
      is_banco: { Args: never; Returns: boolean }
      is_coban_master: { Args: never; Returns: boolean }
      is_engenheiro: { Args: never; Returns: boolean }
      is_mesa_produtos: { Args: never; Returns: boolean }
      is_produtor: { Args: never; Returns: boolean }
      is_subestabelecido: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "produtor"
        | "engenheiro"
        | "admin"
        | "mesa_produtos"
        | "banco"
        | "agrobanker"
        | "coban_master"
        | "subestabelecido"
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
      app_role: [
        "produtor",
        "engenheiro",
        "admin",
        "mesa_produtos",
        "banco",
        "agrobanker",
        "coban_master",
        "subestabelecido",
      ],
    },
  },
} as const
