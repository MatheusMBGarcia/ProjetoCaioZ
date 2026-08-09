import { categoriesApi } from "./api/categoriesApi";

function normalizeCategory(category) {
  return {
    id: category.id,
    name: String(category.name || category.nome || "").trim(),
    description: String(
      category.description || category.descricao || ""
    ).trim(),
    active: category.active !== false && category.ativo !== 0,
    createdAt: category.createdAt || category.criado_em || null,
  };
}

export const categoriesService = {
  async list() {
    const data = await categoriesApi.list();
    return Array.isArray(data) ? data.map(normalizeCategory) : [];
  },

  async create(data) {
    const name = String(data.name || "").trim();
    if (!name) throw new Error("Informe o nome da categoria.");
    return normalizeCategory(
      await categoriesApi.create({
        name,
        description: String(data.description || "").trim(),
      })
    );
  },

  async update(id, data) {
    const name = String(data.name || "").trim();
    if (!name) throw new Error("Informe o nome da categoria.");
    return normalizeCategory(
      await categoriesApi.update(id, {
        name,
        description: String(data.description || "").trim(),
      })
    );
  },

  async remove(id) {
    return categoriesApi.remove(id);
  },
};
