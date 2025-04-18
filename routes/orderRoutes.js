const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const { sendNotification } = require('../config/firebase');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - quantity
 *         - price
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *         quantity:
 *           type: number
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           description: Price of the product
 *     ShippingAddress:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         country:
 *           type: string
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID of the order
 *         user:
 *           type: string
 *           description: User ID who placed the order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         note:
 *           type: string
 *           description: Additional notes or comments about the order
 *           maxLength: 100
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed]
 *         paymentMethod:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders with filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created after this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created before this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 statusCounts:
 *                   type: object
 *                   description: Count of orders by status
 *                   properties:
 *                     pending:
 *                       type: integer
 *                     processing:
 *                       type: integer
 *                     shipped:
 *                       type: integer
 *                     delivered:
 *                       type: integer
 *                     cancelled:
 *                       type: integer
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      startDate,
      endDate
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { user: req.user._id };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    // Get count of orders by status
    const statusCounts = await Order.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format status counts
    const formattedStatusCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });

    res.json({
      orders,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      statusCounts: formattedStatusCounts
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - state
 *                   - zipCode
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               note:
 *                 type: string
 *                 description: Additional notes or comments about the order
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or cart is empty
 */
router.post('/', auth, async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}` 
        });
      }
    }

    // Validate note length if provided
    if (req.body.note && req.body.note.length > 100) {
      return res.status(400).json({ message: 'Note cannot exceed 100 characters' });
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: cart.totalAmount,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      note: req.body.note
    });

    await order.save();

    // Clear the cart
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    // Get user's FCM token
    const user = await User.findById(req.user._id);
    if (user && user.fcmToken) {
      // Send notification
      try {
        await sendNotification(
          user.fcmToken,
          'Order Placed Successfully',
          `Your order #${order._id} has been placed successfully`,
          {
            orderId: order._id.toString(),
            type: 'order_placed'
          }
        );
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: New status of the order
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status or order not found
 *       403:
 *         description: Not authorized to update this order
 *       500:
 *         description: Server error
 */
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled' 
      });
    }

    // Find and update order
    const order = await Order.findOneAndUpdate(
      { 
        _id: orderId,
        user: req.user._id // Ensure user can only update their own orders
      },
      { status },
      { new: true }
    ).populate('items.product');

    if (!order) {
      return res.status(400).json({ message: 'Order not found' });
    }

    // Get user's FCM token
    const user = await User.findById(req.user._id);
    if (user && user.fcmToken) {
      // Send push notification
      try {
        await sendNotification(
          user.fcmToken,
          'Order Status Updated',
          `Your order #${order._id} status has been updated to ${status}`,
          {
            orderId: order._id.toString(),
            status: status,
            type: 'order_status_update'
          }
        );
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    // Save notification to database
    try {
      const notification = new Notification({
        user: req.user._id,
        title: 'Order Status Updated',
        message: `Your order #${order._id} status has been updated to ${status}`,
        type: 'order',
        data: {
          orderId: order._id,
          status: status
        }
      });
      await notification.save();
    } catch (error) {
      console.error('Error saving notification:', error);
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   put:
 *     summary: Update payment status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = req.body.paymentStatus;
    await order.save();
    
    const updatedOrder = await order.populate('items.product');
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 