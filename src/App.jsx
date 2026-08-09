import { useState } from "react";

import {
  Bell,
  Boxes,
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ShoppingCart,
  Sun,
  Truck,
  Users as UsersIcon,
  X,
  Zap,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Entries from "./pages/Entries";
import Exits from "./pages/Exits";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Login from "./pages/Login";

import { authService } from "./services/authService";
import { useDashboard } from "./hooks/useDashboard";

/*
|--------------------------------------------------------------------------
| PERMISSÕES
|--------------------------------------------------------------------------
|
| Nesta etapa o login é local. Depois essas regras também serão
| aplicadas no backend PHP/MySQL.
|
*/

const ROLE_PERMISSIONS = {
  ADMIN: [
    "dashboard",
    "products",
    "entries",
    "exits",
    "movements",
    "categories",
    "suppliers",
    "reports",
    "users",
  ],

  GERENTE: [
    "dashboard",
    "products",
    "entries",
    "exits",
    "movements",
    "categories",
    "suppliers",
    "reports",
  ],

  FUNCIONARIO: [
    "dashboard",
    "products",
    "entries",
    "exits",
    "movements",
    "categories",
  ],
};

function canAccessPage(
  page,
  role
) {
  return (
    ROLE_PERMISSIONS[role] ||
    ROLE_PERMISSIONS.FUNCIONARIO
  ).includes(page);
}

function roleLabel(role) {
  if (role === "ADMIN") {
    return "Administrador";
  }

  if (role === "GERENTE") {
    return "Gerente";
  }

  return "Funcionário";
}

/*
|--------------------------------------------------------------------------
| MENU
|--------------------------------------------------------------------------
*/

const nav = [
  [
    "Visão geral",
    [
      ["dashboard", "Dashboard", LayoutDashboard],
    ],
  ],

  [
    "Estoque",
    [
      ["products", "Produtos", Package],
      ["entries", "Entradas", ShoppingCart],
      ["exits", "Saídas", Truck],
      ["movements", "Histórico", History],
    ],
  ],

  [
    "Cadastros",
    [
      ["categories", "Categorias", Boxes],
      ["suppliers", "Fornecedores", UsersIcon],
    ],
  ],

  [
    "Gestão",
    [
      ["reports", "Relatórios", FileBarChart],
      ["users", "Usuários", UsersIcon],
    ],
  ],
];

/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

export default function App() {
  const [currentUser, setCurrentUser] = useState(() =>
    authService.getCurrentUser()
  );

  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);

  const visibleNav = currentUser
    ? nav
        .map(([group, items]) => [
          group,
          items.filter(([id]) =>
            canAccessPage(
              id,
              currentUser.role
            )
          ),
        ])
        .filter(([, items]) => items.length > 0)
    : [];

  const effectivePage =
    currentUser &&
    canAccessPage(
      page,
      currentUser.role
    )
      ? page
      : "dashboard";

  const currentPage =
    nav
      .flatMap((group) => group[1])
      .find(
        (item) => item[0] === effectivePage
      )?.[1] || "Dashboard";

  function handleLogin(user) {
    setCurrentUser(user);
    setPage("dashboard");
    setMobile(false);
  }

  function handleLogout() {
    authService.logout();
    setCurrentUser(null);
    setPage("dashboard");
    setMobile(false);
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={dark ? "app dark" : "app"}>

      {/* SIDEBAR */}

      <aside
        className={
          mobile
            ? "sidebar open"
            : "sidebar"
        }
      >

        {/* MARCA */}

        <div className="brand">

          <div className="logo">
            <Zap size={20} />
          </div>

          <div>
            <b>ToolStock</b>

            <small>
              Inventory system
            </small>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() =>
              setMobile(false)
            }
          >
            <X size={18} />
          </button>

        </div>

        {/* NAVEGAÇÃO */}

        <nav>

          {visibleNav.map(
            ([group, items]) => (

              <section key={group}>

                <small>
                  {group}
                </small>

                {items.map(
                  ([
                    id,
                    label,
                    Icon,
                  ]) => (

                    <button
                      type="button"
                      key={id}
                      className={
                        effectivePage === id
                          ? "nav active"
                          : "nav"
                      }
                      onClick={() => {
                        setPage(id);
                        setMobile(false);
                      }}
                    >

                      <Icon size={18} />

                      <span>
                        {label}
                      </span>

                    </button>

                  )
                )}

              </section>

            )
          )}

        </nav>

        {/* PERFIL */}

        <div className="profile">

          <div>
            {getInitials(
              currentUser.name
            )}
          </div>

          <span>

            <b>
              {currentUser.name}
            </b>

            <small>
              {roleLabel(
                currentUser.role
              )}
            </small>

          </span>

          <button
            type="button"
            title="Sair"
            onClick={handleLogout}
            style={{
              marginLeft: "auto",
              display: "grid",
              placeItems: "center",
              width: "32px",
              height: "32px",
              padding: 0,
              border: 0,
              borderRadius: "8px",
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
              opacity: 0.75,
            }}
          >
            <LogOut size={16} />
          </button>

        </div>

      </aside>

      {/* OVERLAY MOBILE */}

      {mobile && (
        <div
          className="overlay"
          onClick={() =>
            setMobile(false)
          }
        />
      )}

      {/* ÁREA PRINCIPAL */}

      <div className="shell">

        {/* CABEÇALHO */}

        <header>

          <div className="left">

            <button
              className="menu"
              onClick={() =>
                setMobile(true)
              }
            >
              <Menu />
            </button>

            <span>
              ToolStock
            </span>

            <i>/</i>

            <b>
              {currentPage}
            </b>

          </div>

          <div className="right">

            {/* BUSCA SUPERIOR */}

            <div className="top-search">
              ⌕

              <input
                placeholder="Buscar no sistema..."
              />
            </div>

            {/* DARK MODE */}

            <button
              onClick={() =>
                setDark(!dark)
              }
            >
              {dark ? (
                <Sun />
              ) : (
                <Moon />
              )}
            </button>

            {/* NOTIFICAÇÕES */}

            <button>
              <Bell />
            </button>

            {/* AVATAR */}

            <div className="avatar">
              {getInitials(
                currentUser.name
              )}
            </div>

          </div>

        </header>

        {/* PÁGINAS */}

        <main>

          {effectivePage === "dashboard" ? (

            <Dashboard
              currentUser={currentUser}
              onNewMovement={() =>
                setPage("entries")
              }
            />

          ) : effectivePage === "products" ? (

            <Products />

          ) : effectivePage === "entries" ? (

            <Entries />

          ) : effectivePage === "exits" ? (

            <Exits />

          ) : effectivePage === "movements" ? (

            <Movements />

          ) : effectivePage === "categories" ? (

            <Categories />

          ) : effectivePage === "suppliers" ? (

            <Suppliers />

          ) : effectivePage === "reports" ? (

            <Reports />

          ) : effectivePage === "users" ? (

            <Users />

          ) : (

            <Placeholder
              title={currentPage}
            />

          )}

        </main>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

function Dashboard({
  currentUser,
  onNewMovement,
}) {
  const {
    stats,
    lowStockProducts,
    movementData,
    topDistributed,
    recentMovements,
    loading,
    error,
  } = useDashboard();

  /*
  |--------------------------------------------------------------------------
  | CARREGANDO
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div>

        <div className="heading">

          <div>

            <p className="eyebrow">
              Resumo do estoque
            </p>

            <h1>
              Dashboard
            </h1>

            <p>
              Carregando informações do estoque...
            </p>

          </div>

        </div>

        <div className="panel state">
          Carregando dashboard...
        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERRO
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="panel state error">
        {error}
      </div>
    );
  }

  const featured =
    topDistributed[0];

  return (
    <div>

      {/* CABEÇALHO */}

      <div className="heading">

        <div>

          <p className="eyebrow">
            Resumo do estoque
          </p>

          <h1>
            Olá, {currentUser.name} 👋
          </h1>

          <p>
            Acompanhe os principais indicadores do seu estoque.
          </p>

        </div>

        <button
          className="primary"
          onClick={
            onNewMovement
          }
        >
          <ShoppingCart
            size={17}
          />

          Nova movimentação
        </button>

      </div>

      {/* CARDS */}

      <div className="stats">

        {[
          [
            Package,
            "Total de produtos",
            stats.totalProducts,
            "Cadastrados",
          ],

          [
            Boxes,
            "Estoque baixo",
            stats.lowStock,
            "Atenção",
          ],

          [
            Zap,
            "Sem estoque",
            stats.outOfStock,
            "Indisponíveis",
          ],

          [
            ShoppingCart,
            "Valor do estoque",
            money(
              stats.stockValue
            ),
            "Custo atual",
          ],
        ].map(
          (
            [
              Icon,
              label,
              value,
              text,
            ],
            index
          ) => (

            <div
              className="stat panel"
              key={label}
            >

              <div
                className={`stat-icon c${index}`}
              >
                <Icon size={20} />
              </div>

              <div>

                <span>
                  {label}
                </span>

                <strong>
                  {value}
                </strong>

                <small>
                  {text}
                </small>

              </div>

            </div>

          )
        )}

      </div>

      {/* GRÁFICO E RANKING */}

      <div className="grid two">

        {/* GRÁFICO */}

        <section className="panel chart">

          <div className="panel-head">

            <div>

              <p className="eyebrow">
                Movimentação
              </p>

              <h2>
                Entradas e saídas
              </h2>

            </div>

            <div className="secondary">
              Últimos 6 meses
            </div>

          </div>

          <div className="legend">

            <span>
              ● Entradas
            </span>

            <span>
              ● Saídas
            </span>

          </div>

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart
                data={movementData}
              >

                <CartesianGrid
                  strokeDasharray="4 5"
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="entries"
                  name="Entradas"
                  stroke="#8b5cf6"
                  fill="#8b5cf622"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="exits"
                  name="Saídas"
                  stroke="#ec4899"
                  fill="#ec489922"
                  strokeWidth={2}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* MAIS RETIRADOS */}

        <section className="panel">

          <div className="panel-head">

            <div>

              <p className="eyebrow">
                Desempenho
              </p>

              <h2>
                Produtos mais retirados
              </h2>

            </div>

          </div>

          {!featured ? (

            <div className="state">
              Nenhuma saída registrada ainda.
            </div>

          ) : (

            <>

              <div className="featured">

                <div className="big-thumb">

                  {getInitials(
                    featured.productName
                  )}

                </div>

                <div>

                  <strong>
                    {
                      featured.productName
                    }
                  </strong>

                  <span>
                    {
                      featured.productSku
                    }
                  </span>

                  <div className="bar">
                    <i />
                  </div>

                  <small>

                    {
                      featured.quantity
                    }{" "}

                    {
                      featured.unit
                    }{" "}

                    retirados

                  </small>

                </div>

              </div>

              {topDistributed
                .slice(1, 4)
                .map(
                  (
                    product,
                    index
                  ) => (

                    <div
                      className="rank"
                      key={
                        product.productId ||
                        product.productSku ||
                        product.productName
                      }
                    >

                      <b>
                        0
                        {
                          index + 2
                        }
                      </b>

                      <span>
                        {
                          product.productName
                        }
                      </span>

                      <small>

                        {
                          product.quantity
                        }{" "}

                        {
                          product.unit
                        }

                      </small>

                    </div>

                  )
                )}

            </>

          )}

        </section>

      </div>

      {/* ESTOQUE BAIXO E RECENTES */}

      <div className="grid two">

        {/* ESTOQUE BAIXO */}

        <section className="panel">

          <div className="panel-head">

            <div>

              <p className="eyebrow">
                Atenção
              </p>

              <h2>
                Estoque abaixo do mínimo
              </h2>

            </div>

          </div>

          {lowStockProducts.length === 0 ? (

            <div className="state">
              Nenhum produto com estoque baixo.
            </div>

          ) : (

            lowStockProducts.map(
              (product) => (

                <div
                  className="list-row"
                  key={product.id}
                >

                  <div className="thumb">

                    {product.short ||
                      getInitials(
                        product.name
                      )}

                  </div>

                  <span>

                    <b>
                      {
                        product.name
                      }
                    </b>

                    <small>

                      {
                        product.sku
                      }

                      {product.location
                        ? ` · ${product.location}`
                        : ""}

                    </small>

                  </span>

                  <strong>

                    {
                      product.stock
                    }

                    <small>

                      {" "}
                      /{" "}
                      {
                        product.minimum
                      }

                    </small>

                  </strong>

                  <em>
                    Baixo
                  </em>

                </div>

              )
            )

          )}

        </section>

        {/* MOVIMENTAÇÕES RECENTES */}

        <section className="panel">

          <div className="panel-head">

            <div>

              <p className="eyebrow">
                Últimas ações
              </p>

              <h2>
                Movimentações recentes
              </h2>

            </div>

          </div>

          {recentMovements.length === 0 ? (

            <div className="state">
              Nenhuma movimentação registrada.
            </div>

          ) : (

            recentMovements.map(
              (movement) => {

                const isEntry =
                  movement.type ===
                  "ENTRADA";

                return (

                  <div
                    className="list-row"
                    key={movement.id}
                  >

                    <div
                      className={
                        "move " +
                        (
                          isEntry
                            ? "green"
                            : "pink"
                        )
                      }
                    >
                      {isEntry
                        ? "+"
                        : "−"}
                    </div>

                    <span>

                      <b>

                        {isEntry
                          ? "Entrada de estoque"
                          : "Saída de estoque"}

                      </b>

                      <small>
                        {
                          movement.productName
                        }
                      </small>

                    </span>

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

                  </div>

                );
              }
            )

          )}

        </section>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PLACEHOLDER
|--------------------------------------------------------------------------
*/

function Placeholder({
  title = "Módulo",
}) {
  return (
    <div className="placeholder">

      <div className="placeholder-icon">
        <Package />
      </div>

      <p className="eyebrow">
        ToolStock
      </p>

      <h1>
        {title}
      </h1>

      <p>
        Esta tela será construída na próxima etapa.
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| FORMATAÇÃO DE DINHEIRO
|--------------------------------------------------------------------------
*/

function money(value) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );
}

/*
|--------------------------------------------------------------------------
| INICIAIS
|--------------------------------------------------------------------------
*/

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
    return "PR";
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