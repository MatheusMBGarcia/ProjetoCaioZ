import { usersService } from "./usersService";

const SESSION_KEY = "gmj_estoque_sessao";

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}

export const authService = {
  async login(email, password) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error("Informe o e-mail e a senha.");
    }

    const user = await usersService.login(
      normalizedEmail,
      normalizedPassword
    );

    if (!user.active) {
      throw new Error("Este usuário está inativo.");
    }

    const sessionUser = safeUser(user);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(sessionUser)
    );

    return sessionUser;
  },

  getCurrentUser() {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};
