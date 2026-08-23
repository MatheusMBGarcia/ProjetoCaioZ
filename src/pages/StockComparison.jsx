import { useMemo } from "react";
import { useProducts } from "../hooks/useProducts";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

function Status({ product }) {
  if (Number(product.stock) === 0) return <span className="badge out">Sem estoque</span>;
  if (Number(product.stock) <= Number(product.minimum)) return <span className="badge low">Estoque baixo</span>;
  return <span className="badge ok">Normal</span>;
}

function isForSale(product) {
  return Number(product.sale) > 0;
}

function StockTable({ products, forSale }) {
  if (!products.length) return <div className="state">Nenhum item encontrado.</div>;

  return <div className="scroll"><table><thead><tr><th>Material</th><th>Tipo</th><th>Categoria</th><th>Estoque</th>{forSale ? <><th>Custo</th><th>Preço de venda</th></> : <><th>Estoque mínimo</th><th>Custo</th></>}<th>Status</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.type || "Material"}</td><td>{product.category || "—"}</td><td><strong>{product.stock}</strong> {product.unit || "un"}</td>{forSale ? <><td>{money(product.cost)}</td><td>{money(product.sale)}</td></> : <><td>{product.minimum} {product.unit || "un"}</td><td>{money(product.cost)}</td></>}<td><Status product={product} /></td></tr>)}</tbody></table></div>;
}

export default function StockComparison() {
  const { products, loading, error } = useProducts();
  const { internal, sale } = useMemo(() => ({ internal: products.filter((product) => !isForSale(product)), sale: products.filter(isForSale) }), [products]);

  if (loading) return <div className="panel state">Carregando comparação do estoque...</div>;
  if (error) return <div className="panel state error">{error}</div>;

  return <div><div className="page-heading"><div><p className="eyebrow">Visão comparativa</p><h1>Comparação de estoque</h1><p>Compare os materiais de uso interno com os materiais destinados à venda.</p></div></div><section className="panel table-panel"><div className="panel-head"><div><p className="eyebrow">Uso interno</p><h2>Materiais que não serão vendidos</h2></div></div><div className="table-title"><strong>{internal.length} itens</strong><span> cadastrados</span></div><StockTable products={internal} forSale={false} /></section><section className="panel table-panel" style={{ marginTop: 24 }}><div className="panel-head"><div><p className="eyebrow">Comercial</p><h2>Materiais para venda</h2></div></div><div className="table-title"><strong>{sale.length} itens</strong><span> cadastrados</span></div><StockTable products={sale} forSale /></section></div>;
}
