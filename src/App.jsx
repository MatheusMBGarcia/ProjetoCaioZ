import { useEffect, useMemo, useState } from "react";
import { Bell, Boxes, FileBarChart, History, LayoutDashboard, LogOut, Menu, Moon, Package, ShoppingCart, Sun, Users as UsersIcon, X, Zap, Scale, Search, Factory, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Products from "./pages/Products";
import StockComparison from "./pages/StockComparison";
import Categories from "./pages/Categories";
import Production from "./pages/Production";
import Entries from "./pages/Entries";
import Exits from "./pages/Exits";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Login from "./pages/Login";
import { authService } from "./services/authService";
import { productsService } from "./services/productsService";
import { useDashboard } from "./hooks/useDashboard";

const ROLE_PERMISSIONS = {
  ADMIN: ["dashboard", "products", "comparison", "entries", "exits", "movements", "categories", "production", "reports", "users"],
  GERENTE: ["dashboard", "products", "comparison", "entries", "exits", "movements", "categories", "production", "reports"],
  FUNCIONARIO: ["dashboard", "products", "comparison", "entries", "exits", "movements", "categories", "production"],
};

const nav = [
  ["Visão geral", [["dashboard", "Dashboard", LayoutDashboard]]],
  ["Estoque", [["products", "Produtos", Package], ["comparison", "Estoques", Scale], ["entries", "Entradas", ArrowDownToLine], ["exits", "Saídas", ArrowUpFromLine], ["movements", "Histórico", History]]],
  ["Produção", [["production", "Produção", Factory]]],
  ["Cadastros", [["categories", "Categorias", Boxes]]],
  ["Gestão", [["reports", "Relatórios", FileBarChart], ["users", "Usuários", UsersIcon]]],
];

const canAccessPage = (page, role) => (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.FUNCIONARIO).includes(page);
const roleLabel = (role) => role === "ADMIN" ? "Administrador" : role === "GERENTE" ? "Gerente" : "Funcionário";
const getInitials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => new Set());

  const loadStockAlerts = async () => {
    try {
      const products = await productsService.list();
      const alerts = products
        .map((p) => {
          const stock = Number(p.stock || 0);
          const minimum = Number(p.minimum || 0);
          if (stock === 0) return { ...p, alertType: "out", signature: `${p.id}:out:${minimum}` };
          if (minimum > 0 && stock <= minimum) return { ...p, alertType: "low", signature: `${p.id}:low:${stock}:${minimum}` };
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => (a.alertType === "out" ? -1 : 1) - (b.alertType === "out" ? -1 : 1) || Number(a.stock) - Number(b.stock));
      setStockAlerts(alerts);
    } catch (e) {
      console.error("Não foi possível atualizar as notificações", e);
    }
  };

  useEffect(() => {
    loadStockAlerts();
    const timer = setInterval(loadStockAlerts, 30000);
    return () => clearInterval(timer);
  }, []);

  const visibleStockAlerts = useMemo(() => stockAlerts.filter((item) => !dismissedAlerts.has(item.signature)), [stockAlerts, dismissedAlerts]);
  const notificationCount = visibleStockAlerts.length;
  const clearNotifications = () => setDismissedAlerts(new Set(stockAlerts.map((item) => item.signature)));

  const visibleNav = currentUser ? nav.map(([group, items]) => [group, items.filter(([id]) => canAccessPage(id, currentUser.role))]).filter(([, items]) => items.length) : [];
  const effectivePage = currentUser && canAccessPage(page, currentUser.role) ? page : "dashboard";
  const currentPage = nav.flatMap((group) => group[1]).find(([id]) => id === effectivePage)?.[1] || "Dashboard";
  const logout = () => { authService.logout(); setCurrentUser(null); setPage("dashboard"); };

  function submitSearch(event) {
    event.preventDefault();
    const term = search.trim().toLowerCase();
    if (!term) return;
    const found = nav.flatMap((group) => group[1]).find(([id, label]) => canAccessPage(id, currentUser.role) && (label.toLowerCase().includes(term) || id.includes(term)));
    if (found) { setPage(found[0]); setSearch(""); setNotificationsOpen(false); setProfileOpen(false); }
  }

  if (!currentUser) return <Login onLogin={(user) => { setCurrentUser(user); setPage("dashboard"); }} />;

  return <div className={dark ? "app dark" : "app"}>
    <aside className={mobile ? "sidebar open" : "sidebar"}>
      <div className="brand"><div className="logo"><Zap size={20} /></div><div><b>ToolStock</b><small>Inventory system</small></div><button type="button" className="mobile-close" onClick={() => setMobile(false)}><X size={18} /></button></div>
      <nav>{visibleNav.map(([group, items]) => <section key={group}><small>{group}</small>{items.map(([id, label, Icon]) => <button type="button" key={id} className={effectivePage === id ? "nav active" : "nav"} onClick={() => { setPage(id); setMobile(false); }}><Icon size={18} /><span>{label}</span></button>)}</section>)}</nav>
      <div className="profile"><div>{getInitials(currentUser.name)}</div><span><b>{currentUser.name}</b><small>{roleLabel(currentUser.role)}</small></span><button type="button" title="Sair" onClick={logout} style={{ marginLeft: "auto" }}><LogOut size={16} /></button></div>
    </aside>
    {mobile && <div className="overlay" onClick={() => setMobile(false)} />}
    <div className="shell"><header><div className="left"><button className="menu" onClick={() => setMobile(true)}><Menu /></button><span>ToolStock</span><i>/</i><b>{currentPage}</b></div><div className="right">
      <form className="top-search" onSubmit={submitSearch}><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar no sistema..." /></form>
      <button title={dark ? "Modo claro" : "Modo escuro"} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
      <div className="header-action"><button title="Notificações" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Bell />{notificationCount > 0 && <span className="notification-badge">{notificationCount > 9 ? "9+" : notificationCount}</span>}</button>{notificationsOpen && <NotificationPanel alerts={visibleStockAlerts} onClear={clearNotifications} onOpenProducts={() => { setPage("products"); setNotificationsOpen(false); }} />}</div>
      <div className="header-action"><button className="avatar" title="Perfil" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}>{getInitials(currentUser.name)}</button>{profileOpen && <div className="header-dropdown profile-dropdown"><div className="profile-dropdown-user"><div className="profile-dropdown-avatar">{getInitials(currentUser.name)}</div><div><strong>{currentUser.name}</strong><small>{roleLabel(currentUser.role)}</small></div></div><div className="dropdown-divider" /><button className="dropdown-action" onClick={logout}><LogOut size={17} />Sair do sistema</button></div>}</div>
    </div></header>
      <main>
        {effectivePage === "dashboard" && <Dashboard currentUser={currentUser} onNewMovement={() => setPage("entries")} />}
        {effectivePage === "products" && <Products />}
        {effectivePage === "comparison" && <StockComparison />}
        {effectivePage === "entries" && <Entries />}
        {effectivePage === "exits" && <Exits />}
        {effectivePage === "movements" && <Movements />}
        {effectivePage === "categories" && <Categories />}
        {effectivePage === "production" && <Production />}
        {effectivePage === "reports" && <Reports />}
        {effectivePage === "users" && <Users currentUser={currentUser} />}
      </main>
    </div>
  </div>;
}

function NotificationPanel({ alerts, onClear, onOpenProducts }) {
  return <div className="header-dropdown notification-dropdown">
    <div className="notification-head">
      <div><strong>Notificações</strong><small>{alerts.length} {alerts.length === 1 ? "alerta de estoque" : "alertas de estoque"}</small></div>
      {alerts.length > 0 && <button type="button" className="notification-clear" onClick={onClear}>Limpar</button>}
    </div>
    {alerts.length ? <div className="notification-list">
      <div className="notification-section-title"><span className="notification-section-icon">!</span><strong>Estoque</strong></div>
      {alerts.map((item) => <div className={`notification-card ${item.alertType === "out" ? "out" : "low"}`} key={item.signature}>
        <div className="notification-card-icon">{item.alertType === "out" ? "0" : "↓"}</div>
        <div className="notification-card-main">
          <strong>{item.name}</strong>
          <span>{item.alertType === "out" ? "Sem estoque" : "Estoque baixo"}</span>
        </div>
        <div className="notification-stock"><small>Estoque atual</small><strong>{item.stock} {item.unit}</strong></div>
        <div className="notification-stock"><small>Estoque mínimo</small><strong>{item.minimum} {item.unit}</strong></div>
        <button type="button" className="notification-view" onClick={onOpenProducts}>Ver produto</button>
      </div>)}
    </div> : <div className="notification-empty-state"><span className="notification-ok">✓</span><div><strong>Tudo em ordem</strong><small>Nenhum produto está abaixo do estoque mínimo.</small></div></div>}
    <div className="notification-footer"><span>Os alertas são atualizados automaticamente.</span><span>Atualizado agora</span></div>
  </div>;
}

function Dashboard({ currentUser, onNewMovement }) {
  const { stats, lowStockProducts, topDistributed, recentMovements, loading, error } = useDashboard();
  if (loading) return <div className="panel state">Carregando dashboard...</div>;
  if (error) return <div className="panel state error">{error}</div>;
  const featured = topDistributed?.[0];
  return <div>
    <div className="heading"><div><p className="eyebrow">Resumo do estoque</p><h1>Olá, {currentUser.name} 👋</h1><p>Acompanhe os principais indicadores do seu estoque.</p></div><button className="primary" onClick={onNewMovement}><ShoppingCart size={17} />Nova movimentação</button></div>
    <section className="panel dashboard-summary dashboard-financial"><div className="panel-head"><div><p className="eyebrow">Visão financeira</p><h2>Valor total do estoque</h2></div></div><strong className="dashboard-value">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(stats.stockValue || 0))}</strong><div className="stock-split"><div><span>Uso interno</span><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(stats.internalValue || 0))}</strong></div><div><span>Para venda</span><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(stats.saleValue || 0))}</strong></div></div></section>
    <div className="stats"><DashboardStat icon={Package} label="Produtos" value={stats.totalProducts} text="Cadastrados" /><DashboardStat icon={Boxes} label="Estoque interno" value={stats.internalProducts} text={`${stats.internalQuantity} unidades`} /><DashboardStat icon={ShoppingCart} label="Produtos para venda" value={stats.saleProducts} text={`${stats.saleQuantity} unidades`} /><DashboardStat icon={Zap} label="Estoque baixo" value={stats.lowStock} text="Atenção" /><DashboardStat icon={Boxes} label="Sem estoque" value={stats.outOfStock} text="Indisponíveis" /></div>
    <div className="grid two"><section className="panel"><div className="panel-head"><div><p className="eyebrow">Movimentações</p><h2>Últimas movimentações</h2></div></div>{recentMovements?.length ? <div className="scroll"><table><thead><tr><th>Item</th><th>Tipo</th><th>Quantidade</th><th>Data</th></tr></thead><tbody>{recentMovements.slice(0, 5).map((item, index) => <tr key={item.id || index}><td>{item.productName || "Item"}</td><td>{item.type === "ENTRADA" ? "Entrada" : "Saída"}</td><td>{item.quantity || 0} {item.unit || "un"}</td><td>{formatDate(item.movementDate)}</td></tr>)}</tbody></table></div> : <div className="state">Nenhuma movimentação registrada.</div>}</section>
    <section className="panel" style={{ marginTop: 24 }}><div className="panel-head"><div><p className="eyebrow">Atenção</p><h2>Itens com estoque baixo</h2></div></div>{lowStockProducts?.length ? <div className="scroll"><table><thead><tr><th>Produto</th><th>Estoque</th><th>Mínimo</th><th>Destino</th></tr></thead><tbody>{lowStockProducts.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.stock} {item.unit}</td><td>{item.minimum} {item.unit}</td><td>{item.stockCategory === "sale" ? "Para venda" : "Uso interno"}</td></tr>)}</tbody></table></div> : <div className="state">Nenhum item com estoque baixo.</div>}</section>
    </div>
  </div>;
}
function DashboardStat(props) { const Icon = props.icon; const label = props.label; const value = props.value; const text = props.text; return <div className="stat panel"><div className="stat-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{text}</small></div></div>; }
function formatDate(value) { const s = String(value || "").slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—"; const [y,m,d]=s.split("-"); return `${d}/${m}/${y}`; }
