import React, { createContext, useContext, useReducer } from "react";
import { calculateBulkDiscount } from "@/lib/discount";

export interface CartItem {
  id: string;
  nome_produto: string;
  preco: number;
  preco_original: number;
  quantidade: number;
  padaria: string;
  desconto_aplicado: number;
  economia_total: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  totalSavings: number;
  originalTotal: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantidade" | "preco_original" | "desconto_aplicado" | "economia_total"> & { quantidade?: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantidade: number } }
  | { type: "CLEAR_CART" };

const calculateCartTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  const originalTotal = items.reduce((sum, item) => sum + (item.preco_original * item.quantidade), 0);
  const totalSavings = items.reduce((sum, item) => sum + item.economia_total, 0);
  
  return { total, originalTotal, totalSavings };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems;
      
      if (existingItem) {
        const newQuantity = existingItem.quantidade + (action.payload.quantidade || 1);
        if (newQuantity <= 0) {
          newItems = state.items.filter(item => item.id !== action.payload.id);
        } else {
          // Apply discount calculation for updated quantity
          const discountInfo = calculateBulkDiscount(existingItem.preco_original, newQuantity);
          newItems = state.items.map(item =>
            item.id === action.payload.id
              ? { 
                  ...item, 
                  quantidade: newQuantity,
                  preco: discountInfo.discountedPrice,
                  desconto_aplicado: discountInfo.discountAmount,
                  economia_total: discountInfo.totalSavings
                }
              : item
          );
        }
      } else {
        const quantidade = action.payload.quantidade || 1;
        if (quantidade > 0) {
          const discountInfo = calculateBulkDiscount(action.payload.preco, quantidade);
          const newItem: CartItem = {
            ...action.payload,
            quantidade,
            preco_original: action.payload.preco,
            preco: discountInfo.discountedPrice,
            desconto_aplicado: discountInfo.discountAmount,
            economia_total: discountInfo.totalSavings
          };
          newItems = [...state.items, newItem];
        } else {
          newItems = state.items;
        }
      }
      
      const totals = calculateCartTotals(newItems);
      return { items: newItems, ...totals };
    }
    
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      const totals = calculateCartTotals(newItems);
      return { items: newItems, ...totals };
    }
    
    case "UPDATE_QUANTITY": {
      if (action.payload.quantidade <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", payload: { id: action.payload.id } });
      }
      
      const newItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const discountInfo = calculateBulkDiscount(item.preco_original, action.payload.quantidade);
          return {
            ...item,
            quantidade: action.payload.quantidade,
            preco: discountInfo.discountedPrice,
            desconto_aplicado: discountInfo.discountAmount,
            economia_total: discountInfo.totalSavings
          };
        }
        return item;
      });
      const totals = calculateCartTotals(newItems);
      return { items: newItems, ...totals };
    }
    
    case "CLEAR_CART":
      return { items: [], total: 0, totalSavings: 0, originalTotal: 0 };
    
    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantidade" | "preco_original" | "desconto_aplicado" | "economia_total"> & { quantidade?: number }) => void;
  addToCart: (item: Omit<CartItem, "quantidade" | "preco_original" | "desconto_aplicado" | "economia_total"> & { quantidade?: number }) => void;
  removeItem: (id: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
  getTotal: () => number;
  getTotalSavings: () => number;
} | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { 
    items: [], 
    total: 0, 
    totalSavings: 0, 
    originalTotal: 0 
  });

  const addItem = (item: Omit<CartItem, "quantidade" | "preco_original" | "desconto_aplicado" | "economia_total"> & { quantidade?: number }) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const addToCart = (item: Omit<CartItem, "quantidade" | "preco_original" | "desconto_aplicado" | "economia_total"> & { quantidade?: number }) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };

  const updateQuantity = (id: string, quantidade: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantidade } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const getItemQuantity = (id: string) => {
    const item = state.items.find(item => item.id === id);
    return item ? item.quantidade : 0;
  };

  const getTotal = () => state.total;
  
  const getTotalSavings = () => state.totalSavings;

  return (
    <CartContext.Provider value={{ 
      state, 
      items: state.items,
      addItem, 
      addToCart,
      removeItem, 
      removeFromCart,
      updateQuantity, 
      clearCart, 
      getItemQuantity,
      getTotal,
      getTotalSavings
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
};