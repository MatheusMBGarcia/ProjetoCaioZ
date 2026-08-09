import {
  useMemo,
  useState,
} from "react";

import {
  Edit3,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useProducts } from "../hooks/useProducts";

const money = (value) =>
  new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(Number(value || 0));

const emptyProduct = {
  sku: "",
  name: "",
  type: "Matéria-prima",
  category: "",
  unit: "un",
  brand: "",
  model: "",
  location: "",
  stock: 0,
  minimum: 0,
  cost: 0,
  sale: 0,
  supplier: "",
};

export default function Products() {
  const {
    products,
    loading,
    busy,
    error,
    createProduct,
    updateProduct,
    removeProduct,
  } = useProducts();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [viewProduct, setViewProduct] =
    useState(null);

  const [creating, setCreating] =
    useState(false);

  const categories = [
    "Todas",
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  const filtered = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return products.filter((product) => {
      const name =
        String(product.name || "").toLowerCase();

      const sku =
        String(product.sku || "").toLowerCase();

      const matchesQuery =
        name.includes(normalizedQuery) ||
        sku.includes(normalizedQuery);

      const matchesCategory =
        category === "Todas" ||
        product.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [
    products,
    query,
    category,
  ]);

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Deseja realmente excluir "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await removeProduct(product.id);
    } catch {
      alert(
        "Não foi possível excluir o produto."
      );
    }
  }

  return (
    <div>

      <div className="page-heading">

        <div>
          <p className="eyebrow">
            Gestão de estoque
          </p>

          <h1>
            Produtos
          </h1>

          <p>
            Gerencie materiais e produtos cadastrados no estoque.
          </p>
        </div>

        <button
          className="primary"
          onClick={() => setCreating(true)}
        >
          <Plus size={17} />

          Novo produto
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
            placeholder="Buscar por nome ou SKU..."
          />

        </div>

        <label className="filter">

          <Filter size={15} />

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >

            {categories.map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}

          </select>

        </label>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} produtos
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

        ) : filtered.length === 0 ? (

          <div className="state">
            Nenhum produto encontrado.
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>

                <tr>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Custo</th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map((product) => (

                  <tr key={product.id}>

                    <td>

                      <div className="product">

                        <b>
                          {product.short}
                        </b>

                        <div>

                          <strong>
                            {product.name}
                          </strong>

                          <small>
                            {product.sku}

                            {product.brand
                              ? ` · ${product.brand}`
                              : ""}
                          </small>

                        </div>

                      </div>

                    </td>

                    <td>
                      {product.type || "Material"}
                    </td>

                    <td>
                      {product.category}
                    </td>

                    <td>

                      <strong>
                        {product.stock}
                      </strong>

                      <small className="muted">
                        mín. {product.minimum} {product.unit}
                      </small>

                    </td>

                    <td>
                      {money(product.cost)}
                    </td>

                    <td>
                      {product.location || "—"}
                    </td>

                    <td>
                      <Status product={product} />
                    </td>

                    <td>

                      <div className="actions">

                        <button
                          title="Visualizar"
                          onClick={() =>
                            setViewProduct(product)
                          }
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          title="Editar"
                          onClick={() =>
                            setEditingProduct(product)
                          }
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          title="Excluir"
                          onClick={() =>
                            handleDelete(product)
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

        <ProductModal
          product={null}
          busy={busy}
          onSave={createProduct}
          close={() => setCreating(false)}
        />

      )}

      {editingProduct && (

        <ProductModal
          product={editingProduct}
          busy={busy}
          onSave={(data) =>
            updateProduct(
              editingProduct.id,
              data
            )
          }
          close={() =>
            setEditingProduct(null)
          }
        />

      )}

      {viewProduct && (

        <ViewModal
          product={viewProduct}
          close={() =>
            setViewProduct(null)
          }
        />

      )}

    </div>
  );
}

function Status({ product }) {
  if (Number(product.stock) === 0) {
    return (
      <span className="badge out">
        Sem estoque
      </span>
    );
  }

  if (
    Number(product.stock) <=
    Number(product.minimum)
  ) {
    return (
      <span className="badge low">
        Estoque baixo
      </span>
    );
  }

  return (
    <span className="badge ok">
      Normal
    </span>
  );
}

function ProductModal({
  product,
  busy,
  onSave,
  close,
}) {
  const [form, setForm] = useState(
    product
      ? {
          ...emptyProduct,
          ...product,
        }
      : emptyProduct
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

    if (!form.sku.trim()) {
      setFormError(
        "Informe o código / SKU."
      );

      return;
    }

    if (!form.name.trim()) {
      setFormError(
        "Informe o nome do produto."
      );

      return;
    }

    if (!form.category.trim()) {
      setFormError(
        "Informe a categoria."
      );

      return;
    }

    if (!form.unit.trim()) {
      setFormError(
        "Informe a unidade de medida."
      );

      return;
    }

    const data = {
      ...form,

      stock: Number(form.stock || 0),

      minimum: Number(
        form.minimum || 0
      ),

      cost: Number(form.cost || 0),

      sale: Number(form.sale || 0),
    };

    if (data.stock < 0) {
      setFormError(
        "O estoque não pode ser negativo."
      );

      return;
    }

    if (data.minimum < 0) {
      setFormError(
        "O estoque mínimo não pode ser negativo."
      );

      return;
    }

    if (data.cost < 0) {
      setFormError(
        "O custo não pode ser negativo."
      );

      return;
    }

    try {
      await onSave(data);

      close();
    } catch (error) {
      setFormError(
        error.message ||
          "Não foi possível salvar o produto."
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
              {product
                ? "Editar produto"
                : "Novo produto"}
            </p>

            <h2>
              {product?.name ||
                "Cadastrar produto"}
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
            label="Código / SKU"
            value={form.sku}
            onChange={(value) =>
              updateField("sku", value)
            }
          />

          <Field
            label="Nome do item"
            value={form.name}
            onChange={(value) =>
              updateField("name", value)
            }
          />

          <Field
            label="Tipo"
            value={form.type}
            onChange={(value) =>
              updateField("type", value)
            }
          />

          <Field
            label="Categoria"
            value={form.category}
            onChange={(value) =>
              updateField(
                "category",
                value
              )
            }
          />

          <Field
            label="Unidade de medida"
            value={form.unit}
            onChange={(value) =>
              updateField("unit", value)
            }
            placeholder="un, kg, m, L..."
          />

          <Field
            label="Marca"
            value={form.brand}
            onChange={(value) =>
              updateField("brand", value)
            }
          />

          <Field
            label="Modelo"
            value={form.model}
            onChange={(value) =>
              updateField("model", value)
            }
          />

          <Field
            label="Localização"
            value={form.location}
            onChange={(value) =>
              updateField(
                "location",
                value
              )
            }
            placeholder="Ex.: A-01"
          />

          <Field
            label="Quantidade atual"
            type="number"
            min="0"
            value={form.stock}
            onChange={(value) =>
              updateField("stock", value)
            }
          />

          <Field
            label="Estoque mínimo"
            type="number"
            min="0"
            value={form.minimum}
            onChange={(value) =>
              updateField(
                "minimum",
                value
              )
            }
          />

          <Field
            label="Custo unitário"
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(value) =>
              updateField("cost", value)
            }
          />

          <Field
            label="Preço de venda"
            type="number"
            min="0"
            step="0.01"
            value={form.sale}
            onChange={(value) =>
              updateField("sale", value)
            }
          />

          <Field
            label="Fornecedor"
            value={form.supplier}
            onChange={(value) =>
              updateField(
                "supplier",
                value
              )
            }
          />

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
              : product
                ? "Salvar alterações"
                : "Cadastrar produto"}
          </button>

        </footer>

      </form>

    </div>
  );
}

function ViewModal({
  product,
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
              Produto
            </p>

            <h2>
              {product.name}
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
            label="Código / SKU"
            value={product.sku}
          />

          <ReadField
            label="Tipo"
            value={product.type}
          />

          <ReadField
            label="Categoria"
            value={product.category}
          />

          <ReadField
            label="Unidade"
            value={product.unit}
          />

          <ReadField
            label="Marca"
            value={product.brand}
          />

          <ReadField
            label="Modelo"
            value={product.model}
          />

          <ReadField
            label="Estoque atual"
            value={`${product.stock} ${product.unit}`}
          />

          <ReadField
            label="Estoque mínimo"
            value={`${product.minimum} ${product.unit}`}
          />

          <ReadField
            label="Custo unitário"
            value={money(product.cost)}
          />

          <ReadField
            label="Preço de venda"
            value={money(product.sale)}
          />

          <ReadField
            label="Localização"
            value={product.location}
          />

          <ReadField
            label="Fornecedor"
            value={product.supplier}
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
  min,
  step,
  placeholder,
}) {
  return (
    <label>

      <span>
        {label}
      </span>

      <input
        type={type}
        min={min}
        step={step}
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