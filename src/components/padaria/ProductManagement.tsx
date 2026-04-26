import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
  estoque_atual: number;
  disponivel: boolean;
  imagem_url?: string;
}

interface ProductManagementProps {
  padariaId: string;
}

export function ProductManagement({ padariaId }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome_produto: "",
    preco: "",
    tipo_pao: "",
    estoque_atual: "",
    disponivel: true,
    imagem_url: "",
  });

  useEffect(() => {
    fetchProducts();
  }, [padariaId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("padaria_id", padariaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        nome_produto: formData.nome_produto,
        preco: parseFloat(formData.preco),
        tipo_pao: formData.tipo_pao,
        estoque_atual: parseInt(formData.estoque_atual),
        disponivel: formData.disponivel,
        imagem_url: formData.imagem_url || null,
        padaria_id: padariaId,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("produtos")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast({ title: "Produto atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from("produtos")
          .insert([productData]);

        if (error) throw error;
        toast({ title: "Produto adicionado com sucesso!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nome_produto: product.nome_produto,
      preco: product.preco.toString(),
      tipo_pao: product.tipo_pao || "",
      estoque_atual: product.estoque_atual.toString(),
      disponivel: product.disponivel,
      imagem_url: product.imagem_url || "",
    });
    setDialogOpen(true);
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("produtos")
        .update({ disponivel: !product.disponivel })
        .eq("id", product.id);

      if (error) throw error;
      toast({ title: "Status atualizado!" });
      fetchProducts();
    } catch (error) {
      console.error("Erro ao atualizar disponibilidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome_produto: "",
      preco: "",
      tipo_pao: "",
      estoque_atual: "",
      disponivel: true,
      imagem_url: "",
    });
    setEditingProduct(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Produtos</h2>
          <p className="text-muted-foreground">Adicione e gerencie seus produtos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produto
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome_produto">Nome do Produto</Label>
                  <Input
                    id="nome_produto"
                    value={formData.nome_produto}
                    onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo_pao">Tipo de Pão</Label>
                  <Input
                    id="tipo_pao"
                    value={formData.tipo_pao}
                    onChange={(e) => setFormData({ ...formData, tipo_pao: e.target.value })}
                    placeholder="Ex: Pão Simples, Baguete..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preco">Preço (MZN)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estoque_atual">Estoque</Label>
                    <Input
                      id="estoque_atual"
                      type="number"
                      value={formData.estoque_atual}
                      onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imagem_url">URL da Imagem (opcional)</Label>
                  <Input
                    id="imagem_url"
                    type="url"
                    value={formData.imagem_url}
                    onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="disponivel"
                    checked={formData.disponivel}
                    onCheckedChange={(checked) => setFormData({ ...formData, disponivel: checked })}
                  />
                  <Label htmlFor="disponivel">Produto disponível</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus Produtos</CardTitle>
          <CardDescription>Lista de todos os produtos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const lowStock = product.estoque_atual < 10;
                return (
                <TableRow key={product.id} className={lowStock ? "bg-red-50 dark:bg-red-950/20" : ""}>
                  <TableCell className="font-medium">{product.nome_produto}</TableCell>
                  <TableCell>{product.tipo_pao}</TableCell>
                  <TableCell>{product.preco.toFixed(2)} MZN</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{product.estoque_atual}</span>
                      {lowStock && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Baixo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.disponivel}
                      onCheckedChange={() => handleToggleAvailability(product)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum produto cadastrado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
