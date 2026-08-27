import { productsApi } from "./api/productsApi";

function generateShort(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "PR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function normalizeStockCategory(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (["sale", "venda", "para venda", "para_venda", "vendido"].includes(v)) return "sale";
  return "internal";
}

function normalizeProduct(product) {
  const name = product.name || product.nome || "";
  const sale = Number(product.sale ?? product.preco_venda ?? 0);

  return {
    id: product.id,
    name,
    stockCategory: normalizeStockCategory(product.stockCategory || product.stock_category),
    type: product.type || product.tipo || "Material",
    category: product.category || product.categoria || product.categoria_nome || "Sem categoria",
    categoryId: product.categoryId ?? product.categoria_id ?? null,
    unit: product.unit || product.unidade || "un",
    brand: product.brand || product.marca || "",
    model: product.model || product.modelo || "",
    stock: Number(product.stock ?? product.estoque ?? 0),
    minimum: Number(product.minimum ?? product.estoque_minimo ?? 0),
    cost: Number(product.cost ?? product.preco_custo ?? 0),
    sale,
    active: product.active ?? product.ativo !== false,
    short: product.short || generateShort(name),
  };
}

function payload(data) {
  return {
    nome: String(data.name || "").trim(),
    stockCategory: data.stockCategory || "internal",
    stock_category: data.stockCategory || "internal",
    tipo: data.type || "Material",
    unidade: data.unit || "un",
    marca: data.brand || null,
    modelo: data.model || null,
    estoque: Number(data.stock ?? 0),
    estoque_minimo: Number(data.minimum ?? 0),
    preco_custo: Number(data.cost ?? 0),
    preco_venda: data.stockCategory === "sale" ? Number(data.sale ?? 0) : 0,
    categoria_id: data.categoryId || null,
    categoria_nome: data.category || null,
    ativo: data.active !== false,
  };
}

export const productsService = {
  async list() {
    const data = await productsApi.list();
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  },

  async get(id) {
    const data = await productsApi.get(id);
    return data ? normalizeProduct(data) : null;
  },

  async create(data) {
    const result = await productsApi.create(payload(data));
    return normalizeProduct(result?.produto || result);
  },

  async update(id, data) {
    const result = await productsApi.update(id, payload(data));
    return normalizeProduct(result?.produto || result);
  },

  async remove(id) {
    return productsApi.remove(id);
  },
};
