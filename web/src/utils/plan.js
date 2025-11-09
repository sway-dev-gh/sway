/**
 * Get the effective user plan, checking for admin plan override first
 * @param {object} user - The user object from localStorage
 * @returns {string} The effective plan ('free' or 'pro')
 */
export function getEffectivePlan(user) {
  const adminPlanOverride = localStorage.getItem('adminPlanOverride')
  if (adminPlanOverride) {
    return adminPlanOverride
  }
  return user?.plan || 'free'
}

/**
 * Check if user has at least the specified plan level
 * @param {object} user - The user object from localStorage
 * @param {string} requiredPlan - The minimum required plan ('free' or 'pro')
 * @returns {boolean} True if user has at least the required plan
 */
export function hasMinimumPlan(user, requiredPlan) {
  const effectivePlan = getEffectivePlan(user)

  const planLevels = {
    'free': 0,
    'pro': 1
  }

  return planLevels[effectivePlan] >= planLevels[requiredPlan]
}
