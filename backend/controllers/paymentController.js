const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_N9nPmHQL7kDQE',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'ZbIHELUQPhBv5StSPzC9IdU9'
});

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const amountInPaise = Math.round(amount * 100);
    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt,
      payment_capture: true,
      notes: {
        userId: req.user?._id?.toString() || 'guest',
        amount_in_rupees: amount
      }
    };
    const order = await instance.orders.create(orderOptions);
    return res.status(200).json({
      success: true,
      order: order,
      key_id: instance.key_id
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message
    });
  }
};
