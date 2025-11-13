/**
 * Dashboard Data Service
 * Handles API calls for dashboard data including projects, stats, and activity
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class DashboardService {
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

  // Get dashboard overview stats
  async getDashboardStats() {
    try {
      const [projects, userProfile] = await Promise.all([
        this.makeRequest('/projects'),
        this.makeRequest('/user/profile')
      ]);

      // Calculate stats from projects data
      const activeFiles = projects.filter(p => p.status === 'active').length;
      const totalCollaborators = new Set(
        projects.flatMap(p => p.members?.map(m => m.user_id) || [])
      ).size;

      // Get today's activity (simplified for now)
      const today = new Date().toISOString().split('T')[0];
      const changesToday = projects.reduce((acc, p) => {
        if (p.updated_at?.includes(today)) {
          return acc + 1;
        }
        return acc;
      }, 0);

      const inReview = projects.filter(p => p.status === 'review').length;

      return {
        activeFiles,
        collaborators: totalCollaborators,
        changesToday,
        inReview
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get recent projects (files) with activity
  async getRecentProjects() {
    try {
      const projects = await this.makeRequest('/projects');

      // Transform projects to match dashboard file structure
      const recentProjects = await Promise.all(
        projects.slice(0, 10).map(async (project) => {
          try {
            // Get project members for collaborators
            const members = await this.makeRequest(`/projects/${project.id}/members`);

            // Get project files to estimate lines/changes
            const files = await this.makeRequest(`/projects/${project.id}/files`);

            return {
              id: project.id,
              name: project.name,
              type: this.getProjectType(project.name),
              lastActivity: this.formatTimeAgo(project.updated_at),
              collaborators: members.map(m => m.username || m.email?.split('@')[0] || 'User').slice(0, 5),
              status: project.status || 'active',
              lines: files.reduce((acc, file) => acc + (file.size || 100), 0), // Estimate lines
              changes: Math.floor(Math.random() * 50) + 1, // TODO: Implement real change tracking
              description: project.description
            };
          } catch (memberError) {
            console.warn(`Could not fetch details for project ${project.id}:`, memberError);
            return {
              id: project.id,
              name: project.name,
              type: this.getProjectType(project.name),
              lastActivity: this.formatTimeAgo(project.updated_at),
              collaborators: [],
              status: project.status || 'active',
              lines: 100,
              changes: 1,
              description: project.description
            };
          }
        })
      );

      return recentProjects.sort((a, b) =>
        new Date(b.lastActivity) - new Date(a.lastActivity)
      );
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      throw error;
    }
  }

  // Get user activity feed
  async getActivityFeed() {
    try {
      // Note: Backend has activity schema but endpoint may not be implemented yet
      // For now, derive activity from projects
      const projects = await this.makeRequest('/projects');

      const activities = projects.map(project => ({
        id: project.id,
        type: 'project_update',
        description: `Updated ${project.name}`,
        timestamp: project.updated_at,
        user: 'You', // TODO: Get actual user info
        project: project.name
      }));

      return activities.slice(0, 10);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return []; // Return empty array for graceful degradation
    }
  }

  // Create a new project
  async createProject(projectData) {
    try {
      return await this.makeRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Utility methods
  getProjectType(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    const typeMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'sql': 'sql',
      'md': 'markdown',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json'
    };
    return typeMap[extension] || 'default';
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';

    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}

export default new DashboardService();