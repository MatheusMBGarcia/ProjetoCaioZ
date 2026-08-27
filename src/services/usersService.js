import { usersApi } from "./api/usersApi";

function normalizeUser(user) {
  return {
    id: user.id,
    name: String(user.name || user.nome || "").trim(),
    email: String(user.email || "").trim().toLowerCase(),
    password: user.password ?? "",
    role: String(user.role || "FUNCIONARIO"),
    active: user.active !== false && user.active !== 0,
    createdAt: user.createdAt || user.criado_em || null,
  };
}

export const usersService = {
  async list() {
    const data = await usersApi.list();
    return Array.isArray(data) ? data.map(normalizeUser) : [];
  },

  async get(id) {
    const data = await usersApi.get(id);
    return data ? normalizeUser(data) : null;
  },

  async login(email, password) {
    const user = await usersApi.login(email, password);
    return normalizeUser(user);
  },

  async create(data) {
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (!name) throw new Error("Informe o nome do usuário.");
    if (!email.includes("@")) throw new Error("Informe um e-mail válido.");
    if (password.length < 4) {
      throw new Error("A senha deve ter pelo menos 4 caracteres.");
    }

    return normalizeUser(
      await usersApi.create({
        name,
        email,
        password,
        role: data.role || "FUNCIONARIO",
        active: data.active !== false,
      })
    );
  },

  async update(id, data) {
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();

    if (!name) throw new Error("Informe o nome do usuário.");
    if (!email.includes("@")) throw new Error("Informe um e-mail válido.");

    return normalizeUser(
      await usersApi.update(id, {
        name,
        email,
        password: data.password || "",
        role: data.role || "FUNCIONARIO",
        active: data.active !== false,
      })
    );
  },

  async remove(id, requesterId) {
    return usersApi.remove(id, requesterId);
  },
};
