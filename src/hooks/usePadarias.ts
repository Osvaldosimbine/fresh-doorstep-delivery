import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Produto {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
  estoque_atual: number;
  disponivel: boolean;
}

interface Padaria {
  id: string;
  nome_padaria: string;
  endereco: string;
  localizacao: string;
  produtos: Produto[];
}

export const usePadarias = (selectedLocation: string) => {
  const [padarias, setPadarias] = useState<Padaria[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPadarias = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("padarias")
        .select(`
          id,
          nome_padaria,
          endereco,
          localizacao,
          produtos (
            id,
            nome_produto,
            preco,
            tipo_pao,
            estoque_atual,
            disponivel
          )
        `)
        .eq("status_ativa", true);

      if (selectedLocation && selectedLocation !== "all") {
        query = query.eq("localizacao", selectedLocation);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPadarias(data || []);
    } catch (error) {
      console.error("Erro ao carregar padarias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as padarias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPadarias();
  }, [selectedLocation]);

  return { padarias, loading, refetch: fetchPadarias };
};