'use client'

import { useState } from 'react'
import AppLayout from '@/components/AppLayout'

export default function Review() {
  const [showAllReviews, setShowAllReviews] = useState(false)
  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Review</h1>
          <p className="text-terminal-muted text-sm mt-1">Code reviews and pull requests</p>
        </div>

        <div className="p-6">
          {/* Main Content Area */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-terminal-text text-lg mb-2">Code Reviews</h2>
              <p className="text-terminal-muted text-sm">No pending reviews. All caught up!</p>

              <div className="mt-8">
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="border border-terminal-border text-terminal-text px-4 py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  View All Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Reviews Modal */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-4xl h-96">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Review History</h2>

            <div className="space-y-3 h-64 overflow-y-auto">
              <div className="border border-terminal-border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-terminal-text font-medium">Project Alpha - Bug Fix</div>
                  <span className="text-terminal-muted text-sm">2 days ago</span>
                </div>
                <div className="text-terminal-muted text-sm mb-2">Fixed authentication timeout issue in user login flow</div>
                <div className="flex items-center space-x-4">
                  <span className="text-terminal-text text-xs">Approved</span>
                  <span className="text-terminal-muted text-xs">Reviewed by: Sarah Johnson</span>
                </div>
              </div>

              <div className="border border-terminal-border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-terminal-text font-medium">Website Redesign - Header Component</div>
                  <span className="text-terminal-muted text-sm">1 week ago</span>
                </div>
                <div className="text-terminal-muted text-sm mb-2">Updated header navigation with new branding elements</div>
                <div className="flex items-center space-x-4">
                  <span className="text-terminal-text text-xs">Approved</span>
                  <span className="text-terminal-muted text-xs">Reviewed by: Mike Chen</span>
                </div>
              </div>

              <div className="border border-terminal-border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-terminal-text font-medium">API Integration - Payment Gateway</div>
                  <span className="text-terminal-muted text-sm">2 weeks ago</span>
                </div>
                <div className="text-terminal-muted text-sm mb-2">Integrated Stripe payment processing with error handling</div>
                <div className="flex items-center space-x-4">
                  <span className="text-terminal-text text-xs">Changes Requested</span>
                  <span className="text-terminal-muted text-xs">Reviewed by: Alex Rivera</span>
                </div>
              </div>

              <div className="border border-terminal-border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-terminal-text font-medium">Database Migration - User Schema</div>
                  <span className="text-terminal-muted text-sm">3 weeks ago</span>
                </div>
                <div className="text-terminal-muted text-sm mb-2">Added new fields for enhanced user profile management</div>
                <div className="flex items-center space-x-4">
                  <span className="text-terminal-text text-xs">Approved</span>
                  <span className="text-terminal-muted text-xs">Reviewed by: Sarah Johnson</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-terminal-muted text-sm">
                Showing 4 of 12 reviews
              </div>
              <div className="flex space-x-4">
                <button className="border border-terminal-border text-terminal-text px-3 py-1 text-sm hover:bg-terminal-hover transition-colors">
                  Load More
                </button>
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="bg-terminal-text text-terminal-bg px-3 py-1 text-sm hover:bg-terminal-muted transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}