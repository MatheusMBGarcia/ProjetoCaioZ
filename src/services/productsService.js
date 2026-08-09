import { productsApi } from "./api/productsApi";

function generateShort(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "PR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function normalizeProduct(product) {
  const name = product.name || product.nome || "";

  return {
    id: product.id,
    sku: product.sku || "",
    name,
    type: product.type || product.tipo || "Material",
    category: product.category || product.categoria || "Sem categoria",
    categoryId: product.categoryId ?? product.categoria_id ?? null,
    unit: product.unit || product.unidade || "un",
    brand: product.brand || product.marca || "",
    model: product.model || product.modelo || "",
    stock: Number(product.stock ?? product.estoque ?? 0),
    minimum: Number(product.minimum ?? product.estoque_minimo ?? 0),
    cost: Number(product.cost ?? product.preco_custo ?? 0),
    sale: Number(product.sale ?? product.preco_venda ?? 0),
    location: product.location || product.localizacao || "",
    supplier: product.supplier || product.fornecedor || "",
    supplierId: product.supplierId ?? product.fornecedor_id ?? null,
    active: product.active ?? product.ativo !== false,
    short: product.short || generateShort(name),
  };
}

function payload(data) {
  return {
    sku: data.sku || null,
    nome: String(data.name || "").trim(),
    tipo: data.type || "Material",
    unidade: data.unit || "un",
    marca: data.brand || null,
    modelo: data.model || null,
    estoque: Number(data.stock ?? 0),
    estoque_minimo: Number(data.minimum ?? 0),
    preco_custo: Number(data.cost ?? 0),
    preco_venda: Number(data.sale ?? 0),
    localizacao: data.location || null,
    categoria_id: data.categoryId || null,
    categoria_nome: data.category || null,
    fornecedor_id: data.supplierId || null,
    fornecedor_nome: data.supplier || null,
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
