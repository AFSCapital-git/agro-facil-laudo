import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  link: string | null;
  entidade: string | null;
  entidade_id: string | null;
  created_at: string;
}

export function useNotificacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notificacao[];
    },
    enabled: !!user,
  });

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const marcarTodasLidas = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("notificacoes")
        .update({ lida: true })
        .eq("lida", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notificacoes-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["notificacoes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return {
    notificacoes,
    naoLidas,
    isLoading,
    marcarLida: marcarLida.mutate,
    marcarTodasLidas: marcarTodasLidas.mutate,
  };
}
