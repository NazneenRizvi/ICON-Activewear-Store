import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product, ProductColor, ProductSize, Order } from '../types';
import { normalizeOrders } from '../lib/orders';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';

import { PRODUCTS } from '../data/products';
import { STORE_OWNER_CONFIG, STORE_OWNER_EMAIL } from '../config';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, color: ProductColor, size: ProductSize, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotalUsd: number;
  promoCode: string;
  promoDiscountPercent: number;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  discountUsd: number;
  isFreeShipping: boolean;
  freeShippingThresholdUsd: number;
  amountNeededForFreeShippingUsd: number;
  shippingUsd: number;
  totalUsd: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (product: Product | null) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isAdminViewOpen: boolean;
  setIsAdminViewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

  // Products Catalog (with Admin CRUD)
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  
  // Store Owner & Order Management (For Nazneen)
  orders: Order[];
  ordersError: string;
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingCarrier?: string, trackingNumber?: string) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  isOwnerOrdersOpen: boolean;
  setIsOwnerOrdersOpen: (open: boolean) => void;
  isCustomerOrdersOpen: boolean;
  setIsCustomerOrdersOpen: (open: boolean) => void;
  ownerEmail: string;
  ownerWhatsApp: string;
  setOwnerWhatsApp: (phone: string) => void;
}

// Free Delivery on orders above 150 AED across UAE (150 AED / 3.67 = ~40.87 USD)
const FREE_SHIPPING_THRESHOLD_USD = 40.87;

const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage key helpers for user-scoped cart and wishlist
const getCartStorageKey = (uid?: string | null) => (uid ? `fj_cart_${uid}` : 'fj_cart');
const getWishlistStorageKey = (uid?: string | null) => (uid ? `fj_wishlist_${uid}` : 'fj_wishlist');

const readCartFromStorage = (key: string): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const readWishlistFromStorage = (key: string): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const mergeCartItems = (existing: CartItem[], incoming: CartItem[]): CartItem[] => {
  const merged = [...existing];
  for (const item of incoming) {
    const idx = merged.findIndex((m) => m.id === item.id);
    if (idx > -1) {
      merged[idx] = {
        ...merged[idx],
        quantity: merged[idx].quantity + item.quantity,
      };
    } else {
      merged.push(item);
    }
  }
  return merged;
};

const mergeWishlistItems = (existing: Product[], incoming: Product[]): Product[] => {
  const map = new Map<string, Product>();
  for (const p of existing) map.set(p.id, p);
  for (const p of incoming) map.set(p.id, p);
  return Array.from(map.values());
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authReady } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Track which user UID has been loaded into memory to prevent race conditions & wiping
  const activeCartUidRef = useRef<string | null | undefined>(undefined);
  const activeWishlistUidRef = useRef<string | null | undefined>(undefined);

  // 1. Synchronize / Load Cart and Wishlist when auth state is ready or user identity changes
  useEffect(() => {
    if (!authReady) return;
    const currentUid = user?.uid ?? null;

    // Load Cart:
    const cartKey = getCartStorageKey(currentUid);
    let loadedCart = readCartFromStorage(cartKey);

    // If a guest logged in, seamlessly merge their guest cart into their user account
    if (currentUid) {
      const guestCart = readCartFromStorage('fj_cart');
      if (guestCart.length > 0) {
        loadedCart = mergeCartItems(loadedCart, guestCart);
        try {
          localStorage.removeItem('fj_cart');
          localStorage.setItem(cartKey, JSON.stringify(loadedCart));
        } catch {
          // ignore storage error
        }
      }
    }
    setItems(loadedCart);
    activeCartUidRef.current = currentUid;

    // Load Wishlist:
    const wishlistKey = getWishlistStorageKey(currentUid);
    let loadedWishlist = readWishlistFromStorage(wishlistKey);

    // If a guest logged in, merge their guest wishlist
    if (currentUid) {
      const guestWishlist = readWishlistFromStorage('fj_wishlist');
      if (guestWishlist.length > 0) {
        loadedWishlist = mergeWishlistItems(loadedWishlist, guestWishlist);
        try {
          localStorage.removeItem('fj_wishlist');
          localStorage.setItem(wishlistKey, JSON.stringify(loadedWishlist));
        } catch {
          // ignore storage error
        }
      }
    }
    setWishlist(loadedWishlist);
    activeWishlistUidRef.current = currentUid;
  }, [authReady, user?.uid]);

  // 2. Persist Cart changes (ONLY when cart has been loaded for the CURRENT user UID)
  useEffect(() => {
    if (!authReady) return;
    const currentUid = user?.uid ?? null;
    // Guard against overwriting during login/logout before loaded
    if (activeCartUidRef.current !== currentUid) return;

    if (typeof window !== 'undefined') {
      const key = getCartStorageKey(currentUid);
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch {
        // ignore storage error
      }
    }
  }, [items, user?.uid, authReady]);

  // 3. Persist Wishlist changes (ONLY when wishlist has been loaded for the CURRENT user UID)
  useEffect(() => {
    if (!authReady) return;
    const currentUid = user?.uid ?? null;
    // Guard against overwriting during login/logout before loaded
    if (activeWishlistUidRef.current !== currentUid) return;

    if (typeof window !== 'undefined') {
      const key = getWishlistStorageKey(currentUid);
      try {
        localStorage.setItem(key, JSON.stringify(wishlist));
      } catch {
        // ignore storage error
      }
    }
  }, [wishlist, user?.uid, authReady]);

  // Dynamic Catalog with LocalStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fj_custom_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          return PRODUCTS;
        }
      }
    }
    return PRODUCTS;
  });

  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Store Owner Dashboard state
  const [isOwnerOrdersOpen, setIsOwnerOrdersOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const ownerEmail = STORE_OWNER_EMAIL;
  const [ownerWhatsApp, setOwnerWhatsAppState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fj_owner_whatsapp') || STORE_OWNER_CONFIG.whatsapp;
    }
    return STORE_OWNER_CONFIG.whatsapp;
  });

  const setOwnerWhatsApp = (phone: string) => {
    setOwnerWhatsAppState(phone);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_owner_whatsapp', phone);
    }
  };


  // Close transient modals & clear session-transient data on account switch / logout.
  // Cart & Wishlist states are seamlessly loaded and isolated by the auth sync effect above.
  const previousUserIdRef = useRef<string | null>(user?.uid ?? null);
  useEffect(() => {
    const nextUserId = user?.uid ?? null;
    // If user identity hasn't changed, do nothing.
    if (previousUserIdRef.current === nextUserId) return;
    previousUserIdRef.current = nextUserId;

    // Clear session-transient UI modals and promo codes
    setOrders([]);
    setPromoCode('');
    setPromoDiscountPercent(0);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsCustomerOrdersOpen(false);
    setIsOwnerOrdersOpen(false);
    setIsAdminViewOpen(false);
  }, [user?.uid]);
  
  // Local storage loader for orders
  const loadStoredOrders = (): Order[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('fj_orders');
      return saved ? normalizeOrders(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Sync orders to localStorage whenever orders change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fj_orders');
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const refreshOrders = async () => {
    if (!user) {
      // Signed out: there are no protected orders to load.
      setOrders([]);
      setOrdersError('');
      return;
    }
    setOrdersLoading(true);
    try {
      const data = await apiRequest('/api/orders');
      if (Array.isArray(data)) {
        setOrders(normalizeOrders(data));
        setOrdersError('');
      } else {
        setOrders([]);
      }
    } catch {
      // Backend unavailable; use local orders seamlessly
      setOrders([]);
      setOrdersError('Unable to load orders. Please retry.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    // Wait until Firebase has settled, then only load orders for a signed-in user.
    if (!authReady) return;
    if (!user) {
      setOrders([]);
      setOrdersError('');
      return;
    }
    let active = true;
    const fetchInit = async () => {
      try {
        const data = await apiRequest('/api/orders');
        if (active && Array.isArray(data)) {
          setOrders(normalizeOrders(data));
        }
      } catch {
        if (active) {
          setOrders([]);
        }
      }
    };
    void fetchInit();
    return () => {
      active = false;
    };
  }, [authReady, user?.uid]);


  // Save products to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_custom_products', JSON.stringify(products));
    }
  }, [products]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  const addProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const addOrder = async (order: Order): Promise<void> => {
    const normalized = normalizeOrders([order])[0] || order;

    // Send to backend and require successful database confirmation
    try {
      const response = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });

      if (response?.success !== true || !response?.order || response.order.id !== normalized.id) {
        throw new Error('Backend did not confirm a persisted order.');
      }
      // Backend returned verified order saved to permanent database
      const confirmedOrder = response?.order
        ? normalizeOrders([response.order])[0] || normalized
        : normalized;

      // Only update local state and localStorage AFTER verified backend confirmation
      setOrders((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
    } catch (error: any) {
      console.error('[CartContext] Order placement failed on database:', error);
      // Re-throw so CheckoutModal catches it, halts order completion, and preserves shopping cart
      throw new Error('Order could not be saved. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], trackingCarrier?: string, trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status, ...(trackingCarrier ? { trackingCarrier } : {}), ...(trackingNumber ? { trackingNumber } : {}) }
          : o
      )
    );

    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, trackingCarrier, trackingNumber }),
      });
    } catch {
      // safely fallback to local update
    }
  };

  const deleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
    } catch {
      // safely fallback
    }
  };

  const clearAllOrders = () => {
    setOrdersError('Delete individual orders to avoid accidental bulk deletion.');
  };

  const addToCart = (product: Product, color: ProductColor, size: ProductSize, quantity = 1) => {
    const itemId = `${product.id}-${color.name.toLowerCase().replace(/\s+/g, '-')}-${size}`;

    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === itemId);
      if (existing) {
        return prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prevItems,
        {
          id: itemId,
          product,
          selectedColor: color,
          selectedSize: size,
          quantity
        }
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // A coupon only applies after a server-side verification. All codes are OFF by default.
  const applyPromoCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Enter a coupon code.' };
    try {
      const result = await apiRequest(`/api/discounts/verify?code=${encodeURIComponent(cleanCode)}`);
      if (result?.valid === true && Number.isInteger(result.percent) && result.percent >= 1 && result.percent <= 40) {
        setPromoCode(cleanCode);
        setPromoDiscountPercent(result.percent);
        return { success: true, message: `${result.percent}% owner-approved discount applied.` };
      }
      setPromoCode(''); setPromoDiscountPercent(0);
      return { success: false, message: 'This code is not active.' };
    } catch {
      setPromoCode(''); setPromoDiscountPercent(0);
      return { success: false, message: 'Could not verify coupon. No discount applied.' };
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoDiscountPercent(0);
  };

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalUsd = items.reduce((acc, item) => acc + item.product.usdPrice * item.quantity, 0);
  const discountUsd = (subtotalUsd * promoDiscountPercent) / 100;
  const isFreeShipping = promoCode === 'FREESHIP' || subtotalUsd >= FREE_SHIPPING_THRESHOLD_USD || items.length === 0;
  const amountNeededForFreeShippingUsd = Math.max(0, FREE_SHIPPING_THRESHOLD_USD - subtotalUsd);
  const shippingUsd = isFreeShipping || items.length === 0 ? 0 : 5.99;
  const totalUsd = Math.max(0, subtotalUsd - discountUsd + shippingUsd);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotalUsd,
        promoCode,
        promoDiscountPercent,
        applyPromoCode,
        removePromoCode,
        discountUsd,
        isFreeShipping,
        freeShippingThresholdUsd: FREE_SHIPPING_THRESHOLD_USD,
        amountNeededForFreeShippingUsd,
        shippingUsd,
        totalUsd,
        isCartOpen,
        setIsCartOpen,
        selectedProductForDetail,
        setSelectedProductForDetail,
        quickViewProduct,
        setQuickViewProduct,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSearchOpen,
        setIsSearchOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isAdminViewOpen,
        setIsAdminViewOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        ordersError,
        ordersLoading,
        refreshOrders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        clearAllOrders,
        isOwnerOrdersOpen,
        setIsOwnerOrdersOpen,
        isCustomerOrdersOpen,
        setIsCustomerOrdersOpen,
        ownerEmail,
        ownerWhatsApp,
        setOwnerWhatsApp
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

