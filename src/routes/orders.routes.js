```javascript
const express = require('express');
const router = express.Router();

/**
 * 1. Create Order
 * POST /orders
 * 
 * Rules:
 * - Calculate totalAmount using revenue formula
 * - Reduce product stock on successful order
 * - Reject order if:
 *   - Product stock is 0
 *   - Ordered quantity > available stock
 * 
 * Status Codes:
 * - 201 Created
 * - 400 Bad Request (Insufficient stock)
 * - 404 Not Found (Product not found)
 */
router.post('/', (req, res) => {
  const { productId, quantity } = req.body;

  // Validate input
  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  // Find product
  const product = req.db.products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Check stock availability
  if (product.stock === 0) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  if (quantity > product.stock) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  // Calculate total amount using revenue formula
  const totalAmount = product.price * quantity;

  // Create new order
  const newOrder = {
    id: req.db.orders.length + 1,
    productId: productId,
    quantity: quantity,
    totalAmount: totalAmount,
    status: 'placed',
    createdAt: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  };

  // Reduce product stock
  product.stock -= quantity;

  // Add order to database
  req.db.orders.push(newOrder);
  req.saveDb();

  res.status(201).json({
    message: 'Order created successfully',
    order: newOrder
  });
});

/**
 * 2. Get All Orders
 * GET /orders
 * 
 * - Include all orders (placed / shipped / delivered / cancelled)
 * - 200 OK
 */
router.get('/', (req, res) => {
  res.status(200).json({
    count: req.db.orders.length,
    orders: req.db.orders
  });
});

/**
 * 3. Cancel Order (Soft Delete)
 * DELETE /orders/:orderId
 * 
 * Rules:
 * - Do NOT hard delete
 * - Change order status to 'cancelled'
 * - Cancellation allowed only if:
 *   order.createdAt === currentDate
 * - Revert product stock after cancellation
 * - Already cancelled orders cannot be cancelled again
 * 
 * Status Codes:
 * - 200 OK
 * - 400 Bad Request
 * - 404 Not Found
 */
router.delete('/:orderId', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const order = req.db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if already cancelled
  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Already cancelled orders cannot be cancelled again' });
  }

  // Check if cancellation is allowed (same day only)
  const currentDate = new Date().toISOString().split('T')[0];
  if (order.createdAt !== currentDate) {
    return res.status(400).json({ error: 'Cancellation only allowed on the same day' });
  }

  // Find product and revert stock
  const product = req.db.products.find(p => p.id === order.productId);
  if (product) {
    product.stock += order.quantity;
  }

  // Change status to cancelled
  order.status = 'cancelled';
  req.saveDb();

  res.status(200).json({
    message: 'Order cancelled successfully',
    order: order
  });
});

/**
 * 4. Change Order Status
 * PATCH /orders/change-status/:orderId
 * 
 * Valid Status Flow:
 * placed → shipped → delivered
 * 
 * Rules:
 * - Cannot skip status
 * - Cannot change status of cancelled or delivered orders
 * 
 * Status Codes:
 * - 200 OK
 * - 400 Bad Request
 * - 404 Not Found
 */
router.patch('/change-status/:orderId', (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const order = req.db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Cannot change status of cancelled or delivered orders
  if (order.status === 'cancelled' || order.status === 'delivered') {
    return res.status(400).json({ 
      error: 'Cannot change status of cancelled or delivered orders' 
    });
  }

  // Valid status flow validation
  const validTransitions = {
    'placed': 'shipped',
    'shipped': 'delivered'
  };

  if (validTransitions[order.status] !== status) {
    return res.status(400).json({ 
      error: `Cannot skip status. Current: ${order.status}, Expected: ${validTransitions[order.status]}` 
    });
  }

  // Update status
  order.status = status;
  req.saveDb();

  res.status(200).json({
    message: 'Order status updated successfully',
    order: order
  });
});

module.exports = router;
```
