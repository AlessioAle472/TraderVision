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

// ─── Helper: resolve effective plan (handles master / admin bypass) ──────────
const _getEffectivePlan = (user) => {
  if (!user) return 'free';
  if (user.isMaster || user.role === 'admin') return 'pro';
  // Prefer subscriptionPlan, fall back to plan for backward compat
  return user.subscriptionPlan || user.plan || 'free';
};

module.exports = { requirePro, softRequirePro, FREE_LIMIT };
