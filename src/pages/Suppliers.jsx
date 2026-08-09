import {
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useSuppliers } from "../hooks/useSuppliers";

const emptySupplier = {
  name: "",
  document: "",
  phone: "",
  email: "",
  contact: "",
  city: "",
  state: "",
  notes: "",
  active: true,
};

export default function Suppliers() {
  const {
    suppliers,
    loading,
    busy,
    error,
    createSupplier,
    updateSupplier,
    removeSupplier,
  } = useSuppliers();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState(null);
  const [viewSupplier, setViewSupplier] =
    useState(null);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(search) ||
        supplier.document.toLowerCase().includes(search) ||
        supplier.email.toLowerCase().includes(search) ||
        supplier.phone.toLowerCase().includes(search)
      );
    });
  }, [suppliers, query]);

  async function handleDelete(supplier) {
    const confirmed = window.confirm(
      `Deseja excluir o fornecedor "${supplier.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await removeSupplier(supplier.id);
    } catch (err) {
      alert(
        err.message ||
          "Não foi possível excluir o fornecedor."
      );
    }
  }

  return (
    <div>

      <div className="page-heading">

        <div>
          <p className="eyebrow">
            Cadastro
          </p>

          <h1>
            Fornecedores
          </h1>

          <p>
            Gerencie os fornecedores de materiais e produtos.
          </p>
        </div>

        <button
          className="primary"
          onClick={() => setCreating(true)}
        >
          <Plus size={17} />
          Novo fornecedor
        </button>

      </div>

      <div className="toolbar panel">

        <div className="search">

          <Search size={17} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Buscar fornecedor..."
          />

        </div>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} fornecedores
          </strong>

          <span>
            cadastrados
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

        ) : filtered.length === 0 ? (

          <div className="state">
            Nenhum fornecedor encontrado.
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Documento</th>
                  <th>Contato</th>
                  <th>Cidade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((supplier) => (

                  <tr key={supplier.id}>

                    <td>

                      <div className="product">

                        <b>
                          <Building2 size={18} />
                        </b>

                        <div>
                          <strong>
                            {supplier.name}
                          </strong>

                          <small>
                            {supplier.email || "Sem e-mail"}
                          </small>
                        </div>

                      </div>

                    </td>

                    <td>
                      {supplier.document || "—"}
                    </td>

                    <td>
                      <strong>
                        {supplier.contact || "—"}
                      </strong>

                      <small className="muted">
                        {supplier.phone || ""}
                      </small>
                    </td>

                    <td>
                      {supplier.city
                        ? `${supplier.city}${
                            supplier.state
                              ? ` / ${supplier.state}`
                              : ""
                          }`
                        : "—"}
                    </td>

                    <td>
                      {supplier.active ? (
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

                      <div className="actions">

                        <button
                          title="Visualizar"
                          onClick={() =>
                            setViewSupplier(supplier)
                          }
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          title="Editar"
                          onClick={() =>
                            setEditingSupplier(supplier)
                          }
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          title="Excluir"
                          onClick={() =>
                            handleDelete(supplier)
                          }
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {creating && (
        <SupplierModal
          supplier={null}
          busy={busy}
          onSave={createSupplier}
          close={() => setCreating(false)}
        />
      )}

      {editingSupplier && (
        <SupplierModal
          supplier={editingSupplier}
          busy={busy}
          onSave={(data) =>
            updateSupplier(
              editingSupplier.id,
              data
            )
          }
          close={() =>
            setEditingSupplier(null)
          }
        />
      )}

      {viewSupplier && (
        <ViewSupplier
          supplier={viewSupplier}
          close={() =>
            setViewSupplier(null)
          }
        />
      )}

    </div>
  );
}

function SupplierModal({
  supplier,
  busy,
  onSave,
  close,
}) {
  const [form, setForm] = useState(
    supplier
      ? {
          ...emptySupplier,
          ...supplier,
        }
      : emptySupplier
  );

  const [formError, setFormError] =
    useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Informe o nome do fornecedor."
      );

      return;
    }

    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        document: form.document.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        contact: form.contact.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        notes: form.notes.trim(),
      });

      close();
    } catch (err) {
      setFormError(
        err.message ||
          "Não foi possível salvar o fornecedor."
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
        onSubmit={handleSubmit}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <header>

          <div>
            <p className="eyebrow">
              {supplier
                ? "Editar fornecedor"
                : "Novo fornecedor"}
            </p>

            <h2>
              {supplier?.name ||
                "Cadastrar fornecedor"}
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
            label="Nome / Razão social"
            value={form.name}
            onChange={(value) =>
              updateField("name", value)
            }
          />

          <Field
            label="CPF / CNPJ"
            value={form.document}
            onChange={(value) =>
              updateField("document", value)
            }
          />

          <Field
            label="Responsável / Contato"
            value={form.contact}
            onChange={(value) =>
              updateField("contact", value)
            }
          />

          <Field
            label="Telefone"
            value={form.phone}
            onChange={(value) =>
              updateField("phone", value)
            }
          />

          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(value) =>
              updateField("email", value)
            }
          />

          <Field
            label="Cidade"
            value={form.city}
            onChange={(value) =>
              updateField("city", value)
            }
          />

          <Field
            label="Estado"
            value={form.state}
            onChange={(value) =>
              updateField("state", value)
            }
            placeholder="Ex.: SP"
          />

          <Field
            label="Observações"
            value={form.notes}
            onChange={(value) =>
              updateField("notes", value)
            }
          />

          <label>
            <span>Status</span>

            <select
              value={form.active ? "1" : "0"}
              onChange={(event) =>
                updateField(
                  "active",
                  event.target.value === "1"
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
              padding: "0 18px 15px",
              textAlign: "left",
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
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primary"
            disabled={busy}
          >
            {busy
              ? "Salvando..."
              : supplier
                ? "Salvar alterações"
                : "Cadastrar fornecedor"}
          </button>

        </footer>

      </form>

    </div>
  );
}

function ViewSupplier({
  supplier,
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
              Fornecedor
            </p>

            <h2>
              {supplier.name}
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

          <ReadField
            label="CPF / CNPJ"
            value={supplier.document}
          />

          <ReadField
            label="Responsável"
            value={supplier.contact}
          />

          <ReadField
            label="Telefone"
            value={supplier.phone}
          />

          <ReadField
            label="E-mail"
            value={supplier.email}
          />

          <ReadField
            label="Cidade"
            value={supplier.city}
          />

          <ReadField
            label="Estado"
            value={supplier.state}
          />

          <ReadField
            label="Status"
            value={
              supplier.active
                ? "Ativo"
                : "Inativo"
            }
          />

          <ReadField
            label="Observações"
            value={supplier.notes}
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
  placeholder,
}) {
  return (
    <label>

      <span>
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </label>
  );
}

function ReadField({
  label,
  value,
}) {
  return (
    <label>

      <span>
        {label}
      </span>

      <input
        value={
          value === undefined ||
          value === null ||
          value === ""
            ? "—"
            : value
        }
        readOnly
      />

    </label>
  );
}