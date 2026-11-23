// src/app.ts
import "dotenv/config";
import cors from "cors";
import express from "express";

// src/middleware/auth.ts
import {
  initializeApp,
  getApps,
  applicationDefault,
  cert
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
var projectId = process.env.FIREBASE_PROJECT_ID || "icone-active-wear-2";
var serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
var adminAuth = null;
function getAdminAuth() {
  if (adminAuth) return adminAuth;
  const app2 = getApps()[0] || initializeApp({
    credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault(),
    projectId
  });
  adminAuth = getAuth(app2);
  return adminAuth;
}
async function verifyFirebaseToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authentication token");
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new Error("Empty authentication token");
  }
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token, true);
  req.user = {
    uid: decoded.uid,
    email: decoded.email?.toLowerCase().trim(),
    name: decoded.name,
    emailVerified: decoded.email_verified === true,
    picture: decoded.picture
  };
}
var requireAuth = async (req, res, next) => {
  try {
    await verifyFirebaseToken(req);
    next();
  } catch (error) {
    console.warn("[Auth] Authentication failed");
    return res.status(401).json({
      error: "Unauthorized: Please sign in again."
    });
  }
};

// src/config.ts
var getEnvVar = (key, fallback) => {
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  return fallback;
};
var configuredEmail = getEnvVar("VITE_STORE_OWNER_EMAIL", getEnvVar("STORE_OWNER_EMAIL", "nazneenrizvi1711@gmail.com"));
var configuredName = getEnvVar("VITE_STORE_OWNER_NAME", "Nazneen (Store Owner)");
var configuredPhone = getEnvVar("VITE_STORE_OWNER_PHONE", "+971 50 123 4567");
var STORE_OWNER_CONFIG = {
  email: configuredEmail,
  name: configuredName,
  whatsapp: configuredPhone.replace(/\s+/g, ""),
  whatsappDisplay: configuredPhone,
  supportEmail: configuredEmail,
  location: "Dubai, United Arab Emirates",
  defaultCurrency: "AED",
  freeShippingThresholdAed: 150
};
var STORE_OWNER_EMAIL = STORE_OWNER_CONFIG.email;
var demoPaymentEnv = getEnvVar("VITE_DEMO_PAYMENT_MODE", "true");

// src/data/products.ts
var PRODUCTS = [
  {
    id: "prod-balance-seamless",
    name: "BALANCE SEAMLESS LEGGINGS",
    slug: "balance-seamless-leggings",
    category: "seamless-leggings",
    categoryLabel: "SHOP SEAMLESS",
    usdPrice: 28.99,
    pkrPrice: 8046.4,
    originalPriceUsd: 36,
    originalPricePkr: 1e4,
    image: "/images/product_seamless_leggings_1790852268334.jpg",
    hoverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    colors: [
      { name: "Olive Heather", hex: "#636b57" },
      { name: "Charcoal Grey", hex: "#3e3e40" },
      { name: "Navy Dusk", hex: "#283149" },
      { name: "Warm Taupe", hex: "#877c73" },
      { name: "Blush Rose", hex: "#cf9893" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Designed for effortless movement, our Balance Seamless Leggings feature a ribbed high-rise waistband that never rolls down. Engineered with 4-way stretch circular knit microfiber for complete squat-proof confidence.",
    details: [
      "High-waisted compression contour waistband",
      "100% squat-proof non-sheer knit",
      "Sweat-wicking, fast-drying seamless yarn",
      "Subtle glute-enhancing ribbed texture"
    ],
    fabric: "88% Polyamide, 12% Elastane",
    supportLevel: "Medium Support",
    rating: 4.9,
    reviewsCount: 342,
    isNew: true,
    isBestSeller: true,
    inStock: true
  },
  {
    id: "prod-elite-seamless",
    name: "ELITE SEAMLESS LEGGINGS",
    slug: "elite-seamless-leggings",
    category: "seamless-leggings",
    categoryLabel: "SHOP SEAMLESS",
    usdPrice: 32.99,
    pkrPrice: 9073.6,
    originalPriceUsd: 40,
    originalPricePkr: 11e3,
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
    hoverImage: "/images/product_seamless_leggings_1790852268334.jpg",
    colors: [
      { name: "Obsidian Black", hex: "#111111" },
      { name: "Forest Moss", hex: "#2f3e30" },
      { name: "Cloud Grey", hex: "#9ea3a8" },
      { name: "Deep Plum", hex: "#482d3f" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "The Elite Seamless Leggings deliver ultra-supportive zoning along the thighs and lower back. Formulated with second-skin compressive yarn that breathes during intense cardio and heavy lift sessions.",
    details: [
      "Zoned compressive panelling",
      "Zero front seam for zero chafing",
      "Deep ribbed anti-slip waistband",
      "Reinforced gusset for mobility"
    ],
    fabric: "85% Nylon Microfiber, 15% Spandex",
    supportLevel: "Maximum Compression",
    rating: 4.8,
    reviewsCount: 218,
    isBestSeller: true,
    inStock: true
  },
  {
    id: "prod-core-seamless",
    name: "CORE SEAMLESS LEGGINGS",
    slug: "core-seamless-leggings",
    category: "seamless-leggings",
    categoryLabel: "SHOP SEAMLESS",
    usdPrice: 30.99,
    pkrPrice: 8560,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    hoverImage: "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=800&q=80",
    colors: [
      { name: "Camo Heather", hex: "#4f5548" },
      { name: "Charcoal Grey", hex: "#2a2a2a" },
      { name: "Ocean Mist", hex: "#4d6978" },
      { name: "Sage Green", hex: "#778a76" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Our iconic jacquard camo knit seamless leggings blend subtle textured shading with full athletic flex. Soft to the touch yet sturdy enough for HIIT, Pilates, and weekend conditioning.",
    details: [
      "Jacquard camo seamless weave",
      "Breathable heat-release eyelets",
      "Contoured glute micro-ribbing",
      "Ankle crop length fit"
    ],
    fabric: "90% Polyamide, 10% Elastane",
    supportLevel: "Medium Support",
    rating: 4.9,
    reviewsCount: 189,
    inStock: true
  },
  {
    id: "prod-impact-seamless",
    name: "IMPACT SEAMLESS LEGGINGS",
    slug: "impact-seamless-leggings",
    category: "seamless-leggings",
    categoryLabel: "SHOP SEAMLESS",
    usdPrice: 27.99,
    pkrPrice: 7875.2,
    originalPriceUsd: 34,
    originalPricePkr: 9500,
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    hoverImage: "/images/product_seamless_leggings_1790852268334.jpg",
    colors: [
      { name: "Midnight Navy", hex: "#1c2833" },
      { name: "Jet Black", hex: "#0a0a0a" },
      { name: "Espresso", hex: "#3d2b24" },
      { name: "Dusty Berry", hex: "#6d4350" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Maximum agility without compromise. The Impact Leggings offer high-density compression knit that holds shape session after session without sagging or pilling.",
    details: [
      "Engineered squat-proof double knit",
      "Targeted calf cooling ventilation",
      "No-slip stay-put waistband",
      "Flatlock ergonomic construction"
    ],
    fabric: "86% Nylon, 14% Elastane",
    supportLevel: "High Support",
    rating: 4.7,
    reviewsCount: 164,
    inStock: true
  },
  {
    id: "prod-bold-sports-bra",
    name: "BOLD SPORTS BRA",
    slug: "bold-sports-bra",
    category: "sports-bras",
    categoryLabel: "SHOP LOW IMPACT",
    usdPrice: 24,
    pkrPrice: 6676.8,
    originalPriceUsd: 30,
    originalPricePkr: 8300,
    image: "/images/product_sports_bra_1790852283602.jpg",
    hoverImage: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80",
    colors: [
      { name: "Crisp White", hex: "#fcfcfc" },
      { name: "Terracotta", hex: "#b35d45" },
      { name: "Sage Green", hex: "#82917d" },
      { name: "Onyx Black", hex: "#181818" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Minimalist aesthetic meets low-to-medium athletic support. The Bold Sports Bra features an open cross-back strap geometry that frees your shoulder blades while giving reliable hold.",
    details: [
      "Removable molded cup padding",
      "Criss-cross back straps for free scapular movement",
      "Wide bottom band that stays flush without digging",
      "Anti-odor antimicrobial treatment"
    ],
    fabric: "82% Polyamide, 18% Elastane",
    supportLevel: "Low Support",
    rating: 4.9,
    reviewsCount: 295,
    isBestSeller: true,
    inStock: true
  },
  {
    id: "prod-excel-sports-bra",
    name: "EXCEL SPORTS BRA",
    slug: "excel-sports-bra",
    category: "sports-bras",
    categoryLabel: "SHOP LOW IMPACT",
    usdPrice: 21.5,
    pkrPrice: 5992,
    originalPriceUsd: 28,
    originalPricePkr: 7700,
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80",
    hoverImage: "/images/product_sports_bra_1790852283602.jpg",
    colors: [
      { name: "Heather Grey", hex: "#777b80" },
      { name: "Dusty Rose", hex: "#bf8e93" },
      { name: "Mocha Tan", hex: "#7a6458" },
      { name: "Muted Olive", hex: "#586150" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Ultra-lightweight everyday movement bra. Crafted with butter-soft micro-modal blend that feels invisible under clothes or styled on its own for hot yoga and gym sessions.",
    details: [
      "Butter-soft second-skin touch",
      "Plunge scoop neckline",
      "Non-restrictive flexible underband",
      "Quick-drying sweat management"
    ],
    fabric: "80% Microfiber Nylon, 20% Spandex",
    supportLevel: "Low Support",
    rating: 4.8,
    reviewsCount: 178,
    inStock: true
  },
  {
    id: "prod-bold-marble-bra",
    name: "BOLD SPORTS BRA (MARBLE)",
    slug: "bold-sports-bra-marble",
    category: "sports-bras",
    categoryLabel: "SHOP LOW IMPACT",
    usdPrice: 24,
    pkrPrice: 6676.8,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    hoverImage: "/images/product_sports_bra_1790852283602.jpg",
    colors: [
      { name: "Granite Marble", hex: "#949599" },
      { name: "Chalk White", hex: "#f2f2f0" },
      { name: "Smoke Black", hex: "#262626" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Limited edition sublimated marble print. Seamless jacquard knitting prevents print distortion when stretched, preserving crisp contrast through heavy squats and bends.",
    details: [
      "Sublimated zero-fade active print",
      "Reinforced double-layered chest panel",
      "Smooth laser-cut armholes",
      "Four-way stretch retention"
    ],
    fabric: "84% Polyester, 16% Spandex",
    supportLevel: "Low Support",
    rating: 4.7,
    reviewsCount: 142,
    inStock: true
  },
  {
    id: "prod-ultra-sports-bra",
    name: "ULTRA SPORTS BRA",
    slug: "ultra-sports-bra",
    category: "sports-bras",
    categoryLabel: "SHOP LOW IMPACT",
    usdPrice: 24,
    pkrPrice: 6676.8,
    originalPriceUsd: 32,
    originalPricePkr: 8900,
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
    hoverImage: "/images/product_sports_bra_1790852283602.jpg",
    colors: [
      { name: "Pure White", hex: "#ffffff" },
      { name: "Sunset Coral", hex: "#de6857" },
      { name: "Seafoam Mint", hex: "#7aa39c" },
      { name: "Deep Steel", hex: "#374151" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Engineered for all-day athletic versatility. Provides locked-in security with breathable mesh ventilation channels down the spine for instant thermal cooling.",
    details: [
      "Racerback silhouette with breathable mesh channel",
      "Non-slip wide band",
      "Removable padding with internal stabilizer",
      "Chafe-resistant smooth seams"
    ],
    fabric: "85% Nylon, 15% Elastane",
    supportLevel: "Medium Support",
    rating: 4.9,
    reviewsCount: 211,
    isNew: true,
    inStock: true
  },
  {
    id: "prod-airlift-shorts",
    name: "AIRLIFT CYCLING SHORTS",
    slug: "airlift-cycling-shorts",
    category: "bottoms",
    categoryLabel: "SHOP BOTTOMS",
    usdPrice: 19.99,
    pkrPrice: 5490,
    originalPriceUsd: 26,
    originalPricePkr: 7200,
    image: "/images/promo_split_bottoms_1790852297885.jpg",
    hoverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    colors: [
      { name: "Sky Cerulean", hex: "#77a2c7" },
      { name: "Charcoal Heather", hex: "#404347" },
      { name: "Lavender Mist", hex: "#9d94b8" },
      { name: "Jet Black", hex: "#111111" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "6-inch inseam cycling shorts that hug without pinching. The tapered leg hem features silicone micro-grippers to ensure zero ride-up during sprints and lunges.",
    details: [
      "6-inch inseam ideal for studio & running",
      "Anti-slip micro-dot silicone leg hem",
      "Hidden interior waistband card pocket",
      "Sweat-wicking cooling finish"
    ],
    fabric: "82% Polyamide, 18% Elastane",
    supportLevel: "Medium Support",
    rating: 4.8,
    reviewsCount: 167,
    isBestSeller: true,
    inStock: true
  },
  {
    id: "prod-sculpt-tank",
    name: "SCULPT TRAINING TANK",
    slug: "sculpt-training-tank",
    category: "must-haves",
    categoryLabel: "SHOP MUST HAVES",
    usdPrice: 17.5,
    pkrPrice: 4890,
    image: "/images/hero_pink_activewear_1790852235638.jpg",
    hoverImage: "/images/campaign_dark_fitness_1790852253184.jpg",
    colors: [
      { name: "Blush Coral", hex: "#e89e99" },
      { name: "Chalk White", hex: "#f7f6f2" },
      { name: "Dark Slate", hex: "#212529" },
      { name: "Washed Olive", hex: "#6b705c" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "The iconic ribbed cropped tank featured in our campaign. High-stretch performance rib knit that retains shape after 100+ wash cycles, pairing seamlessly with any leggings.",
    details: [
      "Cropped silhouette hitting right at natural waist",
      "High round neckline with racer cut armholes",
      "Breathable micro-rib knit texture",
      "Reinforced colorfast yarns"
    ],
    fabric: "92% Nylon, 8% Spandex",
    supportLevel: "Low Support",
    rating: 4.9,
    reviewsCount: 310,
    isBestSeller: true,
    inStock: true
  }
];

// src/db/discounts.ts
import { getApps as getApps2, initializeApp as initializeApp2, applicationDefault as applicationDefault2, cert as cert2 } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
var DEFAULT_DISCOUNT = { code: "", percent: 0, enabled: false };
function reference() {
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const app2 = getApps2()[0] || initializeApp2({ credential: account ? cert2(JSON.parse(account)) : applicationDefault2(), projectId: process.env.FIREBASE_PROJECT_ID || "icone-active-wear-2" });
  return getFirestore(app2).collection("store_settings").doc("discount");
}
async function getDiscountSettings() {
  const document = await reference().get();
  const data = document.data();
  if (!data || !/^[A-Z0-9_-]{4,24}$/.test(data.code) || !Number.isInteger(data.percent) || data.percent < 1 || data.percent > 40) return DEFAULT_DISCOUNT;
  return { code: data.code, percent: data.percent, enabled: data.enabled === true };
}
async function saveDiscountSettings(value) {
  await reference().set(value);
  return value;
}

// src/db/orders.ts
import { initializeApp as initializeApp3, getApps as getApps3, applicationDefault as applicationDefault3, cert as cert3 } from "firebase-admin/app";
import { getFirestore as getFirestore2 } from "firebase-admin/firestore";

// src/lib/orders.ts
var finiteNumber = (value) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
var text = (value) => typeof value === "string" ? value : "";
function normalizeOrders(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((row) => row && typeof row === "object" && row.id != null).map((row) => ({
    ...row,
    id: String(row.id),
    customerName: text(row.customerName ?? row.customer_name).trim(),
    email: text(row.email).trim().toLowerCase(),
    phone: text(row.phone).trim(),
    city: text(row.city).trim(),
    address: text(row.address).trim(),
    postalCode: text(row.postalCode ?? row.postal_code).trim(),
    country: text(row.country),
    currency: text(row.currency) || "USD",
    status: text(row.status) || "confirmed",
    notes: text(row.notes),
    createdAt: text(row.createdAt ?? row.created_at),
    total: finiteNumber(row.total),
    subtotal: finiteNumber(row.subtotal),
    shipping: finiteNumber(row.shipping),
    discount: finiteNumber(row.discount),
    items: (Array.isArray(row.items) ? row.items : []).filter((item) => item && typeof item === "object").map((item) => ({
      ...item,
      productId: text(item.productId ?? item.product_id),
      name: text(item.name),
      color: text(item.color),
      size: text(item.size),
      image: text(item.image),
      price: finiteNumber(item.price),
      quantity: finiteNumber(item.quantity)
    }))
  }));
}

// src/db/orders.ts
var serviceAccount2 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
var projectId2 = process.env.FIREBASE_PROJECT_ID || "icone-active-wear-2";
var adminApp = getApps3()[0] || initializeApp3({
  credential: serviceAccount2 ? cert3(JSON.parse(serviceAccount2)) : applicationDefault3(),
  projectId: projectId2
});
var firestoreDb = getFirestore2(adminApp);
async function getOrdersByUid(uid) {
  const snapshot = await firestoreDb.collection("orders").where("uid", "==", uid).get();
  const records = snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id
  }));
  records.sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
  return normalizeOrders(records);
}
async function getAllOrders(email) {
  const snapshot = await firestoreDb.collection("orders").get();
  const records = snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id
  }));
  const filtered = email ? records.filter(
    (o) => String(o.email || "").toLowerCase().trim() === email.toLowerCase().trim()
  ) : records;
  filtered.sort(
    (a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
  );
  return normalizeOrders(filtered);
}
async function insertOrder(data) {
  const cleanOrder = {
    id: data.id,
    uid: data.uid,
    customerName: data.customerName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    postalCode: (data.postalCode || "").trim(),
    country: (data.country || "United Arab Emirates").trim(),
    currency: data.currency || "AED",
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    shipping: Number(data.shipping) || 0,
    total: Number(data.total) || 0,
    status: data.status || "confirmed",
    paymentMethod: data.paymentMethod || "credit_card",
    shippingMethod: data.shippingMethod || "standard",
    trackingCarrier: data.trackingCarrier || "",
    trackingNumber: data.trackingNumber || "",
    notes: data.notes || "",
    createdAt: data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    items: (data.items || []).map((item) => ({
      productId: item.productId,
      name: item.name,
      color: item.color,
      size: item.size,
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
      price: Number(item.price) || 0,
      image: item.image || ""
    }))
  };
  const orderDocRef = firestoreDb.collection("orders").doc(cleanOrder.id);
  try {
    await orderDocRef.create(cleanOrder);
    return normalizeOrders([cleanOrder])[0];
  } catch (error) {
    if (error?.code === 6 || error?.code === "already-exists") {
      const existing = await orderDocRef.get();
      if (!existing.exists || String(existing.data()?.email || "").toLowerCase() !== cleanOrder.email) {
        throw new Error("Order ID conflict. Please contact support.");
      }
      return normalizeOrders([
        { ...existing.data(), id: existing.id }
      ])[0];
    }
    console.error(
      "[Firestore order write failed]",
      error?.code || error?.message
    );
    throw new Error(
      "Database unavailable. Order could not be permanently saved."
    );
  }
}
async function updateOrderState(orderId, status, trackingCarrier, trackingNumber) {
  const ref = firestoreDb.collection("orders").doc(orderId);
  const updatePayload = {
    status,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (trackingCarrier !== void 0) {
    updatePayload.trackingCarrier = trackingCarrier;
  }
  if (trackingNumber !== void 0) {
    updatePayload.trackingNumber = trackingNumber;
  }
  await ref.update(updatePayload);
  const doc = await ref.get();
  return doc.exists ? normalizeOrders([{ ...doc.data(), id: doc.id }])[0] : null;
}
async function deleteOrderById(orderId) {
  await firestoreDb.collection("orders").doc(orderId).delete();
  return { success: true };
}
async function getLiveDashboardStats() {
  const allOrders = await getAllOrders();
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => {
    const val = typeof o.total === "number" ? o.total : Number(o.total) || 0;
    if (o.currency === "AED") return sum + val;
    if (o.currency === "USD") return sum + Math.round(val * 3.67);
    if (o.currency === "PKR") return sum + Math.round(val / 75.5);
    return sum + val;
  }, 0);
  const uniqueEmails = new Set(
    allOrders.map((o) => (o.email || "").toLowerCase().trim()).filter(Boolean)
  );
  const totalCustomers = uniqueEmails.size;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const productSalesMap = /* @__PURE__ */ new Map();
  for (const order of allOrders) {
    for (const item of order.items) {
      const existing = productSalesMap.get(item.productId) || {
        name: item.name,
        quantity: 0,
        revenue: 0
      };
      existing.quantity += item.quantity;
      const itemRev = order.currency === "AED" ? item.price * item.quantity : order.currency === "USD" ? Math.round(item.price * item.quantity * 3.67) : Math.round(item.price * item.quantity / 75.5);
      existing.revenue += itemRev;
      productSalesMap.set(item.productId, existing);
    }
  }
  const topSellers = Array.from(productSalesMap.entries()).map(([id, stats]) => ({
    id,
    name: stats.name,
    quantity: stats.quantity,
    revenue: stats.revenue
  })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const dateMap = /* @__PURE__ */ new Map();
  for (const order of allOrders) {
    const dateKey = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    }) : "Recent";
    const existing = dateMap.get(dateKey) || {
      revenue: 0,
      orders: 0
    };
    const orderVal = order.currency === "AED" ? order.total : order.currency === "USD" ? Math.round(order.total * 3.67) : Math.round(order.total / 75.5);
    existing.revenue += orderVal;
    existing.orders += 1;
    dateMap.set(dateKey, existing);
  }
  const revenueTrend = Array.from(dateMap.entries()).map(
    ([day, val]) => ({
      day,
      revenue: val.revenue,
      orders: val.orders
    })
  );
  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    avgOrderValue,
    revenueTrend,
    topSellers,
    latestOrders: allOrders.slice(0, 5)
  };
}

// src/app.ts
var app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "256kb" }));
app.use((req, _res, next) => {
  const original = req.originalUrl || req.headers["x-matched-path"];
  if (typeof original === "string" && original.startsWith("/api") && req.url !== original) {
    req.url = original;
  }
  next();
});
var isOwner = (req) => {
  if (!req.user || !req.user.email) return false;
  const isVerified = req.user.emailVerified === true;
  const isOwnerEmail = req.user.email.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();
  const ownerUid = process.env.STORE_OWNER_UID?.trim();
  if (ownerUid && req.user.uid !== ownerUid) return false;
  return isVerified && isOwnerEmail;
};
var requireOwner = (req, res, next) => {
  if (!isOwner(req)) return res.status(403).json({ error: "Store owner access required. Please sign in with verified owner credentials." });
  next();
};
var databaseError = (res, error) => {
  let cause = error;
  for (let depth = 0; depth < 5 && cause?.cause && !cause?.code; depth++) cause = cause.cause;
  const code = typeof cause?.code === "string" ? cause.code : "DATABASE_UNAVAILABLE";
  console.error("[Database query]", { code, message: cause?.message });
  const message = "Database temporarily unavailable. Please try again later.";
  return res.status(500).json({ error: message, code });
};
app.get(["/api/healthz", "/api/livez", "/api/readyz", "/api/startup", "/api/liveness"], (_req, res) => {
  res.status(200).send("OK");
});
app.get("/api/discounts/verify", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code.trim().toUpperCase() : "";
    const config = await getDiscountSettings();
    if (!config.enabled || !code || code !== config.code) return res.json({ valid: false, percent: 0 });
    return res.json({ valid: true, code: config.code, percent: config.percent });
  } catch (e) {
    return databaseError(res, e);
  }
});
app.get("/api/admin/discount", requireAuth, requireOwner, async (_req, res) => {
  try {
    return res.json(await getDiscountSettings());
  } catch (e) {
    return databaseError(res, e);
  }
});
app.put("/api/admin/discount", requireAuth, requireOwner, async (req, res) => {
  try {
    const { code, percent, enabled } = req.body || {};
    if (typeof code !== "string" || !/^[A-Z0-9_-]{4,24}$/.test(code.trim().toUpperCase()) || !Number.isInteger(percent) || percent < 1 || percent > 40 || typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Enter a 4\u201324 character coupon, percentage 1\u201340, and enabled state." });
    }
    return res.json(await saveDiscountSettings({ code: code.trim().toUpperCase(), percent, enabled }));
  } catch (e) {
    return databaseError(res, e);
  }
});
app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    if (isOwner(req)) {
      const emailFilter = req.query.email || void 0;
      const ordersList = await getAllOrders(emailFilter);
      return res.json(Array.isArray(ordersList) ? ordersList : []);
    }
    if (req.user?.uid) {
      const uidOrders = await getOrdersByUid(req.user.uid);
      const emailOrders = await getAllOrders(req.user.email);
      const merged = [...uidOrders];
      const seen = new Set(uidOrders.map((o) => o.id));
      for (const o of emailOrders) {
        if (!seen.has(o.id)) merged.push(o);
      }
      return res.json(merged);
    }
    if (req.user?.email) {
      const ordersList = await getAllOrders(req.user.email);
      return res.json(Array.isArray(ordersList) ? ordersList : []);
    }
    return res.status(403).json({ error: "A verified account identifier is required to view orders." });
  } catch (error) {
    console.warn("Failed to retrieve orders from database:", error);
    return databaseError(res, error);
  }
});
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const orderData = req.body;
    const authUser = req.user;
    if (!authUser?.uid || !authUser?.email) {
      return res.status(400).json({ error: "Authenticated user information missing." });
    }
    orderData.uid = authUser.uid;
    orderData.email = authUser.email.trim().toLowerCase();
    if (!orderData || !["id", "customerName", "email", "phone", "address", "city"].every((key) => typeof orderData[key] === "string" && orderData[key].trim()) || !Array.isArray(orderData.items) || !orderData.items.length || orderData.items.some((item) => !item || typeof item.productId !== "string" || typeof item.name !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0) || !["subtotal", "discount", "shipping", "total"].every((key) => Number.isFinite(orderData[key]) && orderData[key] >= 0) || !["AED", "USD", "PKR", "EUR", "GBP", "SAR"].includes(orderData.currency)) {
      return res.status(400).json({ error: "Invalid order details." });
    }
    if (!["card", "credit_card", "apple_pay"].includes(orderData.paymentMethod)) {
      return res.status(400).json({ error: "Unsupported payment method. Online card checkout only." });
    }
    orderData.paymentMethod = "credit_card";
    orderData.notes = "[DEMO TRANSACTION] Test card checkout only - no payment processed";
    const exchangeRates = {
      AED: 3.67,
      USD: 1,
      PKR: 277.55,
      EUR: 0.92,
      GBP: 0.78,
      SAR: 3.75
    };
    const currencyRate = exchangeRates[orderData.currency];
    if (!currencyRate) return res.status(400).json({ error: "Unsupported currency." });
    const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
    let verifiedSubtotal = 0;
    for (const item of orderData.items) {
      const catalogItem = PRODUCTS.find((p) => p.id === item.productId);
      if (!catalogItem || catalogItem.inStock === false) {
        return res.status(400).json({ error: "One or more products are unavailable or invalid." });
      }
      if (!catalogItem.sizes.includes(item.size) || !catalogItem.colors.some((color) => color.name === item.color)) {
        return res.status(400).json({ error: "Invalid product size or color." });
      }
      const unitPrice = orderData.currency === "PKR" ? catalogItem.pkrPrice : catalogItem.usdPrice * currencyRate;
      item.price = money(unitPrice);
      item.name = catalogItem.name;
      verifiedSubtotal = money(verifiedSubtotal + money(unitPrice * item.quantity));
    }
    orderData.subtotal = verifiedSubtotal;
    const discountSettings = await getDiscountSettings();
    const requestedCode = typeof orderData.promoCode === "string" ? orderData.promoCode.trim().toUpperCase() : "";
    if (requestedCode && (!discountSettings.enabled || discountSettings.code !== requestedCode)) {
      return res.status(400).json({ error: "Coupon is inactive or invalid." });
    }
    orderData.discount = discountSettings.enabled && requestedCode === discountSettings.code ? money(verifiedSubtotal * discountSettings.percent / 100) : 0;
    const isFreeShipping = orderData.subtotal >= money(150 * currencyRate / 3.67);
    const shippingMethod = orderData.shippingMethod === "express" ? "express" : "standard";
    if (shippingMethod === "express" && orderData.city !== "Dubai") {
      return res.status(400).json({ error: "Express delivery is only available in Dubai." });
    }
    orderData.shippingMethod = shippingMethod;
    orderData.shipping = isFreeShipping ? 0 : shippingMethod === "express" ? money(25 * currencyRate / 3.67) : orderData.currency === "PKR" ? 250 : money(5.99 * currencyRate);
    orderData.total = money(Math.max(0, orderData.subtotal - orderData.discount + orderData.shipping));
    orderData.email = orderData.email.trim().toLowerCase();
    orderData.status = "confirmed";
    const newOrder = await insertOrder(orderData);
    console.log("[TEST ORDER SAVED]", { orderId: orderData.id, paymentStatus: "unpaid" });
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Failed to create order in database:", error);
    databaseError(res, error);
  }
});
app.patch("/api/orders/:id/status", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingCarrier, trackingNumber } = req.body;
    if (!["confirmed", "processing", "shipped", "delivered", "cancelled"].includes(status)) return res.status(400).json({ error: "Invalid status." });
    const updated = await updateOrderState(String(id), status, trackingCarrier, trackingNumber);
    if (!updated) return res.status(404).json({ error: "Order not found." });
    res.json({ success: true, order: updated });
  } catch (error) {
    databaseError(res, error);
  }
});
app.delete("/api/orders/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteOrderById(String(id));
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    databaseError(res, error);
  }
});
app.get("/api/dashboard/stats", requireAuth, requireOwner, async (req, res) => {
  try {
    const stats = await getLiveDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Failed to calculate live stats, returning zero-state fallback:", error);
    databaseError(res, error);
  }
});
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});
var app_default = app;
export {
  app_default as default
};
