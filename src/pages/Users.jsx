import {
  useMemo,
  useState,
} from "react";

import {
  Edit3,
  Eye,
  Plus,
  Search,
  Shield,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { useUsers } from "../hooks/useUsers";

const emptyUser = {
  name: "",
  email: "",
  password: "",
  role: "FUNCIONARIO",
  active: true,
};

function normalizeRole(role) {
  const value = String(role || "").trim().toUpperCase();
  if (["ADMIN", "ADMINISTRADOR"].includes(value)) return "ADMIN";
  if (["GERENTE", "MANAGER"].includes(value)) return "GERENTE";
  return "FUNCIONARIO";
}

function roleLabel(role) {
  role = normalizeRole(role);
  if (role === "ADMIN") {
    return "Administrador";
  }

  if (role === "GERENTE") {
    return "Gerente";
  }

  return "Funcionário";
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
    }
  ).format(value);
}

function getInitials(
  name = ""
) {
  const words =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return "US";
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}

export default function Users({ currentUser }) {
  const {
    users,
    loading,
    busy,
    error,
    createUser,
    updateUser,
    removeUser,
  } = useUsers();

  const [query, setQuery] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [
    viewUser,
    setViewUser,
  ] = useState(null);

  const filtered =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      return users.filter(
        (user) =>
          user.name
            .toLowerCase()
            .includes(search) ||

          user.email
            .toLowerCase()
            .includes(search) ||

          roleLabel(
            user.role
          )
            .toLowerCase()
            .includes(search)
      );
    }, [
      users,
      query,
    ]);

  async function handleDelete(
    user
  ) {
    // A exclusão segue a hierarquia: ADMIN > GERENTE > FUNCIONARIO.
    const rank = { FUNCIONARIO: 1, GERENTE: 2, ADMIN: 3 };
    const requesterRole = normalizeRole(currentUser?.role);
    const targetRole = normalizeRole(user?.role);
    if (!currentUser || (rank[requesterRole] || 0) <= (rank[targetRole] || 0)) {
      alert("Você só pode excluir usuários de nível inferior ao seu.");
      return;
    }

    // Ninguém pode excluir o próprio perfil.
    if (
      String(currentUser?.id) ===
      String(user.id)
    ) {
      alert(
        "Você não pode excluir seu próprio perfil."
      );
      return;
    }

    if (
      !window.confirm(
        `Deseja excluir "${user.name}"?`
      )
    ) {
      return;
    }

    try {
      await removeUser(
        user.id,
        currentUser.id
      );
    } catch (err) {
      alert(
        err.message
      );
    }
  }

  return (
    <div>

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            Controle de acesso
          </p>

          <h1>
            Usuários
          </h1>

          <p>
            Gerencie usuários e níveis de acesso.
          </p>

        </div>

        <button
          className="primary"
          onClick={() =>
            setCreating(true)
          }
        >
          <Plus size={17} />

          Novo usuário
        </button>

      </div>

      <div className="stats">

        <Stat
          icon={UserRound}
          index={0}
          label="Usuários"
          value={
            users.length
          }
        />

        <Stat
          icon={Shield}
          index={1}
          label="Administradores"
          value={
            users.filter(
              (u) =>
                normalizeRole(u.role) ===
                "ADMIN"
            ).length
          }
        />

        <Stat
          icon={Shield}
          index={2}
          label="Gerentes"
          value={
            users.filter(
              (u) =>
                normalizeRole(u.role) ===
                "GERENTE"
            ).length
          }
        />

        <Stat
          icon={UserRound}
          index={3}
          label="Ativos"
          value={
            users.filter(
              (u) =>
                u.active
            ).length
          }
        />

      </div>

      <div className="toolbar panel">

        <div className="search">

          <Search size={17} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Buscar usuário..."
          />

        </div>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} usuários
          </strong>

          <span>
            exibidos
          </span>

        </div>

        {loading ? (

          <div className="state">
            Carregando...
          </div>

        ) : error ? (

          <div className="state error">
            {error}
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>

                <tr>
                  <th>Usuário</th>
                  <th>Nível</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (user) => (

                    <tr
                      key={
                        user.id
                      }
                    >

                      <td>

                        <div className="product">

                          <b>
                            {getInitials(
                              user.name
                            )}
                          </b>

                          <div>

                            <strong>
                              {user.name}
                            </strong>

                            <small>
                              {user.email}
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>
                        {roleLabel(
                          user.role
                        )}
                      </td>

                      <td>

                        {user.active ? (

                          <span className="badge ok">
                            Ativo
                          </span>

                        ) : (

                          <span className="badge out">
                            Inativo
                          </span>

                        )}

                      </td>

                      <td>
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      <td>

                        <div className="actions">

                          <button
                            onClick={() =>
                              setViewUser(
                                user
                              )
                            }
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() =>
                              setEditingUser(
                                user
                              )
                            }
                          >
                            <Edit3 size={15} />
                          </button>

                          {currentUser &&
                            String(currentUser.id) !== String(user.id) &&
                            (
                              { FUNCIONARIO: 1, GERENTE: 2, ADMIN: 3 }[normalizeRole(user.role)] || 0
                            ) < (
                              { FUNCIONARIO: 1, GERENTE: 2, ADMIN: 3 }[normalizeRole(currentUser.role)] || 0
                            ) && (
                              <button
                                type="button"
                                className="danger-action"
                                title={`Excluir ${roleLabel(user.role).toLowerCase()}`}
                                onClick={() => handleDelete(user)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {creating && (

        <UserModal
          busy={busy}
          onSave={createUser}
          close={() =>
            setCreating(false)
          }
        />

      )}

      {editingUser && (

        <UserModal
          user={editingUser}
          busy={busy}
          onSave={(data) =>
            updateUser(
              editingUser.id,
              data
            )
          }
          close={() =>
            setEditingUser(null)
          }
        />

      )}

      {viewUser && (

        <ViewUser
          user={viewUser}
          close={() =>
            setViewUser(null)
          }
        />

      )}

    </div>
  );
}

function Stat({
  icon: Icon,
  index,
  label,
  value,
}) {
  return (
    <div className="stat panel">

      <div
        className={`stat-icon c${index}`}
      >
        <Icon size={20} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>Cadastrados</small>
      </div>

    </div>
  );
}

function UserModal({
  user,
  busy,
  onSave,
  close,
}) {
  const [form, setForm] =
    useState({
      ...emptyUser,
      ...(user || {}),
      password: "",
    });

  const [
    formError,
    setFormError,
  ] = useState("");

  function change(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Informe o nome."
      );

      return;
    }

    if (!form.email.trim()) {
      setFormError(
        "Informe o e-mail."
      );

      return;
    }

    if (
      !user &&
      form.password.length < 4
    ) {
      setFormError(
        "Informe uma senha com pelo menos 4 caracteres."
      );

      return;
    }

    try {
      await onSave({
        name:
          form.name.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        password:
          form.password,

        role:
          form.role,

        active:
          form.active,
      });

      close();
    } catch (err) {
      setFormError(
        err.message
      );
    }
  }

  return (
    <div
      className="backdrop"
      onMouseDown={close}
    >

      <form
        className="modal"
        onSubmit={submit}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <header>

          <div>

            <p className="eyebrow">
              {user
                ? "Editar usuário"
                : "Novo usuário"}
            </p>

            <h2>
              {user?.name ||
                "Cadastrar usuário"}
            </h2>

          </div>

          <button
            type="button"
            className="close"
            onClick={close}
          >
            <X />
          </button>

        </header>

        <div className="form">

          <Field
            label="Nome completo"
            value={form.name}
            onChange={(value) =>
              change(
                "name",
                value
              )
            }
          />

          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(value) =>
              change(
                "email",
                value
              )
            }
          />

          <Field
            label={
              user
                ? "Nova senha (opcional)"
                : "Senha"
            }
            type="password"
            value={
              form.password
            }
            onChange={(value) =>
              change(
                "password",
                value
              )
            }
          />

          <label>

            <span>
              Nível de acesso
            </span>

            <select
              value={form.role}
              onChange={(event) =>
                change(
                  "role",
                  event.target.value
                )
              }
            >

              <option value="ADMIN">
                Administrador
              </option>

              <option value="GERENTE">
                Gerente
              </option>

              <option value="FUNCIONARIO">
                Funcionário
              </option>

            </select>

          </label>

          <label>

            <span>
              Status
            </span>

            <select
              value={
                form.active
                  ? "1"
                  : "0"
              }
              onChange={(event) =>
                change(
                  "active",
                  event.target.value ===
                    "1"
                )
              }
            >

              <option value="1">
                Ativo
              </option>

              <option value="0">
                Inativo
              </option>

            </select>

          </label>

        </div>

        {formError && (

          <div
            className="state error"
            style={{
              padding:
                "0 18px 15px",
            }}
          >
            {formError}
          </div>

        )}

        <footer>

          <button
            type="button"
            className="secondary"
            onClick={close}
          >
            Cancelar
          </button>

          <button
            className="primary"
            disabled={busy}
          >
            {busy
              ? "Salvando..."
              : "Salvar"}
          </button>

        </footer>

      </form>

    </div>
  );
}

function ViewUser({
  user,
  close,
}) {
  return (
    <div
      className="backdrop"
      onMouseDown={close}
    >

      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <header>

          <div>
            <p className="eyebrow">
              Usuário
            </p>

            <h2>
              {user.name}
            </h2>
          </div>

          <button
            className="close"
            onClick={close}
          >
            <X />
          </button>

        </header>

        <div className="form">

          <Read
            label="Nome"
            value={user.name}
          />

          <Read
            label="E-mail"
            value={user.email}
          />

          <Read
            label="Nível"
            value={roleLabel(
              user.role
            )}
          />

          <Read
            label="Status"
            value={
              user.active
                ? "Ativo"
                : "Inativo"
            }
          />

        </div>

        <footer>

          <button
            className="primary"
            onClick={close}
          >
            Fechar
          </button>

        </footer>

      </div>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label>

      <span>
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </label>
  );
}

function Read({
  label,
  value,
}) {
  return (
    <label>

      <span>
        {label}
      </span>

      <input
        value={value || "—"}
        readOnly
      />

    </label>
  );
}