import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownToLine,
  Eye,
  Plus,
  Search,
  X,
} from "lucide-react";

import { useEntries } from "../hooks/useEntries";

function getToday() {
  const date = new Date();

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() *
        60000
  );

  return localDate
    .toISOString()
    .slice(0, 10);
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const [
    year,
    month,
    day,
  ] = date.split("-");

  return `${day}/${month}/${year}`;
}

export default function Entries() {
  const {
    entries,
    products,
    suppliers,
    loading,
    busy,
    error,
    createEntry,
  } = useEntries();

  const [query, setQuery] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [viewEntry, setViewEntry] =
    useState(null);

  const filtered = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return entries.filter(
      (entry) => {
        return (
          entry.productName
            .toLowerCase()
            .includes(search) ||

          entry.productSku
            .toLowerCase()
            .includes(search) ||

          entry.supplierName
            .toLowerCase()
            .includes(search) ||

          entry.document
            .toLowerCase()
            .includes(search)
        );
      }
    );
  }, [
    entries,
    query,
  ]);

  return (
    <div>

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            Movimentação de estoque
          </p>

          <h1>
            Entradas
          </h1>

          <p>
            Registre materiais e produtos recebidos no estoque.
          </p>

        </div>

        <button
          className="primary"
          onClick={() =>
            setCreating(true)
          }
        >
          <Plus size={17} />

          Nova entrada
        </button>

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
            placeholder="Buscar produto, fornecedor ou documento..."
          />

        </div>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} entradas
          </strong>

          <span>
            registradas
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
            Nenhuma entrada registrada.
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>

                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Fornecedor</th>
                  <th>Documento</th>
                  <th>Estoque</th>
                  <th>Data</th>
                  <th>Responsável</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (entry) => (

                    <tr
                      key={
                        entry.id
                      }
                    >

                      <td>

                        <div className="product">

                          <b>
                            <ArrowDownToLine
                              size={
                                18
                              }
                            />
                          </b>

                          <div>

                            <strong>
                              {
                                entry.productName
                              }
                            </strong>

                            <small>
                              {
                                entry.productSku
                              }
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>

                        <strong className="positive">
                          +
                          {
                            entry.quantity
                          }{" "}
                          {
                            entry.unit
                          }
                        </strong>

                      </td>

                      <td>
                        {entry.supplierName ||
                          "—"}
                      </td>

                      <td>
                        {entry.document ||
                          "—"}
                      </td>

                      <td>

                        <strong>
                          {
                            entry.previousStock
                          }
                        </strong>

                        <small className="muted">
                          {" "}
                          →{" "}
                          {
                            entry.newStock
                          }
                        </small>

                      </td>

                      <td>
                        {formatDate(
                          entry.movementDate
                        )}
                      </td>

                      <td>
                        {
                          entry.userName
                        }
                      </td>

                      <td>

                        <div className="actions">

                          <button
                            title="Visualizar"
                            onClick={() =>
                              setViewEntry(
                                entry
                              )
                            }
                          >
                            <Eye
                              size={
                                15
                              }
                            />
                          </button>

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

        <EntryModal
          products={products}
          suppliers={suppliers}
          busy={busy}
          onSave={createEntry}
          close={() =>
            setCreating(false)
          }
        />

      )}

      {viewEntry && (

        <ViewEntry
          entry={viewEntry}
          close={() =>
            setViewEntry(null)
          }
        />

      )}

    </div>
  );
}

function EntryModal({
  products,
  suppliers,
  busy,
  onSave,
  close,
}) {
  const [form, setForm] =
    useState({
      productId: "",
      quantity: "",
      supplierId: "",
      document: "",
      notes: "",
      movementDate:
        getToday(),
    });

  const [
    formError,
    setFormError,
  ] = useState("");

  const selectedProduct =
    products.find(
      (product) =>
        Number(product.id) ===
        Number(form.productId)
    );

  const quantity =
    Number(
      form.quantity || 0
    );

  const newStock =
    selectedProduct
      ? Number(
          selectedProduct.stock ||
            0
        ) + quantity
      : 0;

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setFormError("");

    if (!form.productId) {
      setFormError(
        "Selecione um produto."
      );

      return;
    }

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      setFormError(
        "Informe uma quantidade maior que zero."
      );

      return;
    }

    if (
      !form.movementDate
    ) {
      setFormError(
        "Informe a data da entrada."
      );

      return;
    }

    try {
      await onSave({
        productId:
          Number(
            form.productId
          ),

        quantity:
          Number(
            form.quantity
          ),

        supplierId:
          form.supplierId
            ? Number(
                form.supplierId
              )
            : null,

        document:
          form.document.trim(),

        notes:
          form.notes.trim(),

        movementDate:
          form.movementDate,
      });

      close();
    } catch (err) {
      setFormError(
        err.message ||
          "Não foi possível registrar a entrada."
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
        onSubmit={
          handleSubmit
        }
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <header>

          <div>

            <p className="eyebrow">
              Estoque
            </p>

            <h2>
              Nova entrada
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
              Produto
            </span>

            <select
              value={
                form.productId
              }
              onChange={(
                event
              ) =>
                updateField(
                  "productId",
                  event.target
                    .value
                )
              }
            >

              <option value="">
                Selecione...
              </option>

              {products.map(
                (product) => (

                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {
                      product.name
                    }{" "}
                    —{" "}
                    {
                      product.stock
                    }{" "}
                    {
                      product.unit
                    }
                  </option>

                )
              )}

            </select>

          </label>

          <Field
            label="Quantidade recebida"
            type="number"
            min="0.01"
            step="0.01"
            value={
              form.quantity
            }
            onChange={(value) =>
              updateField(
                "quantity",
                value
              )
            }
          />

          <label>

            <span>
              Fornecedor
            </span>

            <select
              value={
                form.supplierId
              }
              onChange={(
                event
              ) =>
                updateField(
                  "supplierId",
                  event.target
                    .value
                )
              }
            >

              <option value="">
                Sem fornecedor
              </option>

              {suppliers.map(
                (supplier) => (

                  <option
                    key={
                      supplier.id
                    }
                    value={
                      supplier.id
                    }
                  >
                    {
                      supplier.name
                    }
                  </option>

                )
              )}

            </select>

          </label>

          <Field
            label="Documento / Nota fiscal"
            value={
              form.document
            }
            onChange={(value) =>
              updateField(
                "document",
                value
              )
            }
            placeholder="Ex.: NF 12345"
          />

          <Field
            label="Data da entrada"
            type="date"
            value={
              form.movementDate
            }
            onChange={(value) =>
              updateField(
                "movementDate",
                value
              )
            }
          />

          <Field
            label="Observação"
            value={
              form.notes
            }
            onChange={(value) =>
              updateField(
                "notes",
                value
              )
            }
            placeholder="Observação opcional"
          />

        </div>

        {selectedProduct && (

          <div
            style={{
              margin:
                "0 18px 18px",
              padding: "14px",
              border:
                "1px solid var(--border)",
              borderRadius:
                "12px",
            }}
          >

            <small
              className="muted"
            >
              Estoque atual
            </small>

            <div
              style={{
                marginTop:
                  "5px",
              }}
            >

              <strong>
                {
                  selectedProduct.stock
                }{" "}
                {
                  selectedProduct.unit
                }
              </strong>

              <span
                style={{
                  margin:
                    "0 10px",
                }}
              >
                →
              </span>

              <strong className="positive">
                {
                  newStock
                }{" "}
                {
                  selectedProduct.unit
                }
              </strong>

            </div>

          </div>

        )}

        {formError && (

          <div
            className="state error"
            style={{
              padding:
                "0 18px 15px",
              textAlign:
                "left",
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
              ? "Registrando..."
              : "Registrar entrada"}
          </button>

        </footer>

      </form>

    </div>
  );
}

function ViewEntry({
  entry,
  close,
}) {
  return (
    <div
      className="backdrop"
      onMouseDown={close}
    >

      <div
        className="modal"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <header>

          <div>

            <p className="eyebrow">
              Entrada de estoque
            </p>

            <h2>
              {
                entry.productName
              }
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
            label="Produto"
            value={
              entry.productName
            }
          />

          <ReadField
            label="SKU"
            value={
              entry.productSku
            }
          />

          <ReadField
            label="Quantidade"
            value={`+${entry.quantity} ${entry.unit}`}
          />

          <ReadField
            label="Estoque anterior"
            value={`${entry.previousStock} ${entry.unit}`}
          />

          <ReadField
            label="Estoque posterior"
            value={`${entry.newStock} ${entry.unit}`}
          />

          <ReadField
            label="Fornecedor"
            value={
              entry.supplierName
            }
          />

          <ReadField
            label="Documento"
            value={
              entry.document
            }
          />

          <ReadField
            label="Data"
            value={formatDate(
              entry.movementDate
            )}
          />

          <ReadField
            label="Responsável"
            value={
              entry.userName
            }
          />

          <ReadField
            label="Observação"
            value={
              entry.notes
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
        value={
          value ?? ""
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
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
          value ===
            undefined ||
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