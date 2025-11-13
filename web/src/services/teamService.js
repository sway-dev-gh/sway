/**
 * Team Management Service
 * Handles all team-related API operations
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class TeamService {
  // Helper method for making authenticated requests
  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get team overview (members, pending invitations, teams user is part of)
  async getTeamOverview() {
    try {
      return await this.makeRequest('/team');
    } catch (error) {
      console.error('Error fetching team overview:', error);
      throw error;
    }
  }

  // Invite a new team member
  async inviteTeamMember({ email, role, projectId, message, permissions }) {
    try {
      return await this.makeRequest('/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email,
          role: role || 'viewer',
          project_id: projectId,
          message,
          permissions
        })
      });
    } catch (error) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  }

  // Get pending invitations for current user
  async getPendingInvitations() {
    try {
      return await this.makeRequest('/team/invitations');
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }

  // Accept a team invitation
  async acceptInvitation(invitationToken) {
    try {
      return await this.makeRequest('/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({
          invitation_token: invitationToken
        })
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Remove a team member
  async removeTeamMember(memberId) {
    try {
      return await this.makeRequest(`/team/${memberId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  // Helper methods for role and permission management
  getRoleDisplayName(role) {
    const roleNames = {
      'viewer': 'Viewer',
      'editor': 'Editor',
      'reviewer': 'Reviewer'
    };
    return roleNames[role] || role;
  }

  getRoleDescription(role) {
    const descriptions = {
      'viewer': 'Can view projects and files',
      'editor': 'Can view and edit content',
      'reviewer': 'Can view and review content'
    };
    return descriptions[role] || 'Unknown role';
  }

  getRoleColor(role) {
    const colors = {
      'viewer': 'text-blue-400 bg-blue-900/20',
      'editor': 'text-green-400 bg-green-900/20',
      'reviewer': 'text-yellow-400 bg-yellow-900/20'
    };
    return colors[role] || 'text-gray-400 bg-gray-900/20';
  }

  getPermissionDisplayName(permission) {
    const permissionNames = {
      'can_view': 'View Projects',
      'can_edit': 'Edit Content',
      'can_review': 'Review Changes',
      'can_invite': 'Invite Members'
    };
    return permissionNames[permission] || permission;
  }

  // Get default permissions for a role
  getDefaultPermissions(role) {
    const defaultPermissions = {
      'viewer': { can_view: true, can_edit: false, can_review: false, can_invite: false },
      'editor': { can_view: true, can_edit: true, can_review: false, can_invite: false },
      'reviewer': { can_view: true, can_edit: false, can_review: true, can_invite: false }
    };
    return defaultPermissions[role] || defaultPermissions.viewer;
  }

  // Format invitation expiration time
  formatExpirationTime(expiresAt) {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration - now;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    } else if (diffMs > 0) {
      return 'Less than 1 hour remaining';
    } else {
      return 'Expired';
    }
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime(dateString) {
    if (!dateString) return 'Unknown';

    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return this.formatDate(dateString);
  }
}

export default new TeamService();