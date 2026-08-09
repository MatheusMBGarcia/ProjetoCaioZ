import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Download,
  FileBarChart,
  Filter,
  Package,
  Search,
  Wallet,
} from "lucide-react";

import { useReports } from "../hooks/useReports";

const money = (value) =>
  new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(Number(value || 0));

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parts =
    String(date).split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return `${day}/${month}/${year}`;
}

function escapeCsv(value) {
  const text =
    String(
      value ?? ""
    );

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
}

export default function Reports() {
  const {
    products,
    movements,
    loading,
    error,
  } = useReports();

  const [
    reportType,
    setReportType,
  ] = useState(
    "movements"
  );

  const [query, setQuery] =
    useState("");

  const [
    movementType,
    setMovementType,
  ] = useState("TODAS");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FILTRO DE MOVIMENTAÇÕES
  |--------------------------------------------------------------------------
  */

  const filteredMovements =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      return movements.filter(
        (movement) => {
          const productName =
            String(
              movement.productName ||
                ""
            ).toLowerCase();

          const productSku =
            String(
              movement.productSku ||
                ""
            ).toLowerCase();

          const userName =
            String(
              movement.userName ||
                ""
            ).toLowerCase();

          const reason =
            String(
              movement.reason ||
                ""
            ).toLowerCase();

          const supplier =
            String(
              movement.supplierName ||
                ""
            ).toLowerCase();

          const destination =
            String(
              movement.destination ||
                ""
            ).toLowerCase();

          const document =
            String(
              movement.document ||
                ""
            ).toLowerCase();

          const matchesSearch =
            productName.includes(
              search
            ) ||
            productSku.includes(
              search
            ) ||
            userName.includes(
              search
            ) ||
            reason.includes(
              search
            ) ||
            supplier.includes(
              search
            ) ||
            destination.includes(
              search
            ) ||
            document.includes(
              search
            );

          const matchesType =
            movementType ===
              "TODAS" ||
            movement.type ===
              movementType;

          const date =
            movement.movementDate ||
            "";

          const matchesStart =
            !startDate ||
            date >= startDate;

          const matchesEnd =
            !endDate ||
            date <= endDate;

          return (
            matchesSearch &&
            matchesType &&
            matchesStart &&
            matchesEnd
          );
        }
      );
    }, [
      movements,
      query,
      movementType,
      startDate,
      endDate,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FILTRO DE PRODUTOS
  |--------------------------------------------------------------------------
  */

  const filteredProducts =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          return (
            String(
              product.name ||
                ""
            )
              .toLowerCase()
              .includes(
                search
              ) ||

            String(
              product.sku ||
                ""
            )
              .toLowerCase()
              .includes(
                search
              ) ||

            String(
              product.category ||
                ""
            )
              .toLowerCase()
              .includes(
                search
              )
          );
        }
      );
    }, [
      products,
      query,
    ]);

  /*
  |--------------------------------------------------------------------------
  | INDICADORES
  |--------------------------------------------------------------------------
  */

  const stockValue =
    useMemo(() => {
      return products.reduce(
        (
          total,
          product
        ) => {
          return (
            total +
            Number(
              product.stock ||
                0
            ) *
              Number(
                product.cost ||
                  0
              )
          );
        },
        0
      );
    }, [products]);

  const lowStock =
    useMemo(() => {
      return products.filter(
        (product) =>
          Number(
            product.stock
          ) > 0 &&
          Number(
            product.stock
          ) <=
            Number(
              product.minimum
            )
      ).length;
    }, [products]);

  const totalEntries =
    useMemo(() => {
      return filteredMovements
        .filter(
          (movement) =>
            movement.type ===
            "ENTRADA"
        )
        .reduce(
          (
            total,
            movement
          ) =>
            total +
            Number(
              movement.quantity ||
                0
            ),
          0
        );
    }, [
      filteredMovements,
    ]);

  const totalExits =
    useMemo(() => {
      return filteredMovements
        .filter(
          (movement) =>
            movement.type ===
            "SAIDA"
        )
        .reduce(
          (
            total,
            movement
          ) =>
            total +
            Number(
              movement.quantity ||
                0
            ),
          0
        );
    }, [
      filteredMovements,
    ]);

  /*
  |--------------------------------------------------------------------------
  | EXPORTAR CSV
  |--------------------------------------------------------------------------
  */

  function exportCsv() {
    let rows = [];
    let filename = "";

    if (
      reportType ===
      "products"
    ) {
      filename =
        "relatorio_estoque.csv";

      rows = [
        [
          "SKU",
          "Produto",
          "Tipo",
          "Categoria",
          "Unidade",
          "Estoque",
          "Estoque mínimo",
          "Custo unitário",
          "Valor em estoque",
          "Localização",
          "Fornecedor",
          "Status",
        ],

        ...filteredProducts.map(
          (product) => {
            const stock =
              Number(
                product.stock ||
                  0
              );

            const minimum =
              Number(
                product.minimum ||
                  0
              );

            let status =
              "Normal";

            if (
              stock === 0
            ) {
              status =
                "Sem estoque";
            } else if (
              stock <= minimum
            ) {
              status =
                "Estoque baixo";
            }

            return [
              product.sku,
              product.name,
              product.type,
              product.category,
              product.unit,
              stock,
              minimum,
              Number(
                product.cost ||
                  0
              ),
              stock *
                Number(
                  product.cost ||
                    0
                ),
              product.location,
              product.supplier,
              status,
            ];
          }
        ),
      ];
    } else {
      filename =
        "relatorio_movimentacoes.csv";

      rows = [
        [
          "Tipo",
          "Data",
          "SKU",
          "Produto",
          "Quantidade",
          "Unidade",
          "Estoque anterior",
          "Estoque posterior",
          "Fornecedor",
          "Motivo",
          "Destino",
          "Documento",
          "Responsável",
          "Observação",
        ],

        ...filteredMovements.map(
          (movement) => [
            movement.type ===
            "ENTRADA"
              ? "Entrada"
              : "Saída",

            movement.movementDate,

            movement.productSku,

            movement.productName,

            movement.quantity,

            movement.unit,

            movement.previousStock,

            movement.newStock,

            movement.supplierName,

            movement.reason,

            movement.destination,

            movement.document,

            movement.userName,

            movement.notes,
          ]
        ),
      ];
    }

    if (
      rows.length <= 1
    ) {
      alert(
        "Não existem dados para exportar."
      );

      return;
    }

    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map(
              escapeCsv
            )
            .join(";")
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =
      filename;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LIMPAR FILTROS
  |--------------------------------------------------------------------------
  */

  function clearFilters() {
    setQuery("");
    setMovementType(
      "TODAS"
    );
    setStartDate("");
    setEndDate("");
  }

  if (loading) {
    return (
      <div className="panel state">
        Carregando relatórios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel state error">
        {error}
      </div>
    );
  }

  return (
    <div>

      {/* CABEÇALHO */}

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            Gestão e análise
          </p>

          <h1>
            Relatórios
          </h1>

          <p>
            Consulte e exporte informações do estoque e das movimentações.
          </p>

        </div>

        <button
          className="primary"
          onClick={
            exportCsv
          }
        >
          <Download
            size={17}
          />

          Exportar CSV
        </button>

      </div>

      {/* INDICADORES */}

      <div className="stats">

        <div className="stat panel">

          <div className="stat-icon c0">
            <Package
              size={20}
            />
          </div>

          <div>

            <span>
              Produtos
            </span>

            <strong>
              {
                products.length
              }
            </strong>

            <small>
              Cadastrados
            </small>

          </div>

        </div>

        <div className="stat panel">

          <div className="stat-icon c1">
            <Boxes
              size={20}
            />
          </div>

          <div>

            <span>
              Estoque baixo
            </span>

            <strong>
              {lowStock}
            </strong>

            <small>
              Requer atenção
            </small>

          </div>

        </div>

        <div className="stat panel">

          <div className="stat-icon c2">
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
              No período filtrado
            </small>

          </div>

        </div>

        <div className="stat panel">

          <div className="stat-icon c3">
            <Wallet
              size={20}
            />
          </div>

          <div>

            <span>
              Valor do estoque
            </span>

            <strong>
              {money(
                stockValue
              )}
            </strong>

            <small>
              Pelo custo atual
            </small>

          </div>

        </div>

      </div>

      {/* SELETOR DE RELATÓRIO */}

      <div className="toolbar panel">

        <label className="filter">

          <FileBarChart
            size={15}
          />

          <select
            value={
              reportType
            }
            onChange={(
              event
            ) => {
              setReportType(
                event.target
                  .value
              );

              setQuery("");
            }}
          >

            <option value="movements">
              Movimentações
            </option>

            <option value="products">
              Estoque atual
            </option>

          </select>

        </label>

        <div className="search">

          <Search
            size={17}
          />

          <input
            value={
              query
            }
            onChange={(
              event
            ) =>
              setQuery(
                event.target
                  .value
              )
            }
            placeholder={
              reportType ===
              "movements"
                ? "Buscar produto, SKU, responsável..."
                : "Buscar produto, SKU ou categoria..."
            }
          />

        </div>

      </div>

      {/* FILTROS MOVIMENTAÇÃO */}

      {reportType ===
        "movements" && (

        <div className="toolbar panel">

          <label className="filter">

            <Filter
              size={15}
            />

            <select
              value={
                movementType
              }
              onChange={(
                event
              ) =>
                setMovementType(
                  event.target
                    .value
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

          <label className="filter">

            <span>
              De
            </span>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(
                event
              ) =>
                setStartDate(
                  event.target
                    .value
                )
              }
            />

          </label>

          <label className="filter">

            <span>
              Até
            </span>

            <input
              type="date"
              value={
                endDate
              }
              onChange={(
                event
              ) =>
                setEndDate(
                  event.target
                    .value
                )
              }
            />

          </label>

          <button
            className="secondary"
            onClick={
              clearFilters
            }
          >
            Limpar filtros
          </button>

        </div>

      )}

      {/* MOVIMENTAÇÕES */}

      {reportType ===
      "movements" ? (

        <div className="panel table-panel">

          <div className="table-title">

            <strong>
              {
                filteredMovements.length
              }{" "}
              movimentações
            </strong>

            <span>
              encontradas
            </span>

          </div>

          {filteredMovements.length ===
          0 ? (

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
                    <th>Origem / Motivo</th>
                    <th>Data</th>
                    <th>Responsável</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredMovements.map(
                    (
                      movement
                    ) => {

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

                            {
                              movement.previousStock
                            }

                            {" → "}

                            {
                              movement.newStock
                            }

                          </td>

                          <td>

                            {isEntry
                              ? movement.supplierName ||
                                movement.document ||
                                "Entrada"
                              : movement.reason ||
                                movement.destination ||
                                "Saída"}

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

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      ) : (

        /*
        |--------------------------------------------------------------------------
        | ESTOQUE ATUAL
        |--------------------------------------------------------------------------
        */

        <div className="panel table-panel">

          <div className="table-title">

            <strong>
              {
                filteredProducts.length
              }{" "}
              produtos
            </strong>

            <span>
              encontrados
            </span>

          </div>

          {filteredProducts.length ===
          0 ? (

            <div className="state">
              Nenhum produto encontrado.
            </div>

          ) : (

            <div className="scroll">

              <table>

                <thead>

                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th>Mínimo</th>
                    <th>Custo</th>
                    <th>Valor em estoque</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredProducts.map(
                    (
                      product
                    ) => {

                      const stock =
                        Number(
                          product.stock ||
                            0
                        );

                      const minimum =
                        Number(
                          product.minimum ||
                            0
                        );

                      const stockTotal =
                        stock *
                        Number(
                          product.cost ||
                            0
                        );

                      return (

                        <tr
                          key={
                            product.id
                          }
                        >

                          <td>

                            <div className="product">

                              <b>
                                {
                                  product.short
                                }
                              </b>

                              <div>

                                <strong>
                                  {
                                    product.name
                                  }
                                </strong>

                                <small>
                                  {
                                    product.sku
                                  }
                                </small>

                              </div>

                            </div>

                          </td>

                          <td>
                            {
                              product.category
                            }
                          </td>

                          <td>

                            <strong>
                              {stock}
                            </strong>

                            {" "}

                            {
                              product.unit
                            }

                          </td>

                          <td>

                            {minimum}{" "}

                            {
                              product.unit
                            }

                          </td>

                          <td>
                            {money(
                              product.cost
                            )}
                          </td>

                          <td>

                            <strong>
                              {money(
                                stockTotal
                              )}
                            </strong>

                          </td>

                          <td>

                            {stock ===
                            0 ? (

                              <span className="badge out">
                                Sem estoque
                              </span>

                            ) : stock <=
                              minimum ? (

                              <span className="badge low">
                                Estoque baixo
                              </span>

                            ) : (

                              <span className="badge ok">
                                Normal
                              </span>

                            )}

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

      )}

      {/* RESUMO DE ENTRADAS / SAÍDAS */}

      {reportType ===
        "movements" && (

        <div
          className="grid two"
          style={{
            marginTop:
              "18px",
          }}
        >

          <section className="panel">

            <div className="panel-head">

              <div>

                <p className="eyebrow">
                  Período filtrado
                </p>

                <h2>
                  Total de entradas
                </h2>

              </div>

            </div>

            <div
              style={{
                padding:
                  "10px 0 5px",
              }}
            >

              <strong
                className="positive"
                style={{
                  fontSize:
                    "28px",
                }}
              >
                +
                {
                  totalEntries
                }
              </strong>

              <p className="muted">
                Unidades movimentadas em entradas.
              </p>

            </div>

          </section>

          <section className="panel">

            <div className="panel-head">

              <div>

                <p className="eyebrow">
                  Período filtrado
                </p>

                <h2>
                  Total de saídas
                </h2>

              </div>

            </div>

            <div
              style={{
                padding:
                  "10px 0 5px",
              }}
            >

              <strong
                className="negative"
                style={{
                  fontSize:
                    "28px",
                }}
              >
                -
                {
                  totalExits
                }
              </strong>

              <p className="muted">
                Unidades movimentadas em saídas.
              </p>

            </div>

          </section>

        </div>

      )}

    </div>
  );
}