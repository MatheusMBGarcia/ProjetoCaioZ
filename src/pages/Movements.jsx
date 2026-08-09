import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Filter,
  History,
  Search,
  X,
} from "lucide-react";

import { useMovements } from "../hooks/useMovements";

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

function formatDateTime(date) {
  if (!date) {
    return "—";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(value);
}

export default function Movements() {
  const {
    movements,
    loading,
    error,
  } = useMovements();

  const [query, setQuery] =
    useState("");

  const [type, setType] =
    useState("TODAS");

  const [
    selectedMovement,
    setSelectedMovement,
  ] = useState(null);

  const filtered = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return movements.filter(
      (movement) => {
        const matchesSearch =
          movement.productName
            .toLowerCase()
            .includes(search) ||

          movement.productSku
            .toLowerCase()
            .includes(search) ||

          movement.userName
            .toLowerCase()
            .includes(search) ||

          movement.supplierName
            .toLowerCase()
            .includes(search) ||

          movement.destination
            .toLowerCase()
            .includes(search) ||

          movement.reason
            .toLowerCase()
            .includes(search) ||

          movement.document
            .toLowerCase()
            .includes(search);

        const matchesType =
          type === "TODAS" ||
          movement.type === type;

        return (
          matchesSearch &&
          matchesType
        );
      }
    );
  }, [
    movements,
    query,
    type,
  ]);

  const totalEntries =
    movements.filter(
      (movement) =>
        movement.type === "ENTRADA"
    ).length;

  const totalExits =
    movements.filter(
      (movement) =>
        movement.type === "SAIDA"
    ).length;

  return (
    <div>

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            Auditoria do estoque
          </p>

          <h1>
            Histórico
          </h1>

          <p>
            Consulte todas as entradas e saídas realizadas no estoque.
          </p>

        </div>

      </div>

      <div className="stats">

        <div className="stat panel">

          <div className="stat-icon c0">
            <History size={20} />
          </div>

          <div>

            <span>
              Movimentações
            </span>

            <strong>
              {movements.length}
            </strong>

            <small>
              Total registrado
            </small>

          </div>

        </div>

        <div className="stat panel">

          <div className="stat-icon c1">
            <ArrowDownToLine
              size={20}
            />
          </div>

          <div>

            <span>
              Entradas
            </span>

            <strong>
              {totalEntries}
            </strong>

            <small>
              Movimentações
            </small>

          </div>

        </div>

        <div className="stat panel">

          <div className="stat-icon c2">
            <ArrowUpFromLine
              size={20}
            />
          </div>

          <div>

            <span>
              Saídas
            </span>

            <strong>
              {totalExits}
            </strong>

            <small>
              Movimentações
            </small>

          </div>

        </div>

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
            placeholder="Buscar produto, SKU, responsável, motivo..."
          />

        </div>

        <label className="filter">

          <Filter size={15} />

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target.value
              )
            }
          >

            <option value="TODAS">
              Todas
            </option>

            <option value="ENTRADA">
              Entradas
            </option>

            <option value="SAIDA">
              Saídas
            </option>

          </select>

        </label>

      </div>

      <div className="panel table-panel">

        <div className="table-title">

          <strong>
            {filtered.length} movimentações
          </strong>

          <span>
            exibidas
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
            Nenhuma movimentação encontrada.
          </div>

        ) : (

          <div className="scroll">

            <table>

              <thead>

                <tr>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Saldo</th>
                  <th>Motivo / Origem</th>
                  <th>Data</th>
                  <th>Responsável</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (movement) => {

                    const isEntry =
                      movement.type ===
                      "ENTRADA";

                    return (

                      <tr
                        key={
                          movement.id
                        }
                      >

                        <td>

                          {isEntry ? (

                            <span className="badge ok">
                              Entrada
                            </span>

                          ) : (

                            <span className="badge out">
                              Saída
                            </span>

                          )}

                        </td>

                        <td>

                          <div className="product">

                            <b>

                              {isEntry ? (

                                <ArrowDownToLine
                                  size={18}
                                />

                              ) : (

                                <ArrowUpFromLine
                                  size={18}
                                />

                              )}

                            </b>

                            <div>

                              <strong>
                                {
                                  movement.productName
                                }
                              </strong>

                              <small>
                                {
                                  movement.productSku
                                }
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <strong
                            className={
                              isEntry
                                ? "positive"
                                : "negative"
                            }
                          >

                            {isEntry
                              ? "+"
                              : "-"}

                            {
                              movement.quantity
                            }{" "}

                            {
                              movement.unit
                            }

                          </strong>

                        </td>

                        <td>

                          <strong>
                            {
                              movement.previousStock
                            }
                          </strong>

                          <small className="muted">
                            {" "}
                            →{" "}
                            {
                              movement.newStock
                            }
                          </small>

                        </td>

                        <td>

                          {isEntry
                            ? movement.supplierName ||
                              movement.document ||
                              "Entrada de estoque"
                            : movement.reason ||
                              movement.destination ||
                              "Saída de estoque"}

                        </td>

                        <td>

                          {formatDate(
                            movement.movementDate
                          )}

                        </td>

                        <td>
                          {
                            movement.userName
                          }
                        </td>

                        <td>

                          <div className="actions">

                            <button
                              title="Visualizar"
                              onClick={() =>
                                setSelectedMovement(
                                  movement
                                )
                              }
                            >
                              <Eye
                                size={15}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {selectedMovement && (

        <MovementModal
          movement={
            selectedMovement
          }
          close={() =>
            setSelectedMovement(
              null
            )
          }
        />

      )}

    </div>
  );
}

function MovementModal({
  movement,
  close,
}) {
  const isEntry =
    movement.type ===
    "ENTRADA";

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
              Histórico de estoque
            </p>

            <h2>
              {isEntry
                ? "Entrada"
                : "Saída"}{" "}
              —{" "}
              {
                movement.productName
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
            label="Tipo"
            value={
              isEntry
                ? "Entrada"
                : "Saída"
            }
          />

          <ReadField
            label="Produto"
            value={
              movement.productName
            }
          />

          <ReadField
            label="SKU"
            value={
              movement.productSku
            }
          />

          <ReadField
            label="Quantidade"
            value={`${
              isEntry
                ? "+"
                : "-"
            }${movement.quantity} ${movement.unit}`}
          />

          <ReadField
            label="Estoque anterior"
            value={`${movement.previousStock} ${movement.unit}`}
          />

          <ReadField
            label="Estoque posterior"
            value={`${movement.newStock} ${movement.unit}`}
          />

          {isEntry ? (

            <ReadField
              label="Fornecedor"
              value={
                movement.supplierName
              }
            />

          ) : (

            <>
              <ReadField
                label="Motivo"
                value={
                  movement.reason
                }
              />

              <ReadField
                label="Destino"
                value={
                  movement.destination
                }
              />
            </>

          )}

          <ReadField
            label="Documento"
            value={
              movement.document
            }
          />

          <ReadField
            label="Data da movimentação"
            value={
              formatDate(
                movement.movementDate
              )
            }
          />

          <ReadField
            label="Responsável"
            value={
              movement.userName
            }
          />

          <ReadField
            label="Observação"
            value={
              movement.notes
            }
          />

          <ReadField
            label="Registrado no sistema"
            value={
              formatDateTime(
                movement.createdAt
              )
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