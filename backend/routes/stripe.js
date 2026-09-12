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
        error: 'Sistema di pagamento non configurato (chiavi Stripe non impostate in ambiente).',
      });
    }

    const { interval } = req.body; // 'month' or 'year'
    const priceId = interval === 'year' 
      ? (process.env.STRIPE_YEARLY_PRICE_ID || process.env.STRIPE_PRICE_ID)
      : process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'Identificativo prezzo Stripe non configurato.' });
    }

    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      client_reference_id: req.user._id.toString(),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?payment_success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Errore durante la creazione della sessione di pagamento.' });
  }
});

// Endpoint to create a Stripe Customer Portal Session
router.post('/create-portal-session', protect, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        error: 'Stripe non è configurato. Gestione abbonamento disponibile solo in produzione.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({
        error: 'Nessun account cliente Stripe associato a questo utente.',
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe Portal session error:', error);
    res.status(500).json({ error: 'Impossibile aprire il portale di fatturazione Stripe.' });
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
