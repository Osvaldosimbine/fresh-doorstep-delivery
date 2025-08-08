import React, { createContext, useContext, useReducer } from "react";

export interface CartItem {
  id: string;
  nome_produto: string;
  preco: number;
  quantidade: number;
  padaria_id: string;
  padaria_nome: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantidade"> & { quantidade?: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantidade: number } }
  | { type: "CLEAR_CART" };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems;
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantidade: item.quantidade + (action.payload.quantidade || 1) }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantidade: action.payload.quantidade || 1 }];
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
      return { items: newItems, total };
    }
    
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      const total = newItems.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
      return { items: newItems, total };
    }
    
    case "UPDATE_QUANTITY": {
      if (action.payload.quantidade <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", payload: { id: action.payload.id } });
      }
      
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantidade: action.payload.quantidade }
          : item
      );
      const total = newItems.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
      return { items: newItems, total };
    }
    
    case "CLEAR_CART":
      return { items: [], total: 0 };
    
    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, "quantidade"> & { quantidade?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
} | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  const addItem = (item: Omit<CartItem, "quantidade"> & { quantidade?: number }) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };

  const updateQuantity = (id: string, quantidade: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantidade } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
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