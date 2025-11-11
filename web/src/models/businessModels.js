/**
 * SwayFiles Business Platform - Data Models
 *
 * Complete data structure for transforming SwayFiles into an all-in-one
 * professional business platform for service providers.
 */

// =============================================================================
// CORE BUSINESS MODELS
// =============================================================================

/**
 * Enhanced Client Model
 * Extends basic contact info with business relationship data
 */
export const ClientModel = {
  id: '', // Unique client identifier

  // Basic Information
  name: '',
  email: '',
  phone: '',
  company: '',

  // Business Information
  industry: '',
  businessSize: '', // small, medium, enterprise
  timezone: '',

  // Relationship Data
  status: 'active', // active, inactive, prospect, archived
  tier: 'standard', // standard, priority, premium
  source: '', // referral, website, marketing, etc.

  // Financial Information
  totalSpent: 0,
  totalProjects: 0,
  averageProjectValue: 0,
  paymentTerms: 'net30', // net30, net15, immediate

  // Metadata
  createdAt: '',
  updatedAt: '',
  lastContactDate: '',
  notes: '',
  tags: [] // Custom tags for organization
}

/**
 * Project Workspace Model
 * Central hub for all client interactions, files, and communication
 */
export const ProjectModel = {
  id: '', // Unique project identifier

  // Basic Project Info
  title: '',
  description: '',
  clientId: '', // Reference to ClientModel

  // Project Details
  type: 'service', // service, product, consultation, etc.
  category: '', // design, development, marketing, etc.
  priority: 'medium', // low, medium, high, urgent

  // Project Status & Timeline
  status: 'active', // draft, active, review, completed, cancelled, archived
  phase: 'discovery', // discovery, planning, execution, delivery, maintenance
  startDate: '',
  dueDate: '',
  completedDate: '',

  // Financial Information
  budget: 0,
  quotedAmount: 0,
  billedAmount: 0,
  paymentStatus: 'pending', // pending, partial, paid, overdue

  // Project Structure
  requirements: [], // Array of requirement objects
  deliverables: [], // Array of deliverable objects
  milestones: [], // Array of milestone objects

  // Files & Assets
  files: [], // Array of file objects
  sharedFiles: [], // Files visible to client

  // Communication
  messages: [], // Array of message objects
  lastMessageDate: '',

  // Client Access
  clientAccess: true, // Whether client can access this project
  publicUrl: '', // Public URL for client access (/project/:id)

  // Metadata
  createdAt: '',
  updatedAt: '',
  createdBy: '', // User ID who created project
  assignedTo: [], // Array of user IDs assigned to project

  // Custom Fields (for different service types)
  customFields: {} // Flexible object for additional data
}

/**
 * Message Model
 * Integrated communication system within projects
 */
export const MessageModel = {
  id: '',
  projectId: '', // Reference to ProjectModel

  // Message Details
  content: '',
  type: 'text', // text, file, system, status_update

  // Sender Information
  senderId: '', // User ID or client identifier
  senderName: '',
  senderType: 'business', // business, client, system

  // Message Properties
  isRead: false,
  isImportant: false,
  requiresResponse: false,

  // File Attachments
  attachments: [], // Array of file objects

  // Threading
  replyTo: '', // ID of message being replied to
  thread: [], // Array of reply message IDs

  // Metadata
  createdAt: '',
  editedAt: '',
  deletedAt: ''
}

/**
 * Payment & Invoice Model
 * Integrated payment processing and invoicing
 */
export const PaymentModel = {
  id: '',
  projectId: '', // Reference to ProjectModel
  clientId: '', // Reference to ClientModel

  // Invoice Details
  invoiceNumber: '',
  title: '',
  description: '',

  // Financial Information
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  currency: 'USD',

  // Line Items
  lineItems: [
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ],

  // Payment Status
  status: 'draft', // draft, sent, viewed, paid, overdue, cancelled
  paymentMethod: '', // stripe, paypal, bank_transfer, check

  // Payment Processing
  stripePaymentIntentId: '',
  paypalOrderId: '',
  transactionId: '',

  // Dates
  issuedDate: '',
  dueDate: '',
  paidDate: '',

  // Client Communication
  emailSent: false,
  remindersSent: 0,
  lastReminderDate: '',

  // Metadata
  createdAt: '',
  updatedAt: '',
  notes: ''
}

/**
 * Appointment & Scheduling Model
 * Integrated calendar and scheduling system
 */
export const AppointmentModel = {
  id: '',
  projectId: '', // Optional: Reference to ProjectModel
  clientId: '', // Reference to ClientModel

  // Appointment Details
  title: '',
  description: '',
  type: 'meeting', // meeting, call, presentation, delivery
  location: '', // Physical address or video link

  // Timing
  startTime: '',
  endTime: '',
  timezone: '',
  duration: 60, // minutes

  // Status
  status: 'scheduled', // scheduled, confirmed, cancelled, completed, no_show

  // Attendees
  attendees: [
    {
      name: '',
      email: '',
      type: 'client', // client, business, external
      status: 'pending' // pending, confirmed, declined
    }
  ],

  // Meeting Configuration
  isRecurring: false,
  recurringPattern: '', // daily, weekly, monthly
  recurringEndDate: '',

  // Preparation & Follow-up
  agenda: '',
  preparationNotes: '',
  meetingNotes: '',
  actionItems: [],
  recordingUrl: '',

  // Integration
  calendarEventId: '', // Google Calendar, Outlook, etc.
  zoomMeetingId: '',

  // Reminders
  remindersSent: [],

  // Metadata
  createdAt: '',
  updatedAt: '',
  createdBy: ''
}

/**
 * File & Document Model
 * Enhanced file management with client access control
 */
export const FileModel = {
  id: '',
  projectId: '', // Reference to ProjectModel

  // File Information
  filename: '',
  originalName: '',
  size: 0,
  mimeType: '',

  // File Organization
  category: '', // design, document, image, video, etc.
  tags: [],
  folder: '', // Organizational folder path

  // Access Control
  isSharedWithClient: false,
  requiresClientApproval: false,
  clientApprovalStatus: 'pending', // pending, approved, rejected

  // File Status
  status: 'active', // active, archived, deleted
  version: 1,
  isLatestVersion: true,
  previousVersions: [], // Array of previous file IDs

  // URLs
  url: '', // Direct file URL
  thumbnailUrl: '', // Thumbnail for images/videos
  previewUrl: '', // Preview URL for documents

  // Client Interaction
  clientViewed: false,
  clientViewedDate: '',
  clientComments: [],

  // Metadata
  uploadedBy: '', // User ID
  uploadedAt: '',
  updatedAt: '',
  description: ''
}

// =============================================================================
// COMPOSITE MODELS & RELATIONSHIPS
// =============================================================================

/**
 * Project Workspace View
 * Complete project data for client-facing workspace
 */
export const ProjectWorkspaceView = {
  // Core project information
  project: ProjectModel,

  // Related entities
  client: ClientModel,
  messages: [], // Array of MessageModel
  files: [], // Array of FileModel (client-accessible only)
  payments: [], // Array of PaymentModel
  appointments: [], // Array of AppointmentModel

  // Computed properties
  progress: {
    overall: 0, // 0-100
    milestones: [], // Progress on each milestone
    tasksCompleted: 0,
    totalTasks: 0
  },

  // Client permissions
  permissions: {
    canViewFiles: true,
    canUploadFiles: true,
    canSendMessages: true,
    canViewPayments: true,
    canMakePayments: true,
    canScheduleAppointments: true
  }
}

/**
 * Business Dashboard Analytics
 * Key metrics for business overview
 */
export const DashboardAnalytics = {
  // Project Metrics
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  projectsThisMonth: 0,

  // Client Metrics
  totalClients: 0,
  newClientsThisMonth: 0,
  clientRetentionRate: 0,

  // Financial Metrics
  totalRevenue: 0,
  monthlyRevenue: 0,
  outstandingInvoices: 0,
  averageProjectValue: 0,

  // Activity Metrics
  unreadMessages: 0,
  upcomingAppointments: 0,
  pendingApprovals: 0,

  // Recent Activity
  recentProjects: [], // Array of recent ProjectModel
  recentPayments: [], // Array of recent PaymentModel
  recentMessages: [], // Array of recent MessageModel

  // Trends
  revenueGrowth: 0, // Percentage growth
  clientGrowth: 0,
  projectGrowth: 0
}

// =============================================================================
// API RESPONSE MODELS
// =============================================================================

/**
 * Standard API Response Structure
 */
export const ApiResponse = {
  success: true,
  data: null,
  message: '',
  errors: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
}

/**
 * Real-time Event Model
 * For WebSocket communication
 */
export const RealtimeEvent = {
  type: '', // message_received, payment_completed, file_uploaded, etc.
  projectId: '',
  data: {},
  timestamp: '',
  userId: ''
}

// =============================================================================
// FORM VALIDATION SCHEMAS
// =============================================================================

/**
 * Validation rules for each model
 */
export const ValidationSchemas = {
  client: {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: 'email' },
    phone: { required: false, pattern: 'phone' }
  },

  project: {
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { required: true, minLength: 10 },
    clientId: { required: true },
    budget: { required: false, min: 0 }
  },

  payment: {
    total: { required: true, min: 0.01 },
    dueDate: { required: true },
    description: { required: true, minLength: 5 }
  },

  appointment: {
    title: { required: true, minLength: 3 },
    startTime: { required: true },
    duration: { required: true, min: 15, max: 480 }
  }
}

export default {
  ClientModel,
  ProjectModel,
  MessageModel,
  PaymentModel,
  AppointmentModel,
  FileModel,
  ProjectWorkspaceView,
  DashboardAnalytics,
  ApiResponse,
  RealtimeEvent,
  ValidationSchemas
}