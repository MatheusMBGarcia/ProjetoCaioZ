import { useMemo, useState } from "react";
import { Edit3, Eye, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useProducts } from "../hooks/useProducts";

const money = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

export default function Products() {
  const {products,loading,error} = useProducts();
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("Todas");
  const [modal,setModal] = useState(null);

  const categories = ["Todas", ...new Set(products.map(p => p.category))];
  const filtered = useMemo(() => products.filter(p =>
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())) &&
    (category === "Todas" || p.category === category)
  ),[products,query,category]);

  return <div>
    <div className="page-heading">
      <div><p className="eyebrow">Gestão de estoque</p><h1>Produtos</h1><p>Gerencie as ferramentas cadastradas no estoque.</p></div>
      <button className="primary" onClick={() => setModal({})}><Plus size={17}/> Novo produto</button>
    </div>
    <div className="toolbar panel">
      <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nome ou SKU..."/></div>
      <label className="filter"><Filter size={15}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
    </div>
    <div className="panel table-panel">
      <div className="table-title"><strong>{filtered.length} produtos</strong><span>exibidos</span></div>
      {loading ? <div className="state">Carregando...</div> : error ? <div className="state error">{error}</div> :
      <div className="scroll"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Venda</th><th>Localização</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      {filtered.map(p=><tr key={p.id}><td><div className="product"><b>{p.short}</b><div><strong>{p.name}</strong><small>{p.sku} · {p.brand}</small></div></div></td><td>{p.category}</td><td><strong>{p.stock}</strong><small className="muted"> mín. {p.minimum}</small></td><td>{money(p.sale)}</td><td>{p.location}</td><td><Status p={p}/></td><td><div className="actions"><button><Eye size={15}/></button><button onClick={()=>setModal(p)}><Edit3 size={15}/></button><button><Trash2 size={15}/></button></div></td></tr>)}
      </tbody></table></div>}
    </div>
    {modal !== null && <Modal product={modal.id ? modal : null} close={()=>setModal(null)}/>}
  </div>
}
function Status({p}) {
  if(p.stock===0) return <span className="badge out">Sem estoque</span>;
  if(p.stock<=p.minimum) return <span className="badge low">Estoque baixo</span>;
  return <span className="badge ok">Normal</span>;
}
function Modal({product,close}) {
  return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
    <header><div><p className="eyebrow">{product?"Editar":"Novo produto"}</p><h2>{product?.name || "Cadastrar ferramenta"}</h2></div><button className="close" onClick={close}><X/></button></header>
    <div className="form"><Field label="Código / SKU" value={product?.sku}/><Field label="Nome da ferramenta" value={product?.name}/><Field label="Categoria" value={product?.category}/><Field label="Marca" value={product?.brand}/><Field label="Modelo" value={product?.model}/><Field label="Localização" value={product?.location}/><Field label="Quantidade" value={product?.stock}/><Field label="Estoque mínimo" value={product?.minimum}/><Field label="Preço de custo" value={product?.cost}/><Field label="Preço de venda" value={product?.sale}/><Field label="Fornecedor" value={product?.supplier}/></div>
    <footer><button className="secondary" onClick={close}>Cancelar</button><button className="primary" onClick={close}>{product?"Salvar alterações":"Cadastrar produto"}</button></footer>
  </div></div>
}
function Field({label,value}) { return <label><span>{label}</span><input defaultValue={value || ""}/></label>; }