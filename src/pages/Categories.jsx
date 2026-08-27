import {
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useCategories } from "../hooks/useCategories";

export default function Categories() {
  const {
    categories,
    loading,
    busy,
    error,
    createCategory,
    updateCategory,
    removeCategory,
  } = useCategories();

  const [query, setQuery] = useState("");

  const [creating, setCreating] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const filtered = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return categories.filter((category) => {
      return (
        category.name
          .toLowerCase()
          .includes(search) ||
        category.description
          .toLowerCase()
          .includes(search)
      );
    });
  }, [categories, query]);

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Deseja excluir a categoria "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await removeCategory(category.id);
    } catch (err) {
      alert(
        err.message ||
          "Não foi possível excluir a categoria."
      );
    }
  }

  return (
    <div>

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            Organização do estoque
          </p>

          <h1>
            Categorias
          </h1>

          <p>
            Organize materiais e produtos por categoria.
          </p>

        </div>

        <button
          className="primary"
          onClick={() => setCreating(true)}
        >
          <Plus size={17} />

          Nova categoria
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
            placeholder="Buscar categoria..."
          />

        </div>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} categorias
          </strong>

          <span>
            cadastradas
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
            Nenhuma categoria encontrada.
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>

                <tr>
                  <th>Categoria</th>
                  <th>Destino</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map((category) => (

                  <tr key={category.id}>

                    <td>

                      <div className="product">

                        <b>
                          <Boxes size={18} />
                        </b>

                        <div>

                          <strong>
                            {category.name}
                          </strong>

                        </div>

                      </div>

                    </td>

                    <td>
                      {category.stockCategory === "sale" ? "Para venda" : "Uso interno"}
                    </td>

                    <td>
                      {category.description || "—"}
                    </td>

                    <td>

                      <div className="actions">

                        <button
                          title="Editar"
                          onClick={() =>
                            setEditingCategory(category)
                          }
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          title="Excluir"
                          onClick={() =>
                            handleDelete(category)
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

        <CategoryModal
          category={null}
          busy={busy}
          onSave={createCategory}
          close={() => setCreating(false)}
        />

      )}

      {editingCategory && (

        <CategoryModal
          category={editingCategory}
          busy={busy}
          onSave={(data) =>
            updateCategory(
              editingCategory.id,
              data
            )
          }
          close={() =>
            setEditingCategory(null)
          }
        />

      )}

    </div>
  );
}

function CategoryModal({
  category,
  busy,
  onSave,
  close,
}) {
  const [form, setForm] = useState({
    name: category?.name || "",
    description:
      category?.description || "",
    stockCategory:
      category?.stockCategory || "internal",
  });

  const [formError, setFormError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");

    if (!form.name.trim()) {
      setFormError(
        "Informe o nome da categoria."
      );

      return;
    }

    try {
      await onSave({
        name: form.name.trim(),
        description:
          form.description.trim(),
        stockCategory: form.stockCategory,
      });

      close();
    } catch (err) {
      setFormError(
        err.message ||
          "Não foi possível salvar a categoria."
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
              {category
                ? "Editar categoria"
                : "Nova categoria"}
            </p>

            <h2>
              {category?.name ||
                "Cadastrar categoria"}
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

          <label>

            <span>
              Nome da categoria
            </span>

            <input
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Ex.: Matéria-prima"
              autoFocus
            />

          </label>

          <label>

            <span>
              Destino
            </span>

            <select
              value={form.stockCategory}
              onChange={(event) =>
                setForm({
                  ...form,
                  stockCategory: event.target.value,
                })
              }
            >
              <option value="internal">Uso interno</option>
              <option value="sale">Para venda</option>
            </select>

          </label>

          <label>

            <span>
              Descrição
            </span>

            <input
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              placeholder="Descrição opcional"
            />

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
              : category
                ? "Salvar alterações"
                : "Cadastrar categoria"}
          </button>

        </footer>

      </form>

    </div>
  );
}