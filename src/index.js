```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Load database
const dbPath = path.join(__dirname, 'db.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Make db accessible to routes
app.use((req, res, next) => {
  req.db = db;
  req.saveDb = () => {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  };
  next();
});

// Import routes
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Use routes
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-commerce Orders & Analytics API',
    endpoints: {
      orders: {
        create: 'POST /orders',
        getAll: 'GET /orders',
        cancel: 'DELETE /orders/:orderId',
        changeStatus: 'PATCH /orders/change-status/:orderId'
      },
      analytics: {
        allOrders: 'GET /analytics/allorders',
        cancelledOrders: 'GET /analytics/cancelled-orders',
        shippedOrders: 'GET /analytics/shipped',
        totalRevenue: 'GET /analytics/total-revenue/:productId',
        overallRevenue: 'GET /analytics/alltotalrevenue'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```
