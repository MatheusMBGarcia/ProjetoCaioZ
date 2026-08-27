import { suppliersApi } from "./api/suppliersApi";

function normalizeSupplier(supplier) {
  return {
    id: supplier.id,
    name: String(supplier.name || "").trim(),
    document: String(supplier.document || supplier.cnpj || "").trim(),
    cnpj: String(supplier.cnpj || supplier.document || "").trim(),
    email: String(supplier.email || "").trim().toLowerCase(),
    phone: String(supplier.phone || supplier.telefone || "").trim(),
    contact: String(supplier.contact || supplier.contato || "").trim(),
    address: String(supplier.address || supplier.endereco || "").trim(),
    city: String(supplier.city || supplier.cidade || "").trim(),
    state: String(supplier.state || supplier.estado || "").trim(),
    notes: String(supplier.notes || supplier.observacao || "").trim(),
    active: supplier.active !== false && supplier.active !== 0,
    createdAt: supplier.createdAt || supplier.criado_em || null,
  };
}

export const suppliersService = {
  async list() {
    const data = await suppliersApi.list();
    return Array.isArray(data) ? data.map(normalizeSupplier) : [];
  },

  async get(id) {
    const data = await suppliersApi.get(id);
    return data ? normalizeSupplier(data) : null;
  },

  async create(data) {
    const name = String(data.name || "").trim();
    if (!name) throw new Error("Informe o nome do fornecedor.");
    return normalizeSupplier(
      await suppliersApi.create({
        ...data,
        name,
        document: String(data.document || "").trim(),
        email: String(data.email || "").trim().toLowerCase(),
      })
    );
  },

  async update(id, data) {
    const name = String(data.name || "").trim();
    if (!name) throw new Error("Informe o nome do fornecedor.");
    return normalizeSupplier(
      await suppliersApi.update(id, {
        ...data,
        name,
        document: String(data.document || "").trim(),
        email: String(data.email || "").trim().toLowerCase(),
      })
    );
  },

  async remove(id) {
    return suppliersApi.remove(id);
  },
};
