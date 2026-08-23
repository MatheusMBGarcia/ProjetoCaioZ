import { useState } from "react";
import { Bell, Boxes, FileBarChart, History, LayoutDashboard, LogOut, Menu, Moon, Package, ShoppingCart, Sun, Truck, Users as UsersIcon, X, Zap, Scale } from "lucide-react";
import Products from "./pages/Products";
import StockComparison from "./pages/StockComparison";
import Categories from "./pages/Categories";
import Entries from "./pages/Entries";
import Exits from "./pages/Exits";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Login from "./pages/Login";
import { authService } from "./services/authService";
import { useDashboard } from "./hooks/useDashboard";

const ROLE_PERMISSIONS = {
  ADMIN: ["dashboard", "products", "comparison", "entries", "exits", "movements", "categories", "reports", "users"],
  GERENTE: ["dashboard", "products", "comparison", "entries", "exits", "movements", "categories", "reports"],
  FUNCIONARIO: ["dashboard", "products", "comparison", "entries", "exits", "movements", "categories"],
};

const nav = [
  ["Visão geral", [["dashboard", "Dashboard", LayoutDashboard]]],
  ["Estoque", [["products", "Produtos", Package], ["comparison", "Comparação de Estoque", Scale], ["entries", "Entradas", ShoppingCart], ["exits", "Saídas", Truck], ["movements", "Histórico", History]]],
  ["Cadastros", [["categories", "Categorias", Boxes]]],
  ["Gestão", [["reports", "Relatórios", FileBarChart], ["users", "Usuários", UsersIcon]]],
];

const canAccessPage = (page, role) => (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.FUNCIONARIO).includes(page);
const roleLabel = (role) => role === "ADMIN" ? "Administrador" : role === "GERENTE" ? "Gerente" : "Funcionário";
const getInitials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const visibleNav = currentUser ? nav.map(([group, items]) => [group, items.filter(([id]) => canAccessPage(id, currentUser.role))]).filter(([, items]) => items.length) : [];
  const effectivePage = currentUser && canAccessPage(page, currentUser.role) ? page : "dashboard";
  const currentPage = nav.flatMap((group) => group[1]).find(([id]) => id === effectivePage)?.[1] || "Dashboard";
  const logout = () => { authService.logout(); setCurrentUser(null); setPage("dashboard"); };

  if (!currentUser) return <Login onLogin={(user) => { setCurrentUser(user); setPage("dashboard"); }} />;

  return <div className={dark ? "app dark" : "app"}>
    <aside className={mobile ? "sidebar open" : "sidebar"}>
      <div className="brand"><div className="logo"><Zap size={20} /></div><div><b>ToolStock</b><small>Inventory system</small></div><button type="button" className="mobile-close" onClick={() => setMobile(false)}><X size={18} /></button></div>
      <nav>{visibleNav.map(([group, items]) => <section key={group}><small>{group}</small>{items.map(([id, label, Icon]) => <button type="button" key={id} className={effectivePage === id ? "nav active" : "nav"} onClick={() => { setPage(id); setMobile(false); }}><Icon size={18} /><span>{label}</span></button>)}</section>)}</nav>
      <div className="profile"><div>{getInitials(currentUser.name)}</div><span><b>{currentUser.name}</b><small>{roleLabel(currentUser.role)}</small></span><button type="button" title="Sair" onClick={logout} style={{ marginLeft: "auto" }}><LogOut size={16} /></button></div>
    </aside>
    {mobile && <div className="overlay" onClick={() => setMobile(false)} />}
    <div className="shell"><header><div className="left"><button className="menu" onClick={() => setMobile(true)}><Menu /></button><span>ToolStock</span><i>/</i><b>{currentPage}</b></div><div className="right"><div className="top-search">⌕<input placeholder="Buscar no sistema..." /></div><button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button><button><Bell /></button><div className="avatar">{getInitials(currentUser.name)}</div></div></header>
      <main>
        {effectivePage === "dashboard" && <Dashboard currentUser={currentUser} onNewMovement={() => setPage("entries")} />}
        {effectivePage === "products" && <Products />}
        {effectivePage === "comparison" && <StockComparison />}
        {effectivePage === "entries" && <Entries />}
        {effectivePage === "exits" && <Exits />}
        {effectivePage === "movements" && <Movements />}
        {effectivePage === "categories" && <Categories />}
        {effectivePage === "reports" && <Reports />}
        {effectivePage === "users" && <Users />}
      </main>
    </div>
  </div>;
}

function Dashboard({ currentUser, onNewMovement }) {
  const { stats, lowStockProducts, topDistributed, recentMovements, loading, error } = useDashboard();
  if (loading) return <div className="panel state">Carregando dashboard...</div>;
  if (error) return <div className="panel state error">{error}</div>;
  const featured = topDistributed?.[0];
  return <div>
    <div className="heading"><div><p className="eyebrow">Resumo do estoque</p><h1>Olá, {currentUser.name} 👋</h1><p>Acompanhe os principais indicadores do seu estoque.</p></div><button className="primary" onClick={onNewMovement}><ShoppingCart size={17} />Nova movimentação</button></div>
    <div className="stats">{[[Package, "Total de produtos", stats.totalProducts, "Cadastrados"], [Boxes, "Estoque baixo", stats.lowStock, "Atenção"], [Zap, "Sem estoque", stats.outOfStock, "Indisponíveis"], [ShoppingCart, "Valor do estoque", money(stats.stockValue), "Custo atual"]].map(([Icon, label, value, text], index) => <div className="stat panel" key={label}><div className={`stat-icon c${index}`}><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{text}</small></div></div>)}</div>
    <div className="grid two"><section className="panel"><div className="panel-head"><div><p className="eyebrow">Desempenho</p><h2>Produtos mais retirados</h2></div></div>{featured ? <div className="featured"><div><strong>{featured.name}</strong><p>{featured.quantity || 0} unidades distribuídas</p></div></div> : <div className="state">Nenhuma saída registrada ainda.</div>}</section><section className="panel"><div className="panel-head"><div><p className="eyebrow">Movimentações</p><h2>Últimas movimentações</h2></div></div>{recentMovements?.length ? <div className="scroll"><table><thead><tr><th>Item</th><th>Tipo</th><th>Quantidade</th></tr></thead><tbody>{recentMovements.slice(0, 5).map((item, index) => <tr key={item.id || index}><td>{item.productName || item.name || "Item"}</td><td>{item.type || "—"}</td><td>{item.quantity || 0}</td></tr>)}</tbody></table></div> : <div className="state">Nenhuma movimentação registrada.</div>}</section></div>
    <section className="panel" style={{ marginTop: 24 }}><div className="panel-head"><div><p className="eyebrow">Atenção</p><h2>Itens com estoque baixo</h2></div></div>{lowStockProducts?.length ? <div className="scroll"><table><thead><tr><th>Produto</th><th>Estoque</th><th>Mínimo</th></tr></thead><tbody>{lowStockProducts.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.stock}</td><td>{item.minimum}</td></tr>)}</tbody></table></div> : <div className="state">Nenhum item com estoque baixo.</div>}</section>
  </div>;
}
