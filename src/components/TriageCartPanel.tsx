import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { cartItemToVariantInput } from '../types/triage';
import './TriageCartPanel.css';

export default function TriageCartPanel() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const count = cartItems.length;

  function handlePerformTriage() {
    const variants = cartItems.map(cartItemToVariantInput);
    navigate('/variant-triage/results', { state: { variants, cartItems } });
  }

  return (
    <div className={`triage-cart-panel${expanded ? ' triage-cart-panel--open' : ''}`}>
      <div className="triage-cart-header" onClick={() => setExpanded((v) => !v)}>
        <div className="triage-cart-summary">
          <span className="triage-cart-icon">🧬</span>
          <span className="triage-cart-label">Triage Panel</span>
          <span className={`triage-cart-badge${count === 0 ? ' triage-cart-badge--empty' : ''}`}>
            {count}
          </span>
        </div>
        <span className="triage-cart-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="triage-cart-body">
          {count === 0 ? (
            <p className="triage-cart-empty">
              No variants added yet. Browse genes and click <strong>+ Triage</strong> to add.
            </p>
          ) : (
            <>
              <ul className="triage-cart-list">
                {cartItems.map((item) => (
                  <li key={item.clinvar_id} className="triage-cart-item">
                    <div className="triage-cart-item-info">
                      <span className="triage-cart-item-gene">{item.gene_symbol}</span>
                      <span className="triage-cart-item-pos">
                        {item.chromosome}:{item.pos.toLocaleString()}
                      </span>
                      <span className="triage-cart-item-class">{item.classification}</span>
                    </div>
                    <button
                      className="triage-cart-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.clinvar_id);
                      }}
                      title="Remove from panel"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="triage-cart-actions">
                <button className="triage-cart-clear" onClick={clearCart}>
                  Clear All
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="triage-cart-footer">
        <button
          className="triage-perform-btn"
          disabled={count === 0}
          onClick={handlePerformTriage}
        >
          Perform Triage →
        </button>
      </div>
    </div>
  );
}
