// SuperAdmin API Service
const BASE_URL = '/api/superadmin';

class SuperAdminAPI {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API Error');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== USER MANAGEMENT ====================

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users?${queryString}`);
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async toggleUserLock(userId, isLocked, reason = '') {
    return this.request(`/users/${userId}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ isLocked, reason }),
    });
  }

  // ==================== ADMIN MESSAGES ====================

  async sendMessage(userId, title, content) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, title, content }),
    });
  }

  // ==================== SUBMISSIONS ====================

  async getSubmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/submissions?${queryString}`);
  }

  // ==================== DATA EXPORT ====================

  async exportData(type, format) {
    const response = await fetch(
      `${BASE_URL}/export?type=${type}&format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ==================== AUDIT LOGS ====================

  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/audit-logs?${queryString}`);
  }

  // ==================== CONFIGURATION ====================

  async getSystemConfig() {
    return this.request('/config');
  }

  async updateSystemConfig(config) {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // ==================== DATABASE ====================

  async resetDatabase(environment, confirm = false) {
    return this.request('/database/reset', {
      method: 'POST',
      body: JSON.stringify({ environment, confirm }),
    });
  }

  async backupDatabase() {
    return this.request('/database/backup', {
      method: 'POST',
    });
  }
}

export default new SuperAdminAPI();
