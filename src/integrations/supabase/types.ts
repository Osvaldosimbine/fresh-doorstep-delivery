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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      avaliacoes_entregador: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string
          entregador_id: string
          id: string
          nota: number
          pedido_id: string
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string
          entregador_id: string
          id?: string
          nota: number
          pedido_id: string
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string
          entregador_id?: string
          id?: string
          nota?: number
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_entregador_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_entregador_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_entregador_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira_entregador: {
        Row: {
          created_at: string
          entregador_id: string
          id: string
          saldo_disponivel: number
          saldo_pendente: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          entregador_id: string
          id?: string
          saldo_disponivel?: number
          saldo_pendente?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          entregador_id?: string
          id?: string
          saldo_disponivel?: number
          saldo_pendente?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteira_entregador_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comprovativo_entrega: {
        Row: {
          created_at: string
          entregador_id: string
          foto_url: string | null
          id: string
          pedido_id: string
          pin_confirmado: boolean | null
          tipo: string
        }
        Insert: {
          created_at?: string
          entregador_id: string
          foto_url?: string | null
          id?: string
          pedido_id: string
          pin_confirmado?: boolean | null
          tipo: string
        }
        Update: {
          created_at?: string
          entregador_id?: string
          foto_url?: string | null
          id?: string
          pedido_id?: string
          pin_confirmado?: boolean | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprovativo_entrega_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprovativo_entrega_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      entregador_status: {
        Row: {
          coordenadas_lat: number | null
          coordenadas_lng: number | null
          disponivel: boolean
          entregador_id: string
          id: string
          localizacao_atual: string | null
          turno_iniciado_em: string | null
          ultimo_update: string | null
        }
        Insert: {
          coordenadas_lat?: number | null
          coordenadas_lng?: number | null
          disponivel?: boolean
          entregador_id: string
          id?: string
          localizacao_atual?: string | null
          turno_iniciado_em?: string | null
          ultimo_update?: string | null
        }
        Update: {
          coordenadas_lat?: number | null
          coordenadas_lng?: number | null
          disponivel?: boolean
          entregador_id?: string
          id?: string
          localizacao_atual?: string | null
          turno_iniciado_em?: string | null
          ultimo_update?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregador_status_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          comissao_percentual: number
          created_at: string
          data_coleta: string | null
          data_entrega: string | null
          entregador_id: string
          id: string
          local_entrega: string
          local_retirada: string
          marcada_coletada_em: string | null
          marcada_entregue_em: string | null
          ordem_na_rota: number | null
          pedido_id: string
          rota_id: string | null
          status_entrega: Database["public"]["Enums"]["status_entrega"]
          updated_at: string
          valor_comissao: number | null
        }
        Insert: {
          comissao_percentual?: number
          created_at?: string
          data_coleta?: string | null
          data_entrega?: string | null
          entregador_id: string
          id?: string
          local_entrega: string
          local_retirada: string
          marcada_coletada_em?: string | null
          marcada_entregue_em?: string | null
          ordem_na_rota?: number | null
          pedido_id: string
          rota_id?: string | null
          status_entrega?: Database["public"]["Enums"]["status_entrega"]
          updated_at?: string
          valor_comissao?: number | null
        }
        Update: {
          comissao_percentual?: number
          created_at?: string
          data_coleta?: string | null
          data_entrega?: string | null
          entregador_id?: string
          id?: string
          local_entrega?: string
          local_retirada?: string
          marcada_coletada_em?: string | null
          marcada_entregue_em?: string | null
          ordem_na_rota?: number | null
          pedido_id?: string
          rota_id?: string | null
          status_entrega?: Database["public"]["Enums"]["status_entrega"]
          updated_at?: string
          valor_comissao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas_otimizadas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          created_at: string
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      padarias: {
        Row: {
          coordenadas_lat: number | null
          coordenadas_lng: number | null
          created_at: string
          endereco: string
          horario_funcionamento: Json | null
          id: string
          localizacao: string | null
          nome_padaria: string
          status_ativa: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coordenadas_lat?: number | null
          coordenadas_lng?: number | null
          created_at?: string
          endereco: string
          horario_funcionamento?: Json | null
          id?: string
          localizacao?: string | null
          nome_padaria: string
          status_ativa?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coordenadas_lat?: number | null
          coordenadas_lng?: number | null
          created_at?: string
          endereco?: string
          horario_funcionamento?: Json | null
          id?: string
          localizacao?: string | null
          nome_padaria?: string
          status_ativa?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pagamentos_comissoes: {
        Row: {
          created_at: string
          data_pagamento: string | null
          entregador_id: string
          id: string
          pago: boolean
          pedido_id: string
          percentual_comissao: number
          valor_recebido: number
          valor_total_entrega: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          entregador_id: string
          id?: string
          pago?: boolean
          pedido_id: string
          percentual_comissao: number
          valor_recebido: number
          valor_total_entrega: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          entregador_id?: string
          id?: string
          pago?: boolean
          pedido_id?: string
          percentual_comissao?: number
          valor_recebido?: number
          valor_total_entrega?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_comissoes_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_comissoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          distancia_km: number | null
          endereco_entrega: string
          entregador_id: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          horario_agendado: string | null
          id: string
          localizacao_entrega: string | null
          observacoes: string | null
          padaria_id: string
          status_pedido: Database["public"]["Enums"]["status_pedido"]
          taxa_servico_total: number | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          distancia_km?: number | null
          endereco_entrega: string
          entregador_id?: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          horario_agendado?: string | null
          id?: string
          localizacao_entrega?: string | null
          observacoes?: string | null
          padaria_id: string
          status_pedido?: Database["public"]["Enums"]["status_pedido"]
          taxa_servico_total?: number | null
          updated_at?: string
          valor_total: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          distancia_km?: number | null
          endereco_entrega?: string
          entregador_id?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          horario_agendado?: string | null
          id?: string
          localizacao_entrega?: string | null
          observacoes?: string | null
          padaria_id?: string
          status_pedido?: Database["public"]["Enums"]["status_pedido"]
          taxa_servico_total?: number | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_padaria_id_fkey"
            columns: ["padaria_id"]
            isOneToOne: false
            referencedRelation: "padarias"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_saque: {
        Row: {
          created_at: string
          entregador_id: string
          id: string
          metodo_pagamento: string
          numero_conta: string
          processado_em: string | null
          status: string
          valor: number
        }
        Insert: {
          created_at?: string
          entregador_id: string
          id?: string
          metodo_pagamento: string
          numero_conta: string
          processado_em?: string | null
          status?: string
          valor: number
        }
        Update: {
          created_at?: string
          entregador_id?: string
          id?: string
          metodo_pagamento?: string
          numero_conta?: string
          processado_em?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_saque_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      problemas_rota: {
        Row: {
          created_at: string
          descricao: string | null
          entregador_id: string
          id: string
          rota_id: string
          status: string
          tipo_problema: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          entregador_id: string
          id?: string
          rota_id: string
          status?: string
          tipo_problema: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          entregador_id?: string
          id?: string
          rota_id?: string
          status?: string
          tipo_problema?: string
        }
        Relationships: [
          {
            foreignKeyName: "problemas_rota_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problemas_rota_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas_otimizadas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          created_at: string
          disponivel: boolean
          estoque_atual: number
          id: string
          imagem_url: string | null
          nome_produto: string
          padaria_id: string
          preco: number
          tipo_pao: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          disponivel?: boolean
          estoque_atual?: number
          id?: string
          imagem_url?: string | null
          nome_produto: string
          padaria_id: string
          preco: number
          tipo_pao?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          disponivel?: boolean
          estoque_atual?: number
          id?: string
          imagem_url?: string | null
          nome_produto?: string
          padaria_id?: string
          preco?: number
          tipo_pao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_padaria_id_fkey"
            columns: ["padaria_id"]
            isOneToOne: false
            referencedRelation: "padarias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          documento_url: string | null
          email: string
          endereco: string | null
          foto_url: string | null
          id: string
          km_acumulados: number | null
          localizacao: string | null
          matricula_veiculo: string | null
          nome_completo: string
          numero_documento: string | null
          rating_medio: number | null
          role: string | null
          status_cadastro: Database["public"]["Enums"]["status_cadastro"]
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          tipo_veiculo: string | null
          total_entregas: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento_url?: string | null
          email: string
          endereco?: string | null
          foto_url?: string | null
          id?: string
          km_acumulados?: number | null
          localizacao?: string | null
          matricula_veiculo?: string | null
          nome_completo: string
          numero_documento?: string | null
          rating_medio?: number | null
          role?: string | null
          status_cadastro?: Database["public"]["Enums"]["status_cadastro"]
          telefone: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          tipo_veiculo?: string | null
          total_entregas?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento_url?: string | null
          email?: string
          endereco?: string | null
          foto_url?: string | null
          id?: string
          km_acumulados?: number | null
          localizacao?: string | null
          matricula_veiculo?: string | null
          nome_completo?: string
          numero_documento?: string | null
          rating_medio?: number | null
          role?: string | null
          status_cadastro?: Database["public"]["Enums"]["status_cadastro"]
          telefone?: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          tipo_veiculo?: string | null
          total_entregas?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rotas_otimizadas: {
        Row: {
          aceita_em: string | null
          concluida_em: string | null
          created_at: string | null
          distancia_total_km: number
          entregador_id: string | null
          id: string
          iniciada_em: string | null
          ordem_paragens: Json
          padaria_id: string
          pedidos_ids: string[]
          status: string
          tempo_estimado_minutos: number
        }
        Insert: {
          aceita_em?: string | null
          concluida_em?: string | null
          created_at?: string | null
          distancia_total_km: number
          entregador_id?: string | null
          id?: string
          iniciada_em?: string | null
          ordem_paragens: Json
          padaria_id: string
          pedidos_ids: string[]
          status?: string
          tempo_estimado_minutos: number
        }
        Update: {
          aceita_em?: string | null
          concluida_em?: string | null
          created_at?: string | null
          distancia_total_km?: number
          entregador_id?: string | null
          id?: string
          iniciada_em?: string | null
          ordem_paragens?: Json
          padaria_id?: string
          pedidos_ids?: string[]
          status?: string
          tempo_estimado_minutos?: number
        }
        Relationships: [
          {
            foreignKeyName: "rotas_otimizadas_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotas_otimizadas_padaria_id_fkey"
            columns: ["padaria_id"]
            isOneToOne: false
            referencedRelation: "padarias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          foto_passaporte: string | null
          id: string
          localizacao_atual: string | null
          nome_completo: string
          status_cadastro: Database["public"]["Enums"]["status_cadastro"]
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          foto_passaporte?: string | null
          id?: string
          localizacao_atual?: string | null
          nome_completo: string
          status_cadastro?: Database["public"]["Enums"]["status_cadastro"]
          telefone: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          foto_passaporte?: string | null
          id?: string
          localizacao_atual?: string | null
          nome_completo?: string
          status_cadastro?: Database["public"]["Enums"]["status_cadastro"]
          telefone?: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { user_uuid?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_uuid?: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "cliente" | "entregador" | "padaria"
      forma_pagamento: "mpesa" | "emola" | "paypal" | "dinheiro" | "mkesh"
      status_cadastro: "pendente" | "aprovado" | "rejeitado"
      status_entrega: "aceita" | "em_transito" | "entregue" | "cancelada"
      status_pedido:
        | "pendente"
        | "em_preparacao"
        | "a_caminho"
        | "entregue"
        | "cancelado"
      tipo_usuario: "cliente" | "entregador" | "padaria"
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
      app_role: ["admin", "cliente", "entregador", "padaria"],
      forma_pagamento: ["mpesa", "emola", "paypal", "dinheiro", "mkesh"],
      status_cadastro: ["pendente", "aprovado", "rejeitado"],
      status_entrega: ["aceita", "em_transito", "entregue", "cancelada"],
      status_pedido: [
        "pendente",
        "em_preparacao",
        "a_caminho",
        "entregue",
        "cancelado",
      ],
      tipo_usuario: ["cliente", "entregador", "padaria"],
    },
  },
} as const
