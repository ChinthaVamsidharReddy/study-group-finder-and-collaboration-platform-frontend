import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationService from '../../services/NotificationService';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// const API_BASE = new URL("http://localhost:8080/api").href;

const API_BASE= new URL("http://localhost:8080/api").href;
const token = localStorage.getItem("token");

const SessionForm = ({ groupId, groups = [], onClose, onSuccess, onSessionCreated, initialDate }) => {
  // Set default group if groupId provided, otherwise use first available group
  const defaultGroupId = groupId || (groups.length > 0 ? groups[0].id : null);
  
  // Notification hooks
  const { createNotification, scheduleSessionReminders } = useNotifications();
  
  // Format initial date for datetime-local input
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  
  const [formData, setFormData] = useState({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  isPoll: false,
  reminderOptions: [30, 15, 14],
  timeSlots: [{ startTime: '', endTime: '' }],
  groupId: defaultGroupId,
  emailInvitations: true,
  browserNotifications: true,
});

const [loading, setLoading] = useState(false);

// ✅ Format IST time in proper ISO format (no quotes around T)
const convertToISTString = (dateString) => {
if (!dateString) return null;
return dayjs(dateString).format("YYYY-MM-DDTHH:mm:ss");
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const selectedGroupId = formData.groupId || groupId;
      
      const payload = {
        title: formData.title,
        description: formData.description,
        reminderOptions: formData.reminderOptions,
        createdBy: userId ? parseInt(userId, 10) : null,
        groupId: selectedGroupId,
        confirmed: false,
      };

      if (formData.isPoll) {
        // Poll session with multiple time slots
       if (formData.isPoll) {
          // ✅ Poll session with multiple validated time slots
          payload.isPoll = true;

          const now = dayjs();
          const validSlots = [];

          for (let i = 0; i < formData.timeSlots.length; i++) {
            const slot = formData.timeSlots[i];

            // Check if both fields are filled
            if (!slot.startTime || !slot.endTime) {
              alert(`Please fill in both start and end times for slot ${i + 1}.`);
              setLoading(false);
              return;
            }

            const start = dayjs(slot.startTime);
            const end = dayjs(slot.endTime);

            // ⛔ Prevent selecting a past start time
            if (start.isBefore(now)) {
              alert(`Slot ${i + 1}: Start time cannot be in the past.`);
              setLoading(false);
              return;
            }

            // ⛔ Ensure end time is after start time
            if (end.isBefore(start)) {
              alert(`Slot ${i + 1}: End time must be after start time.`);
              setLoading(false);
              return;
            }

            // ✅ Push only valid time slots
            validSlots.push({
              startTime: start.format("YYYY-MM-DDTHH:mm:ss"),
              endTime: end.format("YYYY-MM-DDTHH:mm:ss"),
            });
          }

          payload.timeSlots = validSlots;
        }

      // } else {
      //   // Confirmed session
      //   payload.isPoll = false;
      //   payload.startTime = convertToISTString(formData.startTime);
      //   payload.endTime = convertToISTString(formData.endTime);
      // }

      } else {
      // Combine start/end date + time fields
      if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
        alert("Please fill in all date and time fields.");
        setLoading(false);
        return;
      }

      const start = dayjs(`${formData.startDate}T${formData.startTime}`);
      const end = dayjs(`${formData.endDate}T${formData.endTime}`);
      const now = dayjs();

      if (start.isBefore(now)) {
        alert("You cannot select a past date or time for session start.");
        setLoading(false);
        return;
      }

      if (end.isBefore(start)) {
        alert("End time must be after start time.");
        setLoading(false);
        return;
      }

      payload.isPoll = false;
      payload.startTime = start.format("YYYY-MM-DDTHH:mm:ss");
      payload.endTime = end.format("YYYY-MM-DDTHH:mm:ss");
    }

      const res = await fetch(`${API_BASE}/groups/${selectedGroupId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 201) {
        let newSession;
        try { 
          newSession = await res.json(); 
        } catch {}
        
        // Create the session object with full data for notifications
        // const sessionForNotifications = {
        //   ...payload,
        //   id: newSession?.id || Date.now(), // Use returned ID or fallback
        //   groupName: groups.find(g => g.id === selectedGroupId)?.name || 'Study Group'
        // };
        
        // Create notification for session creation
        // if (formData.browserNotifications) {
        //   await createNotification({
        //     type: 'session_created',
        //     title: 'Session Created',
        //     message: `"${payload.title}" has been scheduled`,
        //     sessionId: sessionForNotifications.id,
        //     groupId: selectedGroupId
        //   });
        // }
        
        // Schedule session reminders if it's a confirmed session
        // if (!payload.isPoll && payload.startTime) {
        //   scheduleSessionReminders(sessionForNotifications);
        // }
        
        // Show browser notification
        // if (formData.browserNotifications) {
        //   NotificationService.showSessionCreated(
        //     sessionForNotifications,
        //     sessionForNotifications.groupName
        //   );
        // }
        
        // Send email invitations if enabled
        // if (formData.emailInvitations && groups.length > 0) {
        //   try {
        //     const selectedGroup = groups.find(g => g.id === selectedGroupId);
        //     if (selectedGroup?.members) {
        //       await NotificationService.sendSessionInvitations(
        //         sessionForNotifications,
        //         selectedGroup.members,
        //         selectedGroup.name
        //       );
        //     }
        //   } catch (error) {
        //     console.error('Error sending email invitations:', error);
        //     // Don't fail the entire operation for email errors
        //   }
        // }
        
        window.alert('✅ Session created successfully!');
        
        // Call appropriate callback
        // if (onSessionCreated) {
        //   onSessionCreated(sessionForNotifications); // For calendar integration
        // }
        // if (onSuccess) {
        //   onSuccess(); // For chat integration
        // }
        
        onClose();
      } else {
        let msg = 'Failed to create session';
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          msg = j.message || msg;
        } catch {
          if (text) msg = text;
        }
        alert(msg);
      }
    } catch (err) {
      console.error('Error creating session:', err);
      alert('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

    const addTimeSlot = () => {
    setFormData({
    ...formData,
    timeSlots: [...formData.timeSlots, { startTime: '', endTime: '' }],
    });
    };

    const removeTimeSlot = (index) => {
    setFormData({
    ...formData,
    timeSlots: formData.timeSlots.filter((_, i) => i !== index),
    });
    };

    const updateTimeSlot = (index, field, value) => {
    const newSlots = [...formData.timeSlots];
    newSlots[index][field] = value;
    setFormData({ ...formData, timeSlots: newSlots });
    };

return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"> <div className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"> <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border"> <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Session</h3> <button
         onClick={onClose}
         className="p-1 hover:bg-gray-100 dark:hover:bg-dark-input rounded transition"
       > <XMarkIcon className="h-5 w-5 text-gray-400" /> </button> </div>
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
          placeholder="Study Session: Algorithms Review"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
          placeholder="Discuss chapter 5 and solve practice problems..."
        />
      </div>

      {/* Group Selection - Show only if groups array is provided */}
      {groups && groups.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Study Group *
          </label>
          <select
            required
            value={formData.groupId || ''}
            onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
          >
            <option value="">Select a group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} {group.coursename && `(${group.coursename})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Session Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
          Session Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!formData.isPoll}
              onChange={() => setFormData({ ...formData, isPoll: false })}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Confirmed Session</span>
          </label>
          {/* <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={formData.isPoll}
              onChange={() => setFormData({ ...formData, isPoll: true })}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Poll (Multiple Time Slots)</span>
          </label> */}
        </div>
      </div>

      {/* Confirmed Session: Single Time */}
      {/* {!formData.isPoll && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
            />
          </div>
        </div>
      )} */}

      {/* Confirmed Session: Split Date + Time (internally) */}
{!formData.isPoll && (
  <div className="grid grid-cols-2 gap-4">
    {/* Start Date & Time */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
        Start Date & Time *
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          required
          min={dayjs().format("YYYY-MM-DD")}
          value={formData.startDate || ''}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className="w-1/2 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-input dark:text-white"
        />
        <input
          type="time"
          required
          value={formData.startTime || ''}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          className="w-1/2 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-input dark:text-white"
        />
      </div>
    </div>

    {/* End Date & Time */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
        End Date & Time *
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          required
          min={formData.startDate || dayjs().format("YYYY-MM-DD")}
          value={formData.endDate || ''}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          className="w-1/2 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-input dark:text-white"
        />
        <input
          type="time"
          required
          value={formData.endTime || ''}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          className="w-1/2 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-input dark:text-white"
        />
      </div>
    </div>
  </div>
)}


      {/* Poll Session: Multiple Time Slots */}
      {/* Poll Session: Multiple Time Slots */}
{formData.isPoll && (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
      Time Slots (Users will vote) *
    </label>

    <div className="space-y-3">
      {formData.timeSlots.map((slot, index) => {
        // Calculate min values for validation
        const now = dayjs().format("YYYY-MM-DDTHH:mm");
        const startMin = now;
        const endMin = slot.startTime || now;

        return (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                required
                min={startMin}
                value={slot.startTime}
                onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
              />
              <input
                type="datetime-local"
                required
                min={endMin}
                value={slot.endTime}
                onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-dark-input dark:text-white"
              />
            </div>

            {formData.timeSlots.length > 1 && (
              <button
                type="button"
                onClick={() => removeTimeSlot(index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Remove
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addTimeSlot}
        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        + Add Time Slot
      </button>
    </div>
  </div>
)}


      {/* Reminder Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
          Reminder Options (minutes before session)
        </label>
        <div className="flex gap-4 flex-wrap">
          {[14, 15, 30, 60, 120].map((minutes) => (
            <label key={minutes} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.reminderOptions.includes(minutes)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      reminderOptions: [...formData.reminderOptions, minutes].sort((a, b) => b - a),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      reminderOptions: formData.reminderOptions.filter((m) => m !== minutes),
                    });
                  }
                }}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{minutes}m</span>
            </label>
          ))} 
        </div>
      </div>

      {/* Notification Options */}
      {/* <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
          Notification Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.browserNotifications}
              onChange={(e) => setFormData({ ...formData, browserNotifications: e.target.checked })}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Browser notifications (show session creation and reminders)
            </span>
          </label>
          
          {groups && groups.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailInvitations}
                onChange={(e) => setFormData({ ...formData, emailInvitations: e.target.checked })}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Send email invitations to group members
              </span>
            </label>
          )}
        </div>
      </div> */}

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-dark-input transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating...' : 'Create Session'}
        </button>
      </div>
    </form>
  </div>
</div>

);
};

export default SessionForm;
