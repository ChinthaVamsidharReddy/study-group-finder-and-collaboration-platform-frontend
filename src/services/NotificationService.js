/**
 * NotificationService - Utility class for handling different types of notifications
 * Supports browser notifications, email notifications, and session reminders
 */

class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  /**
   * Request notification permission from the user
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!this.isSupported) return 'denied';
    
    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body/message
   * @param {string} options.icon - Notification icon URL
   * @param {string} options.tag - Unique tag for the notification
   * @param {number} options.autoClose - Auto close delay in milliseconds
   */
  showNotification({ title, body, icon = '/favicon.ico', tag, autoClose = 5000 }) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Browser notifications not supported or not permitted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        tag,
        requireInteraction: false,
        silent: false
      });

      // Auto close after specified time
      if (autoClose > 0) {
        setTimeout(() => {
          notification.close();
        }, autoClose);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show session reminder notification
   * @param {Object} session - Session object
   * @param {number} minutesBefore - Minutes before session start
   */
  showSessionReminder(session, minutesBefore) {
    const title = 'Study Session Reminder';
    const body = `"${session.title}" starts in ${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`;
    
    return this.showNotification({
      title,
      body,
      tag: `session-reminder-${session.id}`,
      autoClose: 10000 // 10 seconds for reminders
    });
  }

  /**
   * Show session created notification
   * @param {Object} session - Session object
   * @param {string} groupName - Group name
   */
  showSessionCreated(session, groupName) {
    const title = 'New Session Created';
    const body = `"${session.title}" has been scheduled in ${groupName}`;
    
    return this.showNotification({
      title,
      body,
      tag: `session-created-${session.id}`
    });
  }

  /**
   * Show session updated notification
   * @param {Object} session - Session object
   * @param {string} groupName - Group name
   */
  showSessionUpdated(session, groupName) {
    const title = 'Session Updated';
    const body = `"${session.title}" in ${groupName} has been updated`;
    
    return this.showNotification({
      title,
      body,
      tag: `session-updated-${session.id}`
    });
  }

  /**
   * Show session cancelled notification
   * @param {Object} session - Session object
   * @param {string} groupName - Group name
   */
  showSessionCancelled(session, groupName) {
    const title = 'Session Cancelled';
    const body = `"${session.title}" in ${groupName} has been cancelled`;
    
    return this.showNotification({
      title,
      body,
      tag: `session-cancelled-${session.id}`,
      autoClose: 0 // Don't auto close for important notifications
    });
  }

  /**
   * Schedule reminders for a session
   * @param {Object} session - Session object
   * @param {Array<number>} reminderTimes - Array of minutes before session to remind
   * @returns {Array<number>} Array of timeout IDs for cleanup
   */
  scheduleReminders(session, reminderTimes = [30, 15, 5]) {
    const timeouts = [];
    const startTime = new Date(session.startTime);
    const now = new Date();

    reminderTimes.forEach(minutes => {
      const reminderTime = new Date(startTime.getTime() - (minutes * 60 * 1000));
      const delay = reminderTime.getTime() - now.getTime();

      // Only schedule if reminder time is in the future and within reasonable range
      if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) { // Within 7 days
        const timeoutId = setTimeout(() => {
          this.showSessionReminder(session, minutes);
        }, delay);
        
        timeouts.push(timeoutId);
      }
    });

    return timeouts;
  }

  /**
   * Clear scheduled reminders
   * @param {Array<number>} timeoutIds - Array of timeout IDs to clear
   */
  clearReminders(timeoutIds) {
    timeoutIds.forEach(id => clearTimeout(id));
  }

  /**
   * Send email notification (requires backend integration)
   * @param {Object} emailData - Email notification data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body
   * @param {string} emailData.type - Notification type
   */
  async sendEmailNotification(emailData) {
    try {
      // TODO: API Integration - Send email notification
      // Backend endpoint: POST /api/notifications/email
      // Headers: Authorization: Bearer {token}, Content-Type: application/json
      // Body: emailData
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/notifications/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Email notification failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Email notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Send session invitation emails to group members
   * @param {Object} session - Session object
   * @param {Array} members - Array of group members
   * @param {string} groupName - Name of the group
   */
  async sendSessionInvitations(session, members, groupName) {
    const emailPromises = members.map(member => {
      const emailData = {
        to: member.email,
        subject: `New Study Session: ${session.title}`,
        body: this.generateSessionInvitationEmail(session, member, groupName),
        type: 'session_invitation',
        sessionId: session.id,
        userId: member.id
      };
      
      return this.sendEmailNotification(emailData);
    });

    try {
      await Promise.allSettled(emailPromises);
      console.log(`Session invitations sent to ${members.length} members`);
    } catch (error) {
      console.error('Error sending session invitations:', error);
    }
  }

  /**
   * Generate email template for session invitation
   * @param {Object} session - Session object
   * @param {Object} member - Member object
   * @param {string} groupName - Group name
   * @returns {string} HTML email body
   */
  generateSessionInvitationEmail(session, member, groupName) {
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Study Session Scheduled!</h2>
        
        <p>Hello ${member.name || 'there'},</p>
        
        <p>A new study session has been scheduled in your group <strong>${groupName}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">${session.title}</h3>
          ${session.description ? `<p style="color: #6b7280;">${session.description}</p>` : ''}
          
          <div style="margin-top: 15px;">
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${startTime.toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}</p>
            <p style="margin: 5px 0;"><strong>👥 Group:</strong> ${groupName}</p>
          </div>
        </div>
        
        <p>Make sure to mark your calendar and prepare for the session!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/dashboard?tab=calendar" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Calendar
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated message from Study Group Finder. 
          If you have any questions, please contact your group organizer.
        </p>
      </div>
    `;
  }

  /**
   * Format notification time for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted time string
   */
  formatNotificationTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString();
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon emoji or URL
   */
  getNotificationIcon(type) {
    const icons = {
      session_reminder: '⏰',
      session_created: '📅',
      session_updated: '✏️',
      session_cancelled: '❌',
      session_confirmed: '✅',
      poll_created: '📊',
      poll_closed: '📋',
      group_invitation: '👥',
      group_joined: '🎉',
      message: '💬'
    };
    
    return icons[type] || '🔔';
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;