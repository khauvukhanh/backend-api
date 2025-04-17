const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
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
<<<<<<< HEAD
 *           type: string
 *           description: Shipping address for the order
 *         note:
 *           type: string
 *           description: Additional notes or comments about the order
 *           maxLength: 500
=======
 *           $ref: '#/components/schemas/ShippingAddress'
>>>>>>> parent of eb2f036 (change shipping address & push notification)
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
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
<<<<<<< HEAD
 *                 type: string
 *                 description: Shipping address for the order
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method to be used
 *               note:
 *                 type: string
 *                 description: Additional notes or comments about the order
 *                 maxLength: 500
=======
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
>>>>>>> parent of eb2f036 (change shipping address & push notification)
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or cart is empty
 */
router.post('/', auth, async (req, res) => {
  try {
<<<<<<< HEAD
    const { shippingAddress, paymentMethod, note } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Shipping address and payment method are required' });
    }

    if (note && note.length > 500) {
      return res.status(400).json({ message: 'Note cannot exceed 500 characters' });
    }

=======
    // Get user's cart
>>>>>>> parent of eb2f036 (change shipping address & push notification)
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

    // Create order
    const order = new Order({
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: cart.totalAmount,
<<<<<<< HEAD
      shippingAddress,
      paymentMethod,
      note
=======
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod
>>>>>>> parent of eb2f036 (change shipping address & push notification)
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
    try {
      // Save the notification to the table notifications
      const notification = new Notification({
        user: req.user._id,
        title: 'Order Placed Successfully',
        message: `Your order #${order._id} has been placed successfully`,
        type: 'order_placed'
      });
      await notification.save();
    } catch (error) {
      console.error('Error saving notification:', error);
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
 *     summary: Update order status (Admin only)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = req.body.status;
    await order.save();
    
    const updatedOrder = await order.populate('items.product');
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
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