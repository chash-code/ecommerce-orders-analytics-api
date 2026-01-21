```javascript
const express = require('express');
const router = express.Router();

/**
 * Analytics APIs (Mandatory)
 * 
 * ⚠️ All analytics calculations MUST use Higher-Order Functions
 * (map, forEach, filter, reduce)
 * 
 * Avoid 'for', 'while' loops for analytics
 * Handle all edge cases properly
 * Use meaningful variable names
 * Return consistent JSON responses
 */

/**
 * 1. All Orders with Count
 * GET /analytics/allorders
 * 
 * Use forEach or map
 * Return total count and list
 */
router.get('/allorders', (req, res) => {
  const allOrders = [];
  
  req.db.orders.forEach(order => {
    allOrders.push(order);
  });

  res.status(200).json({
    count: allOrders.length,
    orders: allOrders
  });
});

/**
 * 2. Cancelled Orders with Count
 * GET /analytics/cancelled-orders
 * 
 * Use filter to extract cancelled orders
 */
router.get('/cancelled-orders', (req, res) => {
  const cancelledOrders = req.db.orders.filter(order => order.status === 'cancelled');

  res.status(200).json({
    count: cancelledOrders.length,
    orders: cancelledOrders
  });
});

/**
 * 3. Shipped Orders with Count
 * GET /analytics/shipped
 * 
 * Use filter
 */
router.get('/shipped', (req, res) => {
  const shippedOrders = req.db.orders.filter(order => order.status === 'shipped');

  res.status(200).json({
    count: shippedOrders.length,
    orders: shippedOrders
  });
});

/**
 * 4. Total Revenue by Product
 * GET /analytics/total-revenue/:productId
 * 
 * Logic:
 * - Filter orders by productId
 * - Exclude cancelled orders
 * - Use reduce to compute revenue
 * 
 * totalRevenue = Σ (order.quantity × product.price)
 */
router.get('/total-revenue/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);

  // Find product
  const product = req.db.products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Filter orders by productId and exclude cancelled orders
  const productOrders = req.db.orders.filter(
    order => order.productId === productId && order.status !== 'cancelled'
  );

  // Calculate total revenue using reduce
  const totalRevenue = productOrders.reduce((sum, order) => {
    return sum + (order.quantity * product.price);
  }, 0);

  res.status(200).json({
    productId: productId,
    productName: product.name,
    totalRevenue: totalRevenue,
    orderCount: productOrders.length
  });
});

/**
 * 5. Overall Revenue
 * GET /analytics/alltotalrevenue
 * 
 * Logic:
 * - Filter out cancelled orders
 * - Use reduce to compute sum of all revenues
 * 
 * totalRevenue = Σ (order.quantity × product.price)
 */
router.get('/alltotalrevenue', (req, res) => {
  // Filter out cancelled orders
  const activeOrders = req.db.orders.filter(order => order.status !== 'cancelled');

  // Calculate overall revenue using reduce
  const totalRevenue = activeOrders.reduce((sum, order) => {
    const product = req.db.products.find(p => p.id === order.productId);
    if (product) {
      return sum + (order.quantity * product.price);
    }
    return sum;
  }, 0);

  res.status(200).json({
    totalRevenue: totalRevenue,
    orderCount: activeOrders.length
  });
});

module.exports = router;
```
