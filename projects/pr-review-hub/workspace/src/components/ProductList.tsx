// File: src/components/ProductList.tsx
function renderProduct(product) {
  return (
    <div>
      {/* Product rendering */}
    </div>
  );
}

function ProductList({ products }) {
  const renderProduct = useCallback((product) => {...}, [products]);

  return (
    <div>
      {products.map(renderProduct)}
    </div>
  );
}
