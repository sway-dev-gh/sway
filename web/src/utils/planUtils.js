/**
 * Centralized plan management utilities
 * Ensures consistent plan detection and feature gating across the app
 */

/**
 * Get the effective user plan (respects admin override)
 * @returns {string} 'free' or 'pro'
 */
export const getEffectivePlan = () => {
  try {
    // Check for admin override first
    const adminPlanOverride = localStorage.getItem('adminPlanOverride')
    if (adminPlanOverride) {
      return adminPlanOverride.toLowerCase()
    }

    // Fall back to user plan
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return (user.plan || 'free').toLowerCase()
    }

    return 'free'
  } catch (error) {
    console.error('Error getting effective plan:', error)
    return 'free'
  }
}

/**
 * Check if user is on Pro plan
 * @returns {boolean}
 */
export const isPro = () => {
  return getEffectivePlan() === 'pro'
}

/**
 * Get storage limit based on plan
 * @returns {number} Storage limit in GB
 */
export const getStorageLimit = () => {
  return isPro() ? 50 : 2
}

/**
 * Get max active forms based on plan
 * @returns {number} Max active forms (Infinity for unlimited)
 */
export const getMaxActiveForms = () => {
  return isPro() ? Infinity : 5
}

/**
 * Check if user has access to a feature
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export const hasFeatureAccess = (feature) => {
  const plan = getEffectivePlan()

  // Free tier features
  const freeFeatures = [
    'basic_upload',
    'basic_forms'
  ]

  // Pro tier features
  const proFeatures = [
    'unlimited_forms',
    'visual_builder',
    'password_protection',
    'bulk_download',
    'advanced_analytics',
    'priority_support',
    'custom_branding',
    'webhooks',
    'api_access'
  ]

  if (plan === 'pro') {
    return true // Pro has access to everything
  }

  return freeFeatures.includes(feature)
}

/**
 * Get plan display info
 * @returns {object} Plan display information
 */
export const getPlanInfo = () => {
  const plan = getEffectivePlan()

  if (plan === 'pro') {
    return {
      name: 'Pro',
      displayName: 'PRO',
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: '#ffffff'
    }
  }

  return {
    name: 'Free',
    displayName: 'FREE',
    color: '#666666',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#333333'
  }
}

/**
 * Validate if user can create a new form
 * @param {number} currentFormCount - Current number of active forms
 * @returns {object} { allowed: boolean, reason?: string }
 */
export const canCreateForm = (currentFormCount) => {
  const maxForms = getMaxActiveForms()

  if (currentFormCount >= maxForms) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${maxForms} forms on the Free plan. Upgrade to Pro for unlimited forms.`
    }
  }

  return { allowed: true }
}

/**
 * Validate if user can upload based on storage
 * @param {number} currentStorageGB - Current storage used in GB
 * @param {number} fileSize - File size to upload in bytes
 * @returns {object} { allowed: boolean, reason?: string }
 */
export const canUpload = (currentStorageGB, fileSize) => {
  const storageLimit = getStorageLimit()
  const fileSizeGB = fileSize / (1024 * 1024 * 1024)
  const newTotal = currentStorageGB + fileSizeGB

  if (newTotal > storageLimit) {
    return {
      allowed: false,
      reason: `This upload would exceed your ${storageLimit}GB storage limit. Upgrade to Pro for ${isPro() ? 'more' : '50GB of'} storage.`
    }
  }

  return { allowed: true }
}

/**
 * Format storage display
 * @param {number} usedGB - Used storage in GB
 * @returns {string} Formatted string like "1.5 GB of 50 GB"
 */
export const formatStorageDisplay = (usedGB) => {
  const limit = getStorageLimit()
  return `${usedGB.toFixed(2)} GB of ${limit} GB`
}

/**
 * Get plan comparison data
 * @returns {array} Array of plan objects for comparison
 */
export const getPlanComparison = () => {
  return [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '',
      description: 'Perfect for getting started',
      features: [
        { text: '5 active forms', highlight: false },
        { text: '2GB storage', highlight: false },
        { text: 'Basic file upload', highlight: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$15',
      period: '/month',
      description: 'For power users',
      popular: true,
      features: [
        { text: 'Unlimited forms', highlight: true },
        { text: '50GB storage', highlight: true },
        { text: 'Visual form builder', highlight: true },
        { text: 'Password protection', highlight: true },
        { text: 'Bulk download', highlight: true },
        { text: 'Advanced analytics', highlight: true },
        { text: 'Priority support', highlight: true }
      ]
    }
  ]
}
