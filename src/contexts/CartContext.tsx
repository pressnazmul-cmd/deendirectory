import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | null;
    image_url: string | null;
    seller_id: string;
    is_active: boolean;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const guestCartKey = "deen_guest_cart";

  const loadGuestCart = useCallback(() => {
    const saved = localStorage.getItem(guestCartKey);
    setItems(saved ? JSON.parse(saved) : []);
  }, []);

  const saveGuestCart = (nextItems: CartItem[]) => {
    localStorage.setItem(guestCartKey, JSON.stringify(nextItems));
    setItems(nextItems);
  };

  const refresh = useCallback(async () => {
    if (!user) { loadGuestCart(); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, product:products(id, name, price, image_url, seller_id, is_active)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data || []).filter((i: any) => i.product) as any);
    setLoading(false);
  }, [user, loadGuestCart]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (productId: string, quantity = 1) => {
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
      return;
    }
    if (!user) {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, seller_id, is_active")
        .eq("id", productId)
        .eq("is_active", true)
        .single();
      if (error || !product) { toast.error("Product not found"); return; }
      saveGuestCart([...items, { id: `guest-${productId}`, product_id: productId, quantity, product } as CartItem]);
      toast.success("Added to cart");
      return;
    }
    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id, product_id: productId, quantity,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Added to cart");
    await refresh();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(itemId);
    if (!user) {
      saveGuestCart(items.map((item) => item.id === itemId ? { ...item, quantity } : item));
      return;
    }
    const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) {
      saveGuestCart(items.filter((item) => item.id !== itemId));
      return;
    }
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  const clearCart = async () => {
    if (!user) { saveGuestCart([]); return; }
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, refresh, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
