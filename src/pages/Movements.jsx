import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Eye, Factory, Filter, History, Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { useMovements } from "../hooks/useMovements";

const formatDate = (v) => {
  const s = String(v || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

const isProductionMovement = (m) => String(m.reason || "").toLowerCase() === "produção" || String(m.document || "").startsWith("PROD-");

function buildGroups(movements) {
  const groups = [];
  const productionMap = new Map();

  for (const movement of movements) {
    if (!isProductionMovement(movement)) {
      groups.push({ kind: "movement", id: `m-${movement.id}`, movement });
      continue;
    }

    const createdSecond = String(movement.createdAt || "").slice(0, 19);
    const key = movement.document || `legacy-${createdSecond}-${movement.userName || ""}-${movement.movementDate || ""}`;
    let group = productionMap.get(key);
    if (!group) {
      group = { kind: "production", id: `p-${key}`, movements: [], produced: null };
      productionMap.set(key, group);
      groups.push(group);
    }
    group.movements.push(movement);
    if (movement.type === "ENTRADA") group.produced = movement;
  }

  return groups;
}

export default function Movements() {
  const { movements, loading, error } = useMovements();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("TODAS");
  const [selected, setSelected] = useState(null);
  const [openProduction, setOpenProduction] = useState(null);

  const groups = useMemo(() => buildGroups(movements), [movements]);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    return groups.filter((group) => {
      if (group.kind === "movement") {
        const m = group.movement;
        const text = [m.productName, m.userName, m.reason, m.destination, m.document].map(v => String(v || "").toLowerCase());
        return text.some(v => v.includes(s)) && (type === "TODAS" || m.type === type);
      }
      const text = group.movements.flatMap(m => [m.productName, m.userName, m.reason, m.document]).map(v => String(v || "").toLowerCase());
      const hasType = type === "TODAS" || group.movements.some(m => m.type === type);
      return text.some(v => v.includes(s)) && hasType;
    });
  }, [groups, query, type]);

  const entries = movements.filter(m => m.type === "ENTRADA").length;
  const exits = movements.filter(m => m.type === "SAIDA").length;

  return <div>
    <div className="page-heading">
      <div>
        <p className="eyebrow">Auditoria do estoque</p>
        <h1>Histórico</h1>
        <p>Consulte entradas, saídas e produções realizadas no estoque.</p>
      </div>
    </div>

    <div className="stats">
      <Stat icon={History} label="Movimentações" value={movements.length} text="Registros" />
      <Stat icon={ArrowDownToLine} label="Entradas" value={entries} text="Movimentações" />
      <Stat icon={ArrowUpFromLine} label="Saídas" value={exits} text="Movimentações" />
    </div>

    <div className="toolbar panel">
      <div className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar produto, responsável ou motivo..." /></div>
      <label className="filter"><Filter size={15} /><select value={type} onChange={e => setType(e.target.value)}><option value="TODAS">Todas</option><option value="ENTRADA">Entradas</option><option value="SAIDA">Saídas</option></select></label>
    </div>

    <div className="panel table-panel">
      <div className="table-title"><strong>{filtered.length}</strong><span> {filtered.length === 1 ? "registro encontrado" : "registros encontrados"}</span></div>
      {loading ? <div className="state">Carregando...</div> : error ? <div className="state error">{error}</div> : filtered.length === 0 ? <div className="state">Nenhuma movimentação encontrada.</div> :
        <div className="scroll"><table><thead><tr><th>Tipo</th><th>Produto / operação</th><th>Quantidade</th><th>Saldo</th><th>Data</th><th>Responsável</th><th>Ações</th></tr></thead><tbody>
          {filtered.map(group => group.kind === "production" ? <ProductionRow key={group.id} group={group} open={openProduction === group.id} onToggle={() => setOpenProduction(openProduction === group.id ? null : group.id)} onView={() => setSelected(group)} /> : <MovementRow key={group.id} movement={group.movement} onView={() => setSelected(group.movement)} />)}
        </tbody></table></div>}
    </div>

    {selected?.kind === "production" ? <ProductionView group={selected} close={() => setSelected(null)} /> : selected ? <ViewMovement movement={selected} close={() => setSelected(null)} /> : null}
  </div>;
}

function ProductionRow({ group, open, onToggle, onView }) {
  const produced = group.produced || group.movements[0];
  const consumed = group.movements.filter(m => m.type === "SAIDA");
  return <>
    <tr className="production-history-row" onClick={onToggle} style={{ cursor: "pointer" }}>
      <td><span className="badge ok"><Factory size={13} /> Produção</span></td>
      <td><div className="product"><b><Factory size={17} /></b><div><strong>{produced.productName}</strong><small>{formatNumber(produced.quantity)} {produced.unit} produzidas · {consumed.length} materiais consumidos</small></div></div></td>
      <td><strong className="positive">+{formatNumber(produced.quantity)} {produced.unit}</strong></td>
      <td>{produced.previousStock} → {produced.newStock}</td>
      <td>{formatDate(produced.movementDate)}</td>
      <td>{produced.userName}</td>
      <td><div className="actions"><button onClick={(e) => { e.stopPropagation(); onView(); }} title="Ver detalhes">{open ? <ChevronDown size={15} /> : <Eye size={15} />}</button></div></td>
    </tr>
    {open && <tr><td colSpan="7"><div className="production-history-details"><div className="production-details-title"><strong>Materiais consumidos</strong><span>Produção de {formatNumber(produced.quantity)} {produced.unit}</span></div>{consumed.length ? consumed.map(m => <div className="production-detail-item" key={m.id}><span>{m.productName}</span><strong>-{formatNumber(m.quantity)} {m.unit}</strong></div>) : <div className="muted">Nenhum consumo registrado.</div>}<div className="production-details-footer"><span>Estoque de {produced.productName}</span><strong>{produced.previousStock} → {produced.newStock} {produced.unit}</strong></div></div></td></tr>}
  </>;
}

function MovementRow({ movement, onView }) {
  const entry = movement.type === "ENTRADA";
  return <tr><td><span className={`badge ${entry ? "ok" : "out"}`}>{entry ? "Entrada" : "Saída"}</span></td><td><div className="product"><b>{entry ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}</b><div><strong>{movement.productName}</strong><small>{movement.stockCategory === "sale" ? "Para venda" : "Uso interno"}</small></div></div></td><td><strong className={entry ? "positive" : "negative"}>{entry ? "+" : "-"}{formatNumber(movement.quantity)} {movement.unit}</strong></td><td>{movement.previousStock} → {movement.newStock}</td><td>{formatDate(movement.movementDate)}</td><td>{movement.userName}</td><td><div className="actions"><button onClick={() => onView()} title="Visualizar"><Eye size={15} /></button></div></td></tr>;
}

function Stat({ icon: Icon, label, value, text }) { return <div className="stat panel"><div className="stat-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{text}</small></div></div>; }

function ProductionView({ group, close }) {
  const produced = group.produced || group.movements[0];
  const consumed = group.movements.filter(m => m.type === "SAIDA");
  return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={e => e.stopPropagation()}><header><div><p className="eyebrow">Produção</p><h2>{produced.productName}</h2></div><button type="button" className="close" onClick={close}><X /></button></header><div className="form"><ReadField label="Quantidade produzida" value={`+${formatNumber(produced.quantity)} ${produced.unit}`} /><ReadField label="Data" value={formatDate(produced.movementDate)} /><ReadField label="Responsável" value={produced.userName} /><div className="production-recipe-list">{consumed.map(m => <div key={m.id}><div><strong>{m.productName}</strong><small>Estoque: {m.previousStock} → {m.newStock} {m.unit}</small></div><strong>-{formatNumber(m.quantity)} {m.unit}</strong></div>)}</div></div><footer><button type="button" className="secondary" onClick={close}>Fechar</button></footer></div></div>;
}

function ViewMovement({ movement, close }) { return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={e => e.stopPropagation()}><header><div><p className="eyebrow">Movimentação</p><h2>{movement.productName}</h2></div><button type="button" className="close" onClick={close}><X /></button></header><div className="form"><ReadField label="Tipo" value={movement.type === "ENTRADA" ? "Entrada" : "Saída"} /><ReadField label="Estoque" value={movement.stockCategory === "sale" ? "Para venda" : "Uso interno"} /><ReadField label="Quantidade" value={`${movement.type === "ENTRADA" ? "+" : "-"}${formatNumber(movement.quantity)} ${movement.unit}`} /><ReadField label="Estoque anterior" value={`${movement.previousStock} ${movement.unit}`} /><ReadField label="Estoque posterior" value={`${movement.newStock} ${movement.unit}`} /><ReadField label="Motivo" value={movement.reason} /><ReadField label="Data" value={formatDate(movement.movementDate)} /><ReadField label="Responsável" value={movement.userName} /><ReadField label="Observação" value={movement.notes} /></div><footer><button type="button" className="secondary" onClick={close}>Fechar</button></footer></div></div>; }
function ReadField({ label, value }) { return <label><span>{label}</span><input value={value || "—"} readOnly /></label>; }
