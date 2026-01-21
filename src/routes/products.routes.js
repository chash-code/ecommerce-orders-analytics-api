```javascript
const express = require('express');
const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  res.json({
    count: req.db.products.length,
    products: req.db.products
  });
});

// Get single product
router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = req.db.products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ product });
});

module.exports = router;
```
