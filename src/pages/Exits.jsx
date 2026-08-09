import {
  useMemo,
  useState,
} from "react";

import {
  Eye,
  Plus,
  Search,
  Truck,
  X,
} from "lucide-react";

import { useExits } from "../hooks/useExits";

function getToday() {
  const date =
    new Date();

  const localDate =
    new Date(
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

export default function Exits() {
  const {
    exits,
    products,
    loading,
    busy,
    error,
    createExit,
  } = useExits();

  const [query, setQuery] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [viewExit, setViewExit] =
    useState(null);

  const filtered =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      return exits.filter(
        (exit) => {
          return (
            exit.productName
              .toLowerCase()
              .includes(search) ||

            exit.productSku
              .toLowerCase()
              .includes(search) ||

            exit.reason
              .toLowerCase()
              .includes(search) ||

            exit.destination
              .toLowerCase()
              .includes(search) ||

            exit.document
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      exits,
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
            Saídas
          </h1>

          <p>
            Registre materiais e produtos retirados do estoque.
          </p>

        </div>

        <button
          className="primary"
          onClick={() =>
            setCreating(true)
          }
        >
          <Plus size={17} />

          Nova saída
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
            placeholder="Buscar produto, motivo ou destino..."
          />

        </div>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} saídas
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
            Nenhuma saída registrada.
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>

                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Destino</th>
                  <th>Estoque</th>
                  <th>Data</th>
                  <th>Responsável</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (exit) => (

                    <tr
                      key={
                        exit.id
                      }
                    >

                      <td>

                        <div className="product">

                          <b>
                            <Truck
                              size={
                                18
                              }
                            />
                          </b>

                          <div>

                            <strong>
                              {
                                exit.productName
                              }
                            </strong>

                            <small>
                              {
                                exit.productSku
                              }
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>

                        <strong className="negative">
                          -
                          {
                            exit.quantity
                          }{" "}
                          {
                            exit.unit
                          }
                        </strong>

                      </td>

                      <td>
                        {exit.reason ||
                          "—"}
                      </td>

                      <td>
                        {exit.destination ||
                          "—"}
                      </td>

                      <td>

                        <strong>
                          {
                            exit.previousStock
                          }
                        </strong>

                        <small className="muted">
                          {" "}
                          →{" "}
                          {
                            exit.newStock
                          }
                        </small>

                      </td>

                      <td>
                        {formatDate(
                          exit.movementDate
                        )}
                      </td>

                      <td>
                        {
                          exit.userName
                        }
                      </td>

                      <td>

                        <div className="actions">

                          <button
                            title="Visualizar"
                            onClick={() =>
                              setViewExit(
                                exit
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

        <ExitModal
          products={
            products
          }
          busy={busy}
          onSave={
            createExit
          }
          close={() =>
            setCreating(false)
          }
        />

      )}

      {viewExit && (

        <ViewExit
          exit={
            viewExit
          }
          close={() =>
            setViewExit(null)
          }
        />

      )}

    </div>
  );
}

function ExitModal({
  products,
  busy,
  onSave,
  close,
}) {
  const [form, setForm] =
    useState({
      productId: "",
      quantity: "",
      reason: "",
      destination: "",
      document: "",
      movementDate:
        getToday(),
      notes: "",
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
        ) - quantity
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
      Number(
        form.quantity
      ) <= 0
    ) {
      setFormError(
        "Informe uma quantidade maior que zero."
      );

      return;
    }

    if (
      selectedProduct &&
      Number(
        form.quantity
      ) >
        Number(
          selectedProduct.stock
        )
    ) {
      setFormError(
        `Estoque insuficiente. Existem apenas ${selectedProduct.stock} ${selectedProduct.unit} disponíveis.`
      );

      return;
    }

    if (
      !form.reason.trim()
    ) {
      setFormError(
        "Informe o motivo da saída."
      );

      return;
    }

    if (
      !form.movementDate
    ) {
      setFormError(
        "Informe a data da saída."
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

        reason:
          form.reason.trim(),

        destination:
          form.destination.trim(),

        document:
          form.document.trim(),

        movementDate:
          form.movementDate,

        notes:
          form.notes.trim(),
      });

      close();
    } catch (err) {
      setFormError(
        err.message ||
          "Não foi possível registrar a saída."
      );
    }
  }

  return (
    <div
      className="backdrop"
      onMouseDown={
        close
      }
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
              Nova saída
            </h2>

          </div>

          <button
            type="button"
            className="close"
            onClick={
              close
            }
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
                    disabled={
                      Number(
                        product.stock
                      ) <= 0
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
            label="Quantidade retirada"
            type="number"
            min="0.01"
            step="0.01"
            value={
              form.quantity
            }
            onChange={(
              value
            ) =>
              updateField(
                "quantity",
                value
              )
            }
          />

          <label>

            <span>
              Motivo da saída
            </span>

            <select
              value={
                form.reason
              }
              onChange={(
                event
              ) =>
                updateField(
                  "reason",
                  event.target
                    .value
                )
              }
            >

              <option value="">
                Selecione...
              </option>

              <option value="Produção">
                Produção
              </option>

              <option value="Venda">
                Venda
              </option>

              <option value="Consumo interno">
                Consumo interno
              </option>

              <option value="Perda">
                Perda
              </option>

              <option value="Avaria">
                Avaria
              </option>

              <option value="Devolução">
                Devolução
              </option>

              <option value="Transferência">
                Transferência
              </option>

              <option value="Outro">
                Outro
              </option>

            </select>

          </label>

          <Field
            label="Destino"
            value={
              form.destination
            }
            onChange={(
              value
            ) =>
              updateField(
                "destination",
                value
              )
            }
            placeholder="Ex.: Produção, setor A, cliente..."
          />

          <Field
            label="Documento"
            value={
              form.document
            }
            onChange={(
              value
            ) =>
              updateField(
                "document",
                value
              )
            }
            placeholder="Ex.: OS 245"
          />

          <Field
            label="Data da saída"
            type="date"
            value={
              form.movementDate
            }
            onChange={(
              value
            ) =>
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
            onChange={(
              value
            ) =>
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
              padding:
                "14px",
              border:
                "1px solid var(--border)",
              borderRadius:
                "12px",
            }}
          >

            <small className="muted">
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

              <strong
                className={
                  newStock < 0
                    ? "negative"
                    : ""
                }
              >
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
            {
              formError
            }
          </div>

        )}

        <footer>

          <button
            type="button"
            className="secondary"
            onClick={
              close
            }
            disabled={
              busy
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primary"
            disabled={
              busy
            }
          >
            {busy
              ? "Registrando..."
              : "Registrar saída"}
          </button>

        </footer>

      </form>

    </div>
  );
}

function ViewExit({
  exit,
  close,
}) {
  return (
    <div
      className="backdrop"
      onMouseDown={
        close
      }
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
              Saída de estoque
            </p>

            <h2>
              {
                exit.productName
              }
            </h2>

          </div>

          <button
            className="close"
            onClick={
              close
            }
          >
            <X />
          </button>

        </header>

        <div className="form">

          <ReadField
            label="Produto"
            value={
              exit.productName
            }
          />

          <ReadField
            label="SKU"
            value={
              exit.productSku
            }
          />

          <ReadField
            label="Quantidade"
            value={`-${exit.quantity} ${exit.unit}`}
          />

          <ReadField
            label="Estoque anterior"
            value={`${exit.previousStock} ${exit.unit}`}
          />

          <ReadField
            label="Estoque posterior"
            value={`${exit.newStock} ${exit.unit}`}
          />

          <ReadField
            label="Motivo"
            value={
              exit.reason
            }
          />

          <ReadField
            label="Destino"
            value={
              exit.destination
            }
          />

          <ReadField
            label="Documento"
            value={
              exit.document
            }
          />

          <ReadField
            label="Data"
            value={
              formatDate(
                exit.movementDate
              )
            }
          />

          <ReadField
            label="Responsável"
            value={
              exit.userName
            }
          />

          <ReadField
            label="Observação"
            value={
              exit.notes
            }
          />

        </div>

        <footer>

          <button
            className="primary"
            onClick={
              close
            }
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
        type={
          type
        }
        min={
          min
        }
        step={
          step
        }
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