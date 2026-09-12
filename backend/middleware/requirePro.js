/**
 * requirePro middleware
 *
 * Checks whether the authenticated user has a PRO subscription.
 * When called on list endpoints it attaches `req.isPro` and
 * `req.freeLimit` so the controller can truncate the payload.
 *
 * Usage:
 *   router.get('/cot-data', protect, requirePro, getCotData);
 *
 * For soft-gating (return partial data + warning instead of 403):
 *   router.get('/markets', protect, softRequirePro, getMarkets);
 */

// ─── Hard gate: 403 if not PRO ──────────────────────────────────────────────
const requirePro = (req, res, next) => {
  const effectivePlan = _getEffectivePlan(req.user);
  if (effectivePlan === 'pro') {
    req.isPro = true;
    return next();
  }
  return res.status(403).json({
    error: 'pro_required',
    message: 'Questo contenuto richiede il piano Trader Vision PRO.',
    upgradeUrl: '/pricing',
  });
};

// ─── Soft gate: attach isPro + limit, let controller decide ─────────────────
const FREE_LIMIT = 3; // rows shown to free users

const softRequirePro = (req, res, next) => {
  const effectivePlan = _getEffectivePlan(req.user);
  req.isPro = effectivePlan === 'pro';
  req.freeLimit = FREE_LIMIT;
  next();
};

// ─── Helper: resolve effective plan (handles master / admin bypass & 7-day trial) ──────────
const _getEffectivePlan = (user) => {
  if (!user) return 'free';
  if (user.isMaster || user.role === 'admin') return 'pro';

  // 1. Check 7-day free trial
  if (user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) {
    return 'pro';
  }

  // 2. Check active subscription status
  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
    return 'pro';
  }

  // 3. Check expiration date
  if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) {
    return 'pro';
  }

  // 4. Fallback to explicit subscriptionPlan / plan
  return (user.subscriptionPlan === 'pro' || user.plan === 'pro') ? 'pro' : 'free';
};

module.exports = { requirePro, softRequirePro, FREE_LIMIT, _getEffectivePlan };
