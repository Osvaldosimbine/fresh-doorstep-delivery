// Simple client-side stock update utility
// Since we can't use RPC functions that don't exist, we'll handle stock updates directly

export const updateProductStock = async (supabase: any, productId: string, quantity: number) => {
  // First get current stock
  const { data: product, error: fetchError } = await supabase
    .from('produtos')
    .select('estoque_atual')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw new Error(`Failed to fetch product stock: ${fetchError?.message}`);
  }

  const newStock = Math.max(0, product.estoque_atual - quantity);

  // Update stock
  const { error: updateError } = await supabase
    .from('produtos')
    .update({ estoque_atual: newStock })
    .eq('id', productId);

  if (updateError) {
    throw new Error(`Failed to update product stock: ${updateError.message}`);
  }

  return newStock;
};