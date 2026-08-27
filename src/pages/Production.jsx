import { useMemo, useState } from "react";
import { Factory, Eye, Pencil, Plus, Trash2, X, PackageCheck, AlertTriangle } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useProduction } from "../hooks/useProduction";

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  const s = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

const normalizeCategory = (value) => {
  const v = String(value ?? "").trim().toLowerCase();
  return ["sale", "venda", "para venda", "para_venda", "vendido"].includes(v) ? "sale" : "internal";
};

const unitGroups = {
  un: ["un"],
  g: ["g", "kg"],
  kg: ["g", "kg"],
  ml: ["ml", "L"],
  l: ["ml", "L"],
  cm: ["cm", "m"],
  m: ["cm", "m"],
};

const normalizeUnit = (unit) => {
  const v = String(unit || "un").trim().toLowerCase();
  if (v === "l") return "L";
  return v;
};

const compatibleUnits = (unit) => {
  const normalized = normalizeUnit(unit);
  const key = normalized.toLowerCase();
  return unitGroups[key] || [normalized];
};

const parseDecimal = (value) => {
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  return Number(normalized);
};

const formatNumber = (value) => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export default function Production() {
  const { products, loading: productsLoading } = useProducts();
  const { recipes, history, loading, busy, error, saveRecipe, removeRecipe, registerProduction } = useProduction();
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewRecipe, setViewRecipe] = useState(null);

  const finishedProducts = useMemo(
    () => products.filter((p) => p.active !== false && normalizeCategory(p.stockCategory) === "sale"),
    [products]
  );

  const materialProducts = useMemo(
    () => products.filter((p) => p.active !== false && normalizeCategory(p.stockCategory) === "internal"),
    [products]
  );

  async function handleDelete(recipe) {
    if (!window.confirm(`Excluir a ficha de produção de "${recipe.productName}"?`)) return;
    try {
      await removeRecipe(recipe.productId);
    } catch (e) {
      alert(e.message || "Não foi possível excluir a ficha.");
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Controle de fabricação</p>
          <h1>Produção</h1>
          <p>Cadastre a composição dos produtos e registre a produção do dia.</p>
        </div>
        <button className="primary" onClick={() => setProductionOpen(true)} >
          <Factory size={17} />
          Registrar produção
        </button>
      </div>

      {!productsLoading && !finishedProducts.length && (
        <div className="info-banner">
          <PackageCheck size={18} />
          <div>
            <strong>Nenhum produto para fabricar ainda</strong>
            <span>Cadastre uma cadeira, mesa ou outro produto como <b>Para venda</b> em Produtos.</span>
          </div>
        </div>
      )}

      <div className="grid two production-top">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Ficha técnica</p>
              <h2>Composição dos produtos</h2>
            </div>
            <button className="secondary" onClick={() => { setEditingRecipe(null); setRecipeOpen(true); }} >
              <Plus size={16} />Nova ficha
            </button>
          </div>
          <p className="muted">Defina os materiais consumidos para produzir uma unidade.</p>
          {loading || productsLoading ? <div className="state">Carregando...</div> : recipes.length === 0 ? <div className="state">Nenhuma ficha cadastrada.</div> : (
            <div className="scroll">
              <table>
                <thead><tr><th>Produto</th><th>Materiais</th><th>Ações</th></tr></thead>
                <tbody>
                  {recipes.map((r) => (
                    <tr key={r.id}>
                      <td><div className="product"><b><Factory size={17} /></b><div><strong>{r.productName}</strong><small>{formatNumber(r.stock)} {r.unit} em estoque</small></div></div></td>
                      <td>{r.items.length} {r.items.length === 1 ? "material" : "materiais"}</td>
                      <td><div className="actions">
                        <button title="Visualizar" onClick={() => setViewRecipe(r)}><Eye size={15} /></button>
                        <button title="Editar ficha" onClick={() => { setEditingRecipe(r); setRecipeOpen(true); }}><Pencil size={15} /></button>
                        <button title="Excluir ficha" onClick={() => handleDelete(r)}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><div><p className="eyebrow">Últimas produções</p><h2>Produção registrada</h2></div></div>
          {loading ? <div className="state">Carregando...</div> : history.length === 0 ? <div className="state">Nenhuma produção registrada.</div> : (
            <div className="scroll"><table><thead><tr><th>Produto</th><th>Quantidade</th><th>Data</th></tr></thead><tbody>
              {history.slice(0, 8).map((item) => <tr key={item.id}><td><strong>{item.productName}</strong></td><td><strong>+{formatNumber(item.quantity)}</strong> {item.unit}</td><td>{formatDate(item.productionDate)}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>

      {error && <div className="state error" style={{ marginTop: 16 }}>{error}</div>}

      {recipeOpen && <RecipeModal
        recipe={editingRecipe}
        products={materialProducts}
        finishedProducts={finishedProducts}
        busy={busy}
        onSave={saveRecipe}
        close={() => { setRecipeOpen(false); setEditingRecipe(null); }}
      />}
      {productionOpen && <ProductionModal recipes={recipes} busy={busy} onSave={registerProduction} close={() => setProductionOpen(false)} />}
      {viewRecipe && <RecipeView recipe={viewRecipe} close={() => setViewRecipe(null)} />}
    </div>
  );
}

function RecipeModal({ recipe, products, finishedProducts, busy, onSave, close }) {
  const [productId, setProductId] = useState(recipe?.productId ? String(recipe.productId) : "");
  const [items, setItems] = useState(() => recipe?.items?.length
    ? recipe.items.map((item) => ({ materialId: String(item.materialId), quantity: item.displayQuantity ?? item.quantity, consumptionUnit: item.consumptionUnit || item.unit }))
    : [{ materialId: "", quantity: "", consumptionUnit: "" }]
  );
  const [formError, setFormError] = useState("");

  const addItem = () => setItems((v) => [...v, { materialId: "", quantity: "", consumptionUnit: "" }]);
  const updateItem = (index, field, value) => setItems((v) => v.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeItem = (index) => setItems((v) => v.length === 1 ? v : v.filter((_, i) => i !== index));

  const selectedProduct = finishedProducts.find((p) => Number(p.id) === Number(productId));

  function chooseMaterial(index, value) {
    const material = products.find((p) => Number(p.id) === Number(value));
    setItems((current) => current.map((item, i) =>
      i === index
        ? { ...item, materialId: value, consumptionUnit: material?.unit || "un" }
        : item
    ));
  }

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!productId) return setFormError("Selecione o produto que será produzido.");
    const clean = items.filter((i) => i.materialId && Number.isFinite(parseDecimal(i.quantity)) && parseDecimal(i.quantity) > 0);
    if (!clean.length) return setFormError("Adicione pelo menos um material.");
    if (new Set(clean.map((i) => i.materialId)).size !== clean.length) return setFormError("Não repita o mesmo material na ficha.");
    try {
      await onSave({ productId, items: clean.map((item) => ({ ...item, quantity: parseDecimal(item.quantity), consumptionUnit: item.consumptionUnit })) });
      close();
    } catch (err) {
      setFormError(err.message || "Não foi possível salvar a ficha.");
    }
  }

  return <div className="backdrop" onMouseDown={close}><form className="modal production-modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
    <header><div><p className="eyebrow">Ficha técnica</p><h2>{recipe ? "Editar composição" : "Composição do produto"}</h2></div><button type="button" className="close" onClick={close}><X /></button></header>
    <div className="form">
      <label><span>Produto produzido</span><select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!finishedProducts.length}><option value="">{finishedProducts.length ? "Selecione..." : "Nenhum produto para venda cadastrado"}</option>{finishedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {selectedProduct && <div className="helper-box"><PackageCheck size={17} /><span>Este produto ficará no <strong>estoque para venda</strong> quando for produzido.</span></div>}
      <div className="production-items-head"><div><strong>Materiais por 1 unidade</strong><small>Use a unidade que faz sentido para o consumo.</small></div><button type="button" className="secondary" onClick={addItem}><Plus size={15} />Adicionar material</button></div>
      {items.map((item, index) => {
        const material = products.find((p) => Number(p.id) === Number(item.materialId));
        const units = compatibleUnits(material?.unit || "un");
        return <div className="production-item" key={`${index}-${item.materialId}`}>
          <label><span>Material</span><select value={item.materialId} onChange={(e) => chooseMaterial(index, e.target.value)}><option value="">Selecione...</option>{products.filter((p) => p.active !== false && normalizeCategory(p.stockCategory) === "internal" && Number(p.id) !== Number(productId)).map((p) => <option key={p.id} value={p.id}>{p.name} — {formatNumber(p.stock)} {p.unit}</option>)}</select></label>
          <label><span>Quantidade</span><input type="text" inputMode="decimal" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} placeholder="0" /></label>
          <label><span>Unidade</span><select value={item.consumptionUnit || material?.unit || "un"} onChange={(e) => updateItem(index, "consumptionUnit", e.target.value)}>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label>
          <button type="button" className="icon-danger" onClick={() => removeItem(index)} title="Remover material"><Trash2 size={15} /></button>
        </div>;
      })}
    </div>
    {formError && <div className="state error form-error">{formError}</div>}
    <footer><button type="button" className="secondary" onClick={close}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : recipe ? "Salvar alterações" : "Salvar ficha"}</button></footer>
  </form></div>;
}

function ProductionModal({ recipes, busy, onSave, close }) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [productionDate, setProductionDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const selected = recipes.find((r) => Number(r.productId) === Number(productId));
  const amount = parseDecimal(quantity);

  async function submit(e) {
    e.preventDefault(); setFormError("");
    if (!productId) return setFormError("Selecione o produto produzido.");
    if (!selected) return setFormError("Esse produto ainda não possui ficha de produção.");
    if (!Number.isFinite(amount) || amount <= 0) return setFormError("Informe uma quantidade produzida maior que zero.");
    try { await onSave({ productId, quantity: amount, productionDate, notes }); close(); }
    catch (err) { setFormError(err.message || "Não foi possível registrar a produção."); }
  }

  return <div className="backdrop" onMouseDown={close}><form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
    <header><div><p className="eyebrow">Produção</p><h2>Registrar produção</h2></div><button type="button" className="close" onClick={close}><X /></button></header>
    <div className="form">
      <label><span>Produto produzido</span><select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!recipes.length}><option value="">{recipes.length ? "Selecione..." : "Nenhuma ficha técnica cadastrada"}</option>{recipes.map((r) => <option key={r.productId} value={r.productId}>{r.productName}</option>)}</select></label>
      <Field label="Quantidade produzida" type="number" min="0.001" step="0.001" value={quantity} onChange={setQuantity} placeholder="Ex.: 300" />
      <Field label="Data da produção" type="date" value={productionDate} onChange={setProductionDate} />
      <Field label="Observação" value={notes} onChange={setNotes} placeholder="Opcional" />
    </div>
    {selected && amount > 0 && <div className="stock-preview"><small>Consumo previsto</small>{selected.items.map((i) => <div key={i.materialId}><span>{i.materialName}</span><strong>{formatNumber(Number(i.displayQuantity ?? i.quantity) * amount)} {i.consumptionUnit || i.unit}</strong></div>)}</div>}
    {formError && <div className="state error form-error">{formError}</div>}
    <footer><button type="button" className="secondary" onClick={close}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Registrando..." : "Registrar produção"}</button></footer>
  </form></div>;
}

function RecipeView({ recipe, close }) {
  return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><header><div><p className="eyebrow">Ficha técnica</p><h2>{recipe.productName}</h2></div><button type="button" className="close" onClick={close}><X /></button></header><div className="form"><div className="production-recipe-list">{recipe.items.map((item) => <div key={item.materialId}><div><strong>{item.materialName}</strong><small>Estoque atual: {formatNumber(item.stock)} {item.unit}</small></div><strong>{formatNumber(item.displayQuantity ?? item.quantity)} {item.consumptionUnit || item.unit} / unidade</strong></div>)}</div></div><footer><button type="button" className="secondary" onClick={close}>Fechar</button></footer></div></div>;
}

function Field({ label, value, onChange, type = "text", ...props }) { return <label><span>{label}</span><input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} /></label>; }
