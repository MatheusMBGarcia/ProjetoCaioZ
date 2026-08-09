import { movementsApi } from "./api/movementsApi";
import { authService } from "./authService";

function normalizeMovement(movement) {
  return {
    id: movement.id,
    type: String(movement.type || ""),
    productId: Number(movement.productId ?? movement.produto_id),
    productName: String(movement.productName || ""),
    productSku: String(movement.productSku || ""),
    unit: String(movement.unit || "un"),
    quantity: Number(movement.quantity || 0),
    previousStock: Number(
      movement.previousStock ?? movement.estoque_anterior ?? 0
    ),
    newStock: Number(
      movement.newStock ?? movement.estoque_posterior ?? 0
    ),
    supplierId: movement.supplierId
      ? Number(movement.supplierId)
      : null,
    supplierName: String(movement.supplierName || ""),
    document: String(movement.document || ""),
    reason: String(movement.reason || ""),
    destination: String(movement.destination || ""),
    notes: String(movement.notes || ""),
    movementDate: String(movement.movementDate || ""),
    userName: String(movement.userName || "Administrador"),
    createdAt: movement.createdAt || new Date().toISOString(),
  };
}

export const movementsService = {
  async list(type = null) {
    const data = await movementsApi.list(type);
    const rows = Array.isArray(data)
      ? data.map(normalizeMovement)
      : [];

    return type
      ? rows.filter((movement) => movement.type === type)
      : rows;
  },

  async createEntry(data) {
    const currentUser = authService.getCurrentUser();
    const result = await movementsApi.createEntry({
      productId: Number(data.productId),
      quantity: Number(data.quantity),
      supplierId: data.supplierId ? Number(data.supplierId) : null,
      document: String(data.document || "").trim(),
      notes: String(data.notes || "").trim(),
      movementDate: data.movementDate || null,
      usuario_id: currentUser?.id || 1,
    });

    return normalizeMovement(result);
  },

  async createExit(data) {
    const currentUser = authService.getCurrentUser();
    const result = await movementsApi.createExit({
      productId: Number(data.productId),
      quantity: Number(data.quantity),
      reason: String(data.reason || "").trim(),
      destination: String(data.destination || "").trim(),
      document: String(data.document || "").trim(),
      notes: String(data.notes || "").trim(),
      movementDate: data.movementDate || null,
      usuario_id: currentUser?.id || 1,
    });

    return normalizeMovement(result);
  },
};
