import { useState } from "react";
import { Bell, Boxes, ChevronDown, FileBarChart, LayoutDashboard, Menu, Moon, Package, Settings, ShoppingCart, Sun, Truck, Users, X, Zap } from "lucide-react";
import Products from "./pages/Products";
import { dashboardMock } from "./services/mock/dashboardMock";
import { productsMock } from "./services/mock/productsMock";
import { Area,AreaChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis } from "recharts";

const nav = [
  ["Visão geral", [["dashboard","Dashboard",LayoutDashboard]]],
  ["Estoque", [["products","Produtos",Package],["entries","Entradas",ShoppingCart],["exits","Saídas",Truck]]],
  ["Cadastros", [["categories","Categorias",Boxes],["suppliers","Fornecedores",Users]]],
  ["Gestão", [["reports","Relatórios",FileBarChart],["users","Usuários",Users]]]
];

export default function App(){
 const [page,setPage]=useState("dashboard"),[dark,setDark]=useState(false),[mobile,setMobile]=useState(false);
 return <div className={dark?"app dark":"app"}>
  <aside className={mobile?"sidebar open":"sidebar"}>
   <div className="brand"><div className="logo"><Zap size={20}/></div><div><b>ToolStock</b><small>Inventory system</small></div><button className="mobile-close" onClick={()=>setMobile(false)}><X/></button></div>
   <nav>{nav.map(([group,items])=><section key={group}><small>{group}</small>{items.map(([id,label,Icon])=><button key={id} className={page===id?"nav active":"nav"} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={18}/>{label}</button>)}</section>)}</nav>
   <div className="profile"><div>MG</div><span><b>Matheus Garcia</b><small>Administrador</small></span></div>
  </aside>
  {mobile&&<div className="overlay" onClick={()=>setMobile(false)}/>}
  <div className="shell">
   <header><div className="left"><button className="menu" onClick={()=>setMobile(true)}><Menu/></button><span>ToolStock</span><i>/</i><b>Gestão</b></div><div className="right"><div className="top-search">⌕ <input placeholder="Buscar no sistema..."/></div><button onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button><button><Bell/></button><div className="avatar">MG</div></div></header>
   <main>{page==="dashboard"?<Dashboard/>:page==="products"?<Products/>:<Placeholder title={nav.flatMap(x=>x[1]).find(x=>x[0]===page)?.[1]}/>}</main>
  </div>
 </div>
}
function Dashboard(){
 const s=dashboardMock.stats;
 return <div>
  <div className="heading"><div><p className="eyebrow">Resumo do estoque</p><h1>Olá, Matheus 👋</h1><p>Acompanhe os principais indicadores do seu estoque.</p></div><button className="primary"><ShoppingCart size={17}/> Nova movimentação</button></div>
  <div className="stats">{[[Package,"Total de produtos","1.248","+8,4%"],[Boxes,"Estoque baixo","37","Atenção"],[Zap,"Sem estoque","12","-3"],[ShoppingCart,"Valor do estoque",money(s.stockValue),"+5,7%"]].map(([I,l,v,t],i)=><div className="stat panel" key={l}><div className={"stat-icon c"+i}><I size={20}/></div><div><span>{l}</span><strong>{v}</strong><small>{t} <em>vs. mês anterior</em></small></div></div>)}</div>
  <div className="grid two"><section className="panel chart"><div className="panel-head"><div><p className="eyebrow">Movimentação</p><h2>Entradas e saídas</h2></div><button className="secondary">Últimos 6 meses <ChevronDown size={14}/></button></div><div className="legend"><span>● Entradas</span><span>● Saídas</span></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboardMock.movements}><CartesianGrid strokeDasharray="4 5" vertical={false} stroke="var(--border)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="entries" stroke="#8b5cf6" fill="#8b5cf622" strokeWidth={2}/><Area type="monotone" dataKey="exits" stroke="#ec4899" fill="#ec489922" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></section>
  <section className="panel"><div className="panel-head"><div><p className="eyebrow">Desempenho</p><h2>Produto mais distribuído</h2></div></div><div className="featured"><div className="big-thumb">FB</div><div><strong>Furadeira Bosch 500W</strong><span>Ferramentas Elétricas</span><div className="bar"><i/></div><small>187 unidades distribuídas</small></div></div>{productsMock.slice(1,4).map((p,i)=><div className="rank" key={p.id}><b>0{i+2}</b><span>{p.name}</span><small>{[143,119,96][i]} un.</small></div>)}</section></div>
  <div className="grid two"><section className="panel"><div className="panel-head"><div><p className="eyebrow">Atenção</p><h2>Estoque abaixo do mínimo</h2></div></div>{productsMock.filter(p=>p.stock>0&&p.stock<=p.minimum).map(p=><div className="list-row" key={p.id}><div className="thumb">{p.short}</div><span><b>{p.name}</b><small>{p.sku} · {p.location}</small></span><strong>{p.stock}<small> / {p.minimum}</small></strong><em>Baixo</em></div>)}</section><section className="panel"><div className="panel-head"><div><p className="eyebrow">Últimas ações</p><h2>Movimentações recentes</h2></div></div>{["Entrada de estoque","Saída de estoque","Entrada de estoque","Saída de estoque"].map((x,i)=><div className="list-row" key={i}><div className={"move "+(i%2?"pink":"green")}>{i%2?"−":"+"}</div><span><b>{x}</b><small>{i%2?"Alicate Universal":"Furadeira Bosch 500W"}</small></span><strong className={i%2?"negative":"positive"}>{i%2?"-":"+"}{i+5} un.</strong></div>)}</section></div>
 </div>
}
function Placeholder({title="Módulo"}){return <div className="placeholder"><div className="placeholder-icon"><Package/></div><p className="eyebrow">ToolStock</p><h1>{title}</h1><p>Esta tela será construída na próxima etapa.</p></div>}
function money(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v)}