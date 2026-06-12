// admin-frontend/src/components/StatsPanel.js
import '../styles/StatsPanel.css';
 
function StatsPanel({ products }) {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

  return (
    <div className="stats-panel">
      <h3>Statistics</h3>
      <div className="stats-grid">
        <div className="stat">
          <h4>Total Products</h4>
          <p>{totalProducts}</p>
        </div>
        <div className="stat">
          <h4>Total Stock</h4>
          <p>{totalStock}</p>
        </div>
        <div className="stat">
          <h4>Total Value</h4>
          <p>₹{totalValue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;