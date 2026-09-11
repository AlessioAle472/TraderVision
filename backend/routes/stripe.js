const express = require('express');
const router = express.Router();
const webhookRouter = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock'); // fallback for testing

// Endpoint to create a Stripe Checkout Session
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ 
        error: 'Payment system is not configured. Please contact support.',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      client_reference_id: req.user._id.toString(),
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Es: price_1xyz... (Piano da 10,99€)
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/markets?payment_success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Errore durante la creazione della sessione di pagamento.' });
  }
});

// Endpoint for Stripe Webhook
webhookRouter.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // req.body here is the raw buffer thanks to express.raw() in server.js
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;

      if (userId) {
        await User.findByIdAndUpdate(userId, {
          subscriptionPlan: 'pro',
          stripeCustomerId: stripeCustomerId
        });
        console.log(`User ${userId} upgraded to PRO via Stripe Checkout.`);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;

      await User.findOneAndUpdate(
        { stripeCustomerId: stripeCustomerId },
        { subscriptionPlan: 'free' }
      );
      console.log(`Customer ${stripeCustomerId} downgraded to FREE.`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

module.exports = { router, webhookRouter };
