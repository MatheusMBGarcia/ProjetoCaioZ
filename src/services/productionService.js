import { productionApi } from "./api/productionApi";
import { authService } from "./authService";

const normalizeStockCategory = (value) => {
  const v = String(value ?? "").trim().toLowerCase();
  if (["sale", "venda", "para venda", "para_venda", "vendido"].includes(v)) return "sale";
  return "internal";
};

const normalizeRecipe = (r) => ({
  id: r.id,
  productId: Number(r.productId),
  productName: r.productName || "",
  unit: r.unit || "un",
  stock: Number(r.stock || 0),
  stockCategory: normalizeStockCategory(r.stockCategory),
  active: r.active !== 0,
  items: Array.isArray(r.items) ? r.items.map(i => ({
    id: i.id,
    materialId: Number(i.materialId),
    materialName: i.materialName || "",
    unit: i.unit || "un",
    stock: Number(i.stock || 0),
    stockCategory: normalizeStockCategory(i.stockCategory),
    quantity: Number(i.quantity || 0),
    consumptionUnit: i.consumptionUnit || i.unit || "un",
    displayQuantity: Number(i.displayQuantity ?? i.quantity ?? 0),
  })) : [],
});

export const productionService = {
  async listRecipes() {
    const data = await productionApi.listRecipes();
    return Array.isArray(data) ? data.map(normalizeRecipe) : [];
  },
  async createRecipe(data) {
    const result = await productionApi.createRecipe({
      productId: Number(data.productId),
      items: data.items.map(i => ({ materialId: Number(i.materialId), quantity: Number(i.quantity), consumptionUnit: i.consumptionUnit || i.unit || "un", unit: i.consumptionUnit || i.unit || "un" })),
    });
    return normalizeRecipe(result);
  },
  async removeRecipe(productId) {
    return productionApi.removeRecipe(productId);
  },
  async listHistory() {
    const data = await productionApi.listHistory();
    return Array.isArray(data) ? data.map(p => ({
      ...p,
      productId: Number(p.productId),
      quantity: Number(p.quantity || 0),
      stockCategory: String(p.stockCategory || "").toLowerCase() === "venda" ? "sale" : "internal",
    })) : [];
  },
  async register(data) {
    return productionApi.register({
      productId: Number(data.productId),
      quantity: Number(data.quantity),
      productionDate: data.productionDate,
      notes: String(data.notes || "").trim(),
      usuario_id: authService.getCurrentUser()?.id || 1,
    });
  },
};
