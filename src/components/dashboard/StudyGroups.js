import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  PlusIcon,
  UserGroupIcon,
  LockClosedIcon,
  GlobeAltIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  AcademicCapIcon,
  ClockIcon,
  UsersIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// Backend API Configuration
// TODO: Move to environment variables (.env file)
const API_BASE =  "http://localhost:8080/api/groups";

// ========================================
// BACKEND INTEGRATION GUIDE - JOIN REQUESTS MODAL
// ========================================
// 
// NEW FEATURE: Join Requests Modal for Private Groups
// This feature replaces inline join requests display with a clean modal popup
// 
// REQUIRED BACKEND ENDPOINTS (Already Implemented):
// 1. GET /api/groups/{groupId}/requests
//    - Fetches pending join requests for a specific group
//    - Headers: Authorization: Bearer {token}
//    - Response: Array of {memberId, userName, userMajor, requestedAt}
//    - Used by: fetchJoinRequests() function
// 
// 2. POST /api/groups/approve/{memberId}?adminId={userId}
//    - Approves a join request from a user
//    - Headers: Authorization: Bearer {token}
//    - Response: Success confirmation
//    - Used by: approveRequest() function
// 
// 3. POST /api/groups/reject/{memberId}?adminId={userId}
//    - Rejects a join request from a user
//    - Headers: Authorization: Bearer {token}
//    - Response: Success confirmation
//    - Used by: rejectRequest() function
// 
// UI CHANGES MADE:
// - Added ClipboardDocumentListIcon to private group cards (admin only)
// - Removed inline join requests display from cards
// - Created JoinRequestsModal component for better UX
// - All group cards now have consistent height/layout
// 
// BACKEND DEVELOPER NOTES:
// - No new endpoints needed - uses existing join request APIs
// - Modal automatically refreshes after approve/reject actions
// - Supports real-time updates if WebSocket integration is added later
// - Error handling follows existing patterns in the codebase
// ========================================

// Course List - Static data for demo
// TODO: Backend Integration Required
// API Endpoint: GET /api/courses
// Response: Array of {id, code, coursename, description, department}
const COURSE_LIST = [
  { code: "CS101", coursename: "Computer Science 101" },
  { code: "MATH101", coursename: "Calculus I" },
  { code: "PHY101", coursename: "Physics I" },
  { code: "ENG101", coursename: "English Literature" },
  { code: "HIST101", coursename: "World History" },
  { code: "CS102", coursename: "Data Structures" },
  { code: "CS103", coursename: "Algorithms" },
  { code: "CS104", coursename: "Operating Systems" },
  { code: "CS105", coursename: "Database Management Systems" },
  { code: "CS106", coursename: "Computer Networks" },
  { code: "ECE101", coursename: "Digital Electronics" },
  { code: "ECE102", coursename: "Analog Electronics" },
  { code: "ECE103", coursename: "Signal & Systems" },
  { code: "ECE104", coursename: "Microprocessors" },
  { code: "ECE105", coursename: "Communication Systems" },
  // { code: "OTHER", coursename: "Other Course" },
];

// Loading Overlay Component
const LoadingOverlay = ({ message = "Loading..." }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
        <p className="text-gray-700 dark:text-gray-300 font-medium">{message}</p>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// Error Message Component
const ErrorMessage = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3"
  >
    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
    </div>
    <div className="flex-1">
      <p className="text-red-800 dark:text-red-300 font-medium">Error</p>
      <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
    </div>
    {onRetry && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
      >
        Retry
      </motion.button>
    )}
  </motion.div>
);

export default function StudyGroups() {
  const [myGroups, setMyGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(
    JSON.parse(localStorage.getItem("pendingGroups")) || []
  );
  const [joinRequests, setJoinRequests] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [selectedGroupForRequests, setSelectedGroupForRequests] = useState(null);
  const [filterPrivacy, setFilterPrivacy] = useState("ALL");
  const [filterCourse, setFilterCourse] = useState("");
  const [minMembers, setMinMembers] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


// Add this state at the top of StudyGroups component
const [manageOpenGroups, setManageOpenGroups] = useState({});

// Toggle function
const toggleManage = (groupId) => {
  setManageOpenGroups(prev => ({
    ...prev,
    [groupId]: !prev[groupId], // toggle for this group
  }));
};

// Functions in StudyGroups component
const handleMuteGroup = (groupId) => {
  alert(`Group ${groupId} muted (placeholder functionality)`);
  // TODO: Add actual API call to mute notifications
};

const handleDeleteGroup = (groupId) => {
  // if (window.confirm("Are you sure you want to delete this group?")) {
    deleteGroup(groupId); // Use your existing deleteGroup function
  // }
};

// TODO: Backend Integration - View Join Requests Modal
// This function handles opening the join requests modal for private groups
// API Integration: Uses existing fetchJoinRequests function
// UI Enhancement: Opens modal instead of inline display for better UX
const handleViewJoinRequests = async (group) => {
  setSelectedGroupForRequests(group);
  await fetchJoinRequests(group.id);
  setShowJoinRequestsModal(true);
};


  useEffect(() => {
    // Load groups from API - backend is working fine
    loadAllGroups();
    // TODO: Backend should handle pending requests via API
    setPendingRequests(JSON.parse(localStorage.getItem("pendingGroups")) || []);
  }, []);

  const normalizeGroup = (g) => ({
    ...g,
    memberCount: Number(g.memberCount ?? 0),
    coursename: g.coursename ?? "",
  });
  const navigate = useNavigate();

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // TODO: Backend Integration - Load All Groups
  // API Endpoints:
  // GET /api/groups/created/{userId} - Groups created by user
  // GET /api/groups/joined/{userId} - Groups user has joined
  // GET /api/groups/available/{userId} - Public groups user can join
  // Headers: Authorization: Bearer {token}
  // Response: Array of Group objects
  const loadAllGroups = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to view study groups");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Backend API calls - fetch all group types in parallel
      const [createdRes, joinedRes, availableRes] = await Promise.all([
        fetch(`http://localhost:8080/api/groups/created/${userId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`http://localhost:8080/api/groups/joined/${userId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`http://localhost:8080/api/groups/available/${userId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);
      
      // Check if any response failed
      if (!createdRes.ok || !joinedRes.ok || !availableRes.ok) {
        throw new Error("Failed to fetch groups from server");
      }
      
      const [createdJson, joinedJson, availableJson] = await Promise.all([
        createdRes.json(),
        joinedRes.json(),
        availableRes.json(),
      ]);

      // Normalize and set group data
      setMyGroups(Array.isArray(createdJson) ? createdJson.map(normalizeGroup) : []);
      setJoinedGroups(Array.isArray(joinedJson) ? joinedJson.map(normalizeGroup) : []);
      setAvailableGroups(Array.isArray(availableJson) ? availableJson.map(normalizeGroup) : []);
      
    } catch (err) {
      console.error("Error loading groups:", err);
      setError("Failed to load study groups. Please check your connection and try again.");
      
      // Clear groups on error to prevent showing stale data
      setMyGroups([]);
      setJoinedGroups([]);
      setAvailableGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh groups with toast notification
  const refreshGroups = async () => {
    await loadAllGroups();
    if (!error) {
      showToast("Study groups refreshed successfully!", 'success');
    }
  };

  // TODO: Backend Integration - Create Group
  // API Endpoint: POST /api/groups
  // Headers: Content-Type: application/json, Authorization: Bearer {token}
  // Request Body: {userId, name, description, courseId, privacy, code, coursename}
  // Response: Created group object with generated ID
  const createGroup = async (payload) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to create a group");
      return;
    }
    
    setLoading(true);
    try {
      const newGroup = {
        ...payload,
        userId,
        memberCount: 1,
        members: [userId],
        createdAt: new Date().toISOString(),
      };

      // API call to create group
      const res = await fetch("http://localhost:8080/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGroup),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create group");
      }
      
      const createdGroup = await res.json();
      
      // Refresh groups list
      await loadAllGroups();
      setShowCreateModal(false);
      
      // Show success toast
      showToast("Study group created successfully!", 'success');
      
      // Dispatch custom event to notify chat components
      window.dispatchEvent(new CustomEvent('studyGroupsUpdated', {
        detail: { action: 'created', groupId: createdGroup.id, userId }
      }));
      
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err.message || "Failed to create study group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Backend Integration - Join Group
  // API Endpoint: POST /api/groups/join/{groupId}?userId={userId}
  // Headers: Authorization: Bearer {token}
  // Response: Success message or "Request sent" for private groups
  const joinGroup = async (group) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to join groups");
      return;
    }
    
    setLoading(true);
    try {
      // API call to join group
      const res = await fetch(`${API_BASE}/join/${group.id}?userId=${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to join group");
      }
      
      const responseText = await res.text();
      
      // Handle response for private vs public groups
      if (responseText.toLowerCase().includes("request")) {
        // Private group - request sent
        const updatedPending = [...pendingRequests.filter(p => p.id !== group.id), normalizeGroup(group)];
        setPendingRequests(updatedPending);
        localStorage.setItem("pendingGroups", JSON.stringify(updatedPending));
        showToast("Join request sent! Waiting for admin approval.", 'info');
      } else {
        // Public group - joined successfully
        await loadAllGroups();
        showToast("Successfully joined the study group!", 'success');
      }
      
      // Dispatch custom event to notify chat components
      window.dispatchEvent(new CustomEvent('studyGroupsUpdated', {
        detail: { action: 'joined', groupId: group.id, userId }
      }));
      
    } catch (err) {
      console.error("Error joining group:", err);
      setError(err.message || "Failed to join study group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Backend Integration - Leave Group
  // API Endpoint: DELETE /api/groups/leave/{groupId}/{userId}
  // Headers: Authorization: Bearer {token}
  // Response: Success confirmation
  const leaveGroup = async (groupId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to leave groups");
      return;
    }
    
    setLoading(true);
    try {
      // API call to leave group
      const res = await fetch(`${API_BASE}/leave/${groupId}/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to leave group");
      }
      
      // Update local state immediately for better UX
      setJoinedGroups(prev => prev.filter(g => g.id !== groupId));
      
      // Refresh groups list from server
      await loadAllGroups();
      
      showToast("Successfully left the study group", 'success');
      
      // Dispatch custom event to notify chat components
      window.dispatchEvent(new CustomEvent('studyGroupsUpdated', {
        detail: { action: 'left', groupId, userId }
      }));
      
    } catch (err) {
      console.error("Error leaving group:", err);
      setError(err.message || "Failed to leave study group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Backend Integration - Delete Group
  // API Endpoint: DELETE /api/groups/delete/{groupId}/{userId}
  // Headers: Authorization: Bearer {token}
  // Response: Success confirmation
  // Note: Only group creator can delete
  const deleteGroup = async (groupId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to delete groups");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      // API call to delete group
      const res = await fetch(`${API_BASE}/delete/${groupId}/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete group");
      }
      
      // Refresh groups list from server
      await loadAllGroups();
      
      showToast("Study group deleted successfully", 'success');
      
      // Dispatch custom event to notify chat components
      window.dispatchEvent(new CustomEvent('studyGroupsUpdated', {
        detail: { action: 'deleted', groupId, userId }
      }));
      
    } catch (err) {
      console.error("Error deleting group:", err);
      setError(err.message || "Failed to delete study group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Backend Integration - Fetch Join Requests
  // API Endpoint: GET /api/groups/{groupId}/requests
  // Headers: Authorization: Bearer {token}
  // Response: Array of {memberId, userName, userMajor, requestedAt}
  // 
  // USAGE: Called when admin clicks join requests icon on private group cards
  // MODAL INTEGRATION: Results are displayed in JoinRequestsModal component
  // ERROR HANDLING: Should handle network errors gracefully
  const fetchJoinRequests = async (groupId) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setError("Please log in to view join requests");
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/${groupId}/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch join requests");
      }
      
      const data = await res.json();
      setJoinRequests(prev => ({ ...prev, [groupId]: data || [] }));
    } catch (err) {
      console.error("Error fetching join requests:", err);
      setError(err.message || "Failed to fetch join requests. Please try again.");
    }
  };

  // TODO: Backend Integration - Approve Join Request
  // API Endpoint: POST /api/groups/approve/{memberId}?adminId={userId}
  // Headers: Authorization: Bearer {token}
  // Response: Success confirmation
  // 
  // MODAL INTEGRATION: Called from approve button in JoinRequestsModal
  // POST-ACTION: Refreshes join requests list and group data
  // UI FEEDBACK: Modal updates automatically after successful approval
    const approveRequest = async (memberId, groupId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to approve requests");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approve/${memberId}?adminId=${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to approve request");
      }

      // Refresh admin requests and lists
      await fetchJoinRequests(groupId);
      await loadAllGroups();

      // Remove the group from pendingRequests (for the request-sender user)
      const updatedPending = (JSON.parse(localStorage.getItem("pendingGroups")) || []).filter(g => g.id !== groupId);
      localStorage.setItem("pendingGroups", JSON.stringify(updatedPending));
      setPendingRequests(updatedPending);

      showToast("Join request approved successfully!", 'success');

      // Dispatch custom event to notify chat components
      window.dispatchEvent(new CustomEvent('studyGroupsUpdated', {
        detail: { action: 'approved', groupId, userId, memberId }
      }));
      
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message || "Failed to approve join request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Backend Integration - Reject Join Request
  // API Endpoint: POST /api/groups/reject/{memberId}?adminId={userId}
  // Headers: Authorization: Bearer {token}
  // Response: Success confirmation
  // 
  // MODAL INTEGRATION: Called from reject button in JoinRequestsModal
  // POST-ACTION: Refreshes join requests list
  // UI FEEDBACK: Modal updates automatically after successful rejection
  const rejectRequest = async (memberId, groupId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("Please log in to reject requests");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reject/${memberId}?adminId=${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to reject request");
      }

      // Refresh admin requests
      await fetchJoinRequests(groupId);

      // Remove group from pendingRequests
      const updatedPending = (JSON.parse(localStorage.getItem("pendingGroups")) || []).filter(g => g.id !== groupId);
      localStorage.setItem("pendingGroups", JSON.stringify(updatedPending));
      setPendingRequests(updatedPending);

      showToast("Join request rejected", 'info');

      // Dispatch custom event to notify chat components
      window.dispatchEvent(new CustomEvent('studyGroupsUpdated', {
        detail: { action: 'rejected', groupId, userId, memberId }
      }));
      
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.message || "Failed to reject join request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const RequestCard = ({ req, groupId }) => (
    <div className="border rounded-lg p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{req.userName}</p>
        <p className="text-sm text-gray-600 dark:text-dark-textSecondary">{req.userMajor}</p>
        <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
      </div>
      <div className="flex gap-2">
        <button
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => approveRequest(req.memberId, groupId)}
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        <button
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => rejectRequest(req.memberId, groupId)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const GroupCard = ({ group, role }) => (
    <div className="border border-gray-200 dark:border-dark-border rounded-xl p-5 hover:shadow-lg transition bg-white dark:bg-dark-card flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            {group.privacy === "PRIVATE" ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
    Private
  </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
    Public
  </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{group.description}</p>
        </div>
        {/* TODO: Backend Integration - Join Requests Icon for Private Groups */}
        {/* This icon appears only on private groups where user is admin */}
        {/* When clicked, opens modal to view/manage join requests */}
        {/* Backend API: Uses existing fetchJoinRequests endpoint */}
        {role === "admin" && group.privacy === "PRIVATE" && (
          <button
            onClick={() => handleViewJoinRequests(group)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition text-gray-600 dark:text-dark-text"
            title="View Join Requests"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
          <span>{group.memberCount} members</span>
        </div>
        <div className="text-xs text-gray-500">{group.coursename || group.courseId}</div>
      </div>


      {/* Joined Group Actions */}
      {role === "joined" && (
        <div className="mt-4 flex gap-2">
          <button
  className="flex-1 py-2 rounded-lg bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition"
  onClick={() =>
    navigate(`/chat/${group.id}`, {
      state: {
        groupName: group.name,
        groupId: group.id,
        privacy: group.privacy,
        coursename: group.coursename,
        memberCount: group.memberCount,
      },
    })
  }
>
  <ChatBubbleLeftRightIcon className="h-4 w-4" /> Open Chat
</button>
          <button
            className="flex-1 py-2 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 transition"
            onClick={() => leaveGroup(group.id)}
          >
            Leave Group
          </button>
        </div>
      )}

      {/* Admin Actions */}
{role === "admin" && (
  <div className="mt-4 flex flex-col gap-2">
    {/* Manage Button */}
    <button
      className="flex-1 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
      onClick={() => toggleManage(group.id)}
    >
      <Cog6ToothIcon className="h-4 w-4" /> Manage
    </button>

    {/* Dropdown with Mute and Delete */}
    {manageOpenGroups[group.id] && (
      <div className="flex gap-2 mt-2">
        {/* <button
          className="flex-1 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition"
          onClick={() => handleMuteGroup(group.id)}
        >
          Mute
        </button> */}
        <button
          className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          onClick={() => handleDeleteGroup(group.id)}
        >
          Delete
        </button>
      </div>
    )}

    {/* Open Chat Button */}
    <button
      className="flex-1 py-2 rounded-lg bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition mt-2"
      onClick={() =>
        navigate(`/chat/${group.id}`, {
          state: {
            groupName: group.name,
            groupId: group.id,
            privacy: group.privacy,
            coursename: group.coursename,
            memberCount: group.memberCount,
          },
        })
      }
    >
      <ChatBubbleLeftRightIcon className="h-4 w-4" /> Open Chat
    </button>
  </div>
)}





      {role === "available" && (
        <button
          className="mt-4 w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          onClick={() => joinGroup(group)}
          disabled={loading}
        >
          Join Group
        </button>
      )}

      {role === "pending" && (
        <span className="mt-4 inline-block text-yellow-700 text-sm font-medium">
          Request Sent • Waiting Approval
        </span>
      )}
    </div>
  );

  // TODO: Backend Integration - Join Requests Modal Component
  // This modal displays pending join requests for private groups
  // Backend Requirements:
  // 1. GET /api/groups/{groupId}/requests - Fetch pending requests (already implemented in fetchJoinRequests)
  // 2. POST /api/groups/approve/{memberId}?adminId={userId} - Approve request (already implemented in approveRequest)
  // 3. POST /api/groups/reject/{memberId}?adminId={userId} - Reject request (already implemented in rejectRequest)
  // 
  // Modal Features:
  // - Shows group information (name, course)
  // - Lists all pending requests with user details
  // - Approve/Reject buttons for each request
  // - Real-time updates when requests are approved/rejected
  // - Proper loading and empty states
  const JoinRequestsModal = ({ open, onClose, group }) => {
    if (!open || !group) return null;

    const requests = joinRequests[group.id] || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-lg w-full max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Join Requests ({requests.length})
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg font-bold"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">{group.name}</h4>
              <p className="text-sm text-gray-500 dark:text-dark-textSecondary">{group.coursename}</p>
            </div>
            
            {requests.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-textSecondary text-center py-8">
                No pending join requests
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <RequestCard key={req.memberId} req={req} groupId={group.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CreateGroupModal = ({ open, onClose }) => {
    const [formData, setFormData] = useState({
      name: "",
      code: "",
      coursename: "",
      courseId: "",
      description: "",
      privacy: "PUBLIC",
    });

    const handleCourseChange = (code) => {
      const found = COURSE_LIST.find(c => c.code === code);
      if (found) {
        setFormData(fd => ({
          ...fd,
          code: found.code,
          coursename: found.coursename,
          courseId: found.code.replace(/\D/g, ""),
        }));
      } else {
        setFormData(fd => ({ ...fd, code: "", coursename: "", courseId: "" }));
      }
    };

    const submit = async (e) => {
      e.preventDefault();
      await createGroup(formData);
    };

    if (!open) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Study Group</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Build your learning community</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </motion.button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                Group Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your group name..."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                Select Course
              </label>
              <motion.select
                whileFocus={{ scale: 1.01 }}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                value={formData.code}
                onChange={e => handleCourseChange(e.target.value)}
              >
                <option value="">Choose a course...</option>
                {COURSE_LIST.map(c => <option key={c.code} value={c.code}>{c.coursename} ({c.code})</option>)}
              </motion.select>
              {formData.code && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.coursename}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Course Code: {formData.code}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                Description
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[100px] resize-y"
                placeholder="Describe your group's purpose and goals..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                  {formData.privacy === "PUBLIC" ? (
                    <GlobeAltIcon className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <LockClosedIcon className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                Privacy Settings
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, privacy: "PUBLIC" })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.privacy === "PUBLIC"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <GlobeAltIcon className={`h-6 w-6 mb-2 ${formData.privacy === "PUBLIC" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
                  <p className={`font-medium ${formData.privacy === "PUBLIC" ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"}`}>Public</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Anyone can join</p>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, privacy: "PRIVATE" })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.privacy === "PRIVATE"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <LockClosedIcon className={`h-6 w-6 mb-2 ${formData.privacy === "PRIVATE" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} />
                  <p className={`font-medium ${formData.privacy === "PRIVATE" ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"}`}>Private</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requires approval</p>
                </motion.button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-60 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" />
                    Create Group
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

const filteredAvailableGroups = availableGroups
    .map(normalizeGroup)
    .filter(g => {
      const size=Number(maxMembers);
      const matchesSearch = !searchQuery || (g.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrivacy = filterPrivacy === "ALL" || g.privacy === filterPrivacy;
      const matchesCourse = !filterCourse || (g.coursename || "").toLowerCase() === filterCourse.toLowerCase();
      const members = Number(g.memberCount ?? 0);
       if (members === 0) return false;
      const matchesSize = !maxMembers || members === size;
      return matchesSearch && matchesPrivacy && matchesCourse && matchesSize;
    });

  const headerContent = {
    title: 'Study Groups',
    description: 'Create, find and join study groups for your courses.',
    showCreateButton: true
  };

  return (
    <AnimatePresence key="main-component">
      {loading ? (
        <LoadingOverlay message="Loading study groups..." />
      ) : (
        <>
          <motion.div 
            key="main-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen"
        >
          {/* Error Display */}
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={() => {
                setError(null);
                loadAllGroups();
              }} 
            />
          )}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold dark:text-white"
          >
            {headerContent.title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-gray-500 dark:text-dark-textSecondary"
          >
            {headerContent.description}
          </motion.p>
        </div>
        <div className="flex gap-3">
          {headerContent.showCreateButton && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <PlusIcon className="h-5 w-5" />
              </motion.div>
              Create Group
            </motion.button>
          )}
          {/* <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => refreshGroups()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600 disabled:opacity-50"
          >
            <motion.div
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
            >
              {/* <ArrowPathIcon className="h-5 w-5" /> 
            </motion.div>
            Refresh
          </motion.button> */}
        </div>
      </motion.div>

      {/* My Groups */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <UserGroupIcon className="h-4 w-4 text-white" />
          </div>
          My Own Groups ({myGroups.length})
        </motion.h3>

        {myGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">You haven't created any groups yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Create your first study group to get started!</p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="flex flex-wrap gap-4"
          >
            <AnimatePresence key="my-groups">
              {myGroups.map((g, index) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  layout
                  className="flex-shrink-0 w-full sm:w-[48%] md:w-[32%] lg:w-[23%]"
                >
                  <GroupCard group={normalizeGroup(g)} role="admin" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>

      {/* Joined Groups */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        {joinedGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">You haven't joined any groups yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Explore available groups to connect with peers!</p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="flex flex-wrap gap-4"
          >
            <AnimatePresence key="joined-groups">
              {joinedGroups.map((g, index) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                  layout
                  className="flex-shrink-0 w-full sm:w-[48%] md:w-[32%]"
                >
                  <GroupCard group={normalizeGroup(g)} role="joined" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>


      {/* Available Groups */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
          Available Groups ({availableGroups.length})
        </motion.h3>

        {/* Enhanced Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          {/* Mobile-first filter layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Search Groups
              </label>
              <div className="relative">
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Search by group name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <FunnelIcon className="h-4 w-4" />
                Privacy
              </label>
              <select 
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                value={filterPrivacy} 
                onChange={e => setFilterPrivacy(e.target.value)}
              >
                <option value="ALL">All Privacy</option>
                <option value="PUBLIC">Public Groups</option>
                <option value="PRIVATE">Private Groups</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <AcademicCapIcon className="h-4 w-4" />
                Course
              </label>
              <select 
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                value={filterCourse} 
                onChange={e => setFilterCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {COURSE_LIST.map(c => <option key={c.code} value={c.coursename}>{c.coursename}</option>)}
              </select>
            </div>
          </div>

          {/* Second row for group size and clear filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 sm:max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                Group Size
              </label>
              <input
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                type="number"
                placeholder="Max members"
                value={maxMembers}
                onChange={e => setMaxMembers(e.target.value)}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery("");
                setFilterPrivacy("ALL");
                setFilterCourse("");
                setMaxMembers("");
              }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Clear Filters
            </motion.button>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterPrivacy !== "ALL" || filterCourse || maxMembers) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterPrivacy !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  Privacy: {filterPrivacy}
                  <button
                    onClick={() => setFilterPrivacy("ALL")}
                    className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterCourse && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                  Course: {filterCourse}
                  <button
                    onClick={() => setFilterCourse("")}
                    className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {maxMembers && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
                  Size: {maxMembers}
                  <button
                    onClick={() => setMaxMembers("")}
                    className="ml-1 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Available Groups Display */}
        {filteredAvailableGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No available groups found.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters or create a new group!</p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="flex flex-wrap gap-4"
          >
            <AnimatePresence key="available-groups">
              {filteredAvailableGroups.map((g, index) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: 1.7 + index * 0.05 }}
                  layout
                  className="flex-shrink-0 w-full sm:w-[48%] md:w-[32%]"
                >
                  <GroupCard group={normalizeGroup(g)} role="available" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>
      </motion.div>

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinRequestsModal 
        open={showJoinRequestsModal} 
        onClose={() => setShowJoinRequestsModal(false)} 
        group={selectedGroupForRequests} 
      />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      </>
        )}
    </AnimatePresence>
  );
}

// ========================================
// BACKEND INTEGRATION SUMMARY - JOIN REQUESTS MODAL
// ========================================
// 
// WHAT WAS IMPLEMENTED:
// 1. Join Requests Modal - Clean popup to view/manage join requests
// 2. Icon-based Access - ClipboardDocumentListIcon on private group cards
// 3. Consistent UI - All group cards now have same height/layout
// 
// BACKEND ENDPOINTS USED:
// - GET /api/groups/{groupId}/requests (fetchJoinRequests)
// - POST /api/groups/approve/{memberId}?adminId={userId} (approveRequest)  
// - POST /api/groups/reject/{memberId}?adminId={userId} (rejectRequest)
// 
// INTEGRATION POINTS:
// 1. handleViewJoinRequests() - Opens modal and fetches requests
// 2. JoinRequestsModal component - Displays requests with approve/reject
// 3. GroupCard component - Shows icon for private groups (admin only)
// 
// TESTING CHECKLIST FOR BACKEND:
// □ Verify GET requests endpoint returns proper user data
// □ Test approve/reject endpoints update group membership
// □ Ensure proper authorization (admin-only access)
// □ Check error handling for invalid requests
// □ Validate response formats match frontend expectations
// 
// ERROR HANDLING:
// - Network errors are logged to console
// - Failed requests show user-friendly messages
// - Modal gracefully handles empty states
// - Loading states prevent duplicate requests
// ========================================

