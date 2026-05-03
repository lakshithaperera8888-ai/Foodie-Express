const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Withdrawal = require('../models/Withdrawal');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res, next) => {
  const {
    restaurant,
    items,
    totalAmount,
    orderType,
    deliveryAddress,
    paymentMethod,
    paymentStatus,
    onlineProvider,
  } = req.body;

  try {
    if (items && items.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      const deliveryFee = orderType === 'delivery' ? 2.50 : 0;
      const deliveryFeeStatus = orderType === 'delivery' ? 'pending' : 'n/a';

      const order = new Order({
        user: req.user._id,
        restaurant,
        items,
        totalAmount,
        orderType,
        deliveryAddress,
        paymentMethod,
        paymentStatus: paymentStatus || 'pending',
        onlineProvider,
        deliveryFee,
        deliveryFeeStatus,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('deliveryPerson', 'name profileImage').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('restaurant', 'name address')
      .populate('deliveryPerson', 'name profileImage');

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private/RestaurantOwner
const getRestaurantOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name email')
      .populate('deliveryPerson', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/RestaurantOwner
const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      res.status(400);
      throw new Error('Cannot cancel this order');
    }

    order.orderStatus = 'cancelled';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Pay delivery fee to driver
// @route   PUT /api/orders/:id/pay-driver
// @access  Private/RestaurantOwner
const payDeliveryFee = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.deliveryFeeStatus === 'paid') {
      res.status(400);
      throw new Error('Delivery fee already paid');
    }

    order.deliveryFeeStatus = 'paid';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant earnings stats
// @route   GET /api/orders/restaurant-stats/:restaurantId
// @access  Private/RestaurantOwner
const getRestaurantStats = async (req, res, next) => {
  try {
    const orders = await Order.find({
      restaurant: req.params.restaurantId,
      orderStatus: { $nin: ['cancelled'] },
      paymentStatus: 'paid',
    }).sort({ createdAt: -1 });

    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Calculate total withdrawn amount
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);

    // Calculate lifetime earnings (all paid orders)
    const lifetimeEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate withdrawn order amounts
    const withdrawnOrderIds = orders
      .filter(o => o.restaurantWithdrawalStatus === 'withdrawn')
      .map(o => o._id.toString());

    // Available balance = total from unwithdrawn paid orders
    const totalEarnings = orders
      .filter(o => o.restaurantWithdrawalStatus === 'unwithdrawn')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Build history: each order as a transaction entry
    const history = orders.map(order => ({
      _id: order._id,
      amount: order.totalAmount,
      type: order.restaurantWithdrawalStatus === 'withdrawn' ? 'withdrawn' : 'earned',
      date: order.createdAt,
      orderStatus: order.orderStatus,
      items: order.items,
    }));

    // Build withdrawn logs from Withdrawal model
    const withdrawnLogs = withdrawals.map(w => ({
      _id: w._id,
      amount: w.amount,
      method: w.method,
      status: w.status,
      date: w.createdAt,
    }));

    res.json({
      totalEarnings,
      lifetimeEarnings,
      totalWithdrawn,
      history,
      withdrawnLogs,
      withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request restaurant withdrawal
// @route   POST /api/orders/restaurant-withdraw
// @access  Private/RestaurantOwner
const requestRestaurantWithdrawal = async (req, res, next) => {
  const { amount, method, restaurantId } = req.body;

  try {
    if (!amount || amount <= 0) {
      res.status(400);
      throw new Error('Invalid withdrawal amount');
    }

    // Get all unwithdrawn paid orders for this restaurant
    const orders = await Order.find({
      restaurant: restaurantId,
      orderStatus: { $nin: ['cancelled'] },
      paymentStatus: 'paid',
      restaurantWithdrawalStatus: 'unwithdrawn',
    });

    const availableBalance = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    if (amount > availableBalance) {
      res.status(400);
      throw new Error('Insufficient balance');
    }

    // Mark orders as withdrawn (greedily from oldest to newest)
    let remaining = amount;
    for (const order of orders) {
      if (remaining <= 0) break;
      if (order.totalAmount <= remaining) {
        order.restaurantWithdrawalStatus = 'withdrawn';
        remaining -= order.totalAmount;
        await order.save();
      }
    }

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      method,
      status: 'completed',
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
  payDeliveryFee,
  getRestaurantStats,
  requestRestaurantWithdrawal,
};
