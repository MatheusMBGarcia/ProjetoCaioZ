import { useMemo, useState } from "react";
import { Edit3, Eye, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useProducts } from "../hooks/useProducts";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const emptyProduct = { name: "", stockCategory: "internal", type: "Matéria-prima", category: "", unit: "un", brand: "", model: "", stock: 0, minimum: 0, cost: 0, sale: 0 };
const isForSale = (product) => product.stockCategory === "sale" || Number(product.sale) > 0;

export default function Products() {
  const { products, loading, busy, error, createProduct, updateProduct, removeProduct } = useProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [creating, setCreating] = useState(false);

  const categories = ["Todas", ...new Set(products.map((product) => product.category).filter(Boolean))];
  const filtered = useMemo(() => products.filter((product) => {
    const matchesName = String(product.name || "").toLowerCase().includes(query.trim().toLowerCase());
    const matchesCategory = category === "Todas" || product.category === category;
    return matchesName && matchesCategory;
  }), [products, query, category]);

  async function handleDelete(product) {
    if (!window.confirm(`Deseja realmente excluir "${product.name}"?`)) return;
    try { await removeProduct(product.id); } catch { alert("Não foi possível excluir o produto."); }
  }

  return <div>
    <div className="page-heading"><div><p className="eyebrow">Gestão de estoque</p><h1>Produtos</h1><p>Gerencie materiais e produtos cadastrados no estoque.</p></div><button className="primary" onClick={() => setCreating(true)}><Plus size={17} />Novo produto</button></div>
    <div className="toolbar panel"><div className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome..." /></div><label className="filter"><Filter size={15} /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="panel table-panel"><div className="table-title"><strong>{filtered.length} produtos</strong><span> exibidos</span></div>
      {loading ? <div className="state">Carregando...</div> : error ? <div className="state error">{error}</div> : filtered.length === 0 ? <div className="state">Nenhum produto encontrado.</div> : <div className="scroll"><table><thead><tr><th>Produto</th><th>Destino</th><th>Tipo</th><th>Categoria</th><th>Estoque</th><th>Custo</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="product"><b>{product.short || product.name?.slice(0, 2).toUpperCase()}</b><div><strong>{product.name}</strong><small>{product.brand || "Sem marca"}{product.model ? ` · ${product.model}` : ""}</small></div></div></td><td>{isForSale(product) ? "Para venda" : "Uso interno"}</td><td>{product.type || "Material"}</td><td>{product.category || "—"}</td><td><strong>{product.stock}</strong><small className="muted">mín. {product.minimum} {product.unit || "un"}</small></td><td>{money(product.cost)}</td><td><Status product={product} /></td><td><div className="actions"><button title="Visualizar" onClick={() => setViewProduct(product)}><Eye size={15} /></button><button title="Editar" onClick={() => setEditingProduct(product)}><Edit3 size={15} /></button><button title="Excluir" onClick={() => handleDelete(product)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    </div>
    {creating && <ProductModal product={null} busy={busy} onSave={createProduct} close={() => setCreating(false)} />}
    {editingProduct && <ProductModal product={editingProduct} busy={busy} onSave={(data) => updateProduct(editingProduct.id, data)} close={() => setEditingProduct(null)} />}
    {viewProduct && <ViewModal product={viewProduct} close={() => setViewProduct(null)} />}
  </div>;
}

function Status({ product }) {
  if (Number(product.stock) === 0) return <span className="badge out">Sem estoque</span>;
  if (Number(product.stock) <= Number(product.minimum)) return <span className="badge low">Estoque baixo</span>;
  return <span className="badge ok">Normal</span>;
}

function ProductModal({ product, busy, onSave, close }) {
  const [form, setForm] = useState(product ? { ...emptyProduct, ...product, stockCategory: product.stockCategory || (Number(product.sale) > 0 ? "sale" : "internal") } : emptyProduct);
  const [formError, setFormError] = useState("");
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim()) return setFormError("Informe o nome do produto.");
    if (!form.category.trim()) return setFormError("Informe a categoria.");
    if (!form.unit.trim()) return setFormError("Informe a unidade de medida.");
    const data = { ...form, stock: Number(form.stock || 0), minimum: Number(form.minimum || 0), cost: Number(form.cost || 0), sale: form.stockCategory === "sale" ? Number(form.sale || 0) : 0 };
    if ([data.stock, data.minimum, data.cost, data.sale].some((value) => value < 0)) return setFormError("Os valores não podem ser negativos.");
    try { await onSave(data); close(); } catch (error) { setFormError(error.message || "Não foi possível salvar o produto."); }
  }

  return <div className="backdrop" onMouseDown={close}><form className="modal" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{product ? "Editar produto" : "Novo produto"}</p><h2>{product?.name || "Cadastrar produto"}</h2></div><button type="button" className="close" onClick={close}><X /></button></header><div className="form">
    <Field label="Nome do item" value={form.name} onChange={(value) => updateField("name", value)} />
    <SelectField label="Destino do material" value={form.stockCategory} onChange={(value) => updateField("stockCategory", value)} options={[["internal", "Uso interno / não será vendido"], ["sale", "Material para venda"]]} />
    <Field label="Tipo" value={form.type} onChange={(value) => updateField("type", value)} />
    <Field label="Categoria" value={form.category} onChange={(value) => updateField("category", value)} />
    <Field label="Unidade de medida" value={form.unit} onChange={(value) => updateField("unit", value)} placeholder="un, kg, m, L..." />
    <Field label="Marca" value={form.brand} onChange={(value) => updateField("brand", value)} />
    <Field label="Modelo" value={form.model} onChange={(value) => updateField("model", value)} />
    <Field label="Quantidade atual" type="number" min="0" value={form.stock} onChange={(value) => updateField("stock", value)} />
    <Field label="Estoque mínimo" type="number" min="0" value={form.minimum} onChange={(value) => updateField("minimum", value)} />
    <Field label="Custo unitário" type="number" min="0" step="0.01" value={form.cost} onChange={(value) => updateField("cost", value)} />
    {form.stockCategory === "sale" && <Field label="Preço de venda" type="number" min="0" step="0.01" value={form.sale} onChange={(value) => updateField("sale", value)} />}
  </div>{formError && <div className="state error" style={{ padding: "0 18px 15px", textAlign: "left" }}>{formError}</div>}<footer><button type="button" className="secondary" onClick={close} disabled={busy}>Cancelar</button><button type="submit" className="primary" disabled={busy}>{busy ? "Salvando..." : product ? "Salvar alterações" : "Cadastrar produto"}</button></footer></form></div>;
}

function ViewModal({ product, close }) {
  const forSale = isForSale(product);
  return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Produto</p><h2>{product.name}</h2></div><button className="close" onClick={close}><X /></button></header><div className="form"><ReadField label="Destino" value={forSale ? "Material para venda" : "Uso interno / não será vendido"} /><ReadField label="Tipo" value={product.type} /><ReadField label="Categoria" value={product.category} /><ReadField label="Unidade" value={product.unit} /><ReadField label="Marca" value={product.brand || "—"} /><ReadField label="Modelo" value={product.model || "—"} /><ReadField label="Quantidade atual" value={`${product.stock} ${product.unit || "un"}`} /><ReadField label="Estoque mínimo" value={`${product.minimum} ${product.unit || "un"}`} /><ReadField label="Custo unitário" value={money(product.cost)} />{forSale && <ReadField label="Preço de venda" value={money(product.sale)} />}</div><footer><button type="button" className="secondary" onClick={close}>Fechar</button></footer></div></div>;
}

function Field({ label, type = "text", value, onChange, ...props }) { return <label><span>{label}</span><input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} /></label>; }
function SelectField({ label, value, onChange, options }) { return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>; }
function ReadField({ label, value }) { return <div className="read-field"><span>{label}</span><strong>{value || "—"}</strong></div>; }
