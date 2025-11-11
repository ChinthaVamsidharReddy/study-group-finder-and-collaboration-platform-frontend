import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import { 
  CalendarIcon, 
  PlusIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import SessionForm from '../chat/SessionForm';
import SessionDetailModal from '../chat/SessionDetailModal';

// TODO: Replace with environment variable
// const API_BASE = "https://study-group-finder-and-collaboration.onrender.com/api";

const API_BASE = "http://localhost:8080/api"
const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Load user's joined groups
  useEffect(() => {
    const loadUserGroups = async () => {
      try {
        // TODO: API Integration - Fetch user's joined groups
        // Backend endpoint: GET /api/groups/joined/{userId}
        // Headers: Authorization: Bearer {token}
        const response = await fetch(`${API_BASE}/groups/joined/${userId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const groups = await response.json();
          setUserGroups(groups || []);
        }
      } catch (error) {
        console.error('Error loading user groups:', error);
        // Fallback to demo data if API fails
        setUserGroups([]);
      }
    };

    if (userId && token) {
      loadUserGroups();
    }
  }, [userId, token]);

  // Load sessions for all user's groups
  useEffect(() => {
    const loadAllSessions = async () => {
      setLoading(true);
      try {
        const allSessions = [];
        
        // TODO: API Integration - Fetch sessions for each group
        // Backend endpoint: GET /api/groups/{groupId}/sessions
        // Headers: Authorization: Bearer {token}
        for (const group of userGroups) {
          try {
            const response = await fetch(`${API_BASE}/groups/${group.id}/sessions`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const groupSessions = await response.json();
              // Add group information to each session
              const sessionsWithGroup = (groupSessions || []).map(session => ({
                ...session,
                groupName: group.name,
                groupId: group.id,
                courseName: group.coursename || group.courseId
              }));
              allSessions.push(...sessionsWithGroup);
            }
          } catch (error) {
            console.error(`Error loading sessions for group ${group.id}:`, error);
          }
        }
        
        setSessions(allSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userGroups.length > 0) {
      loadAllSessions();
    } else {
      setLoading(false);
    }
  }, [userGroups, token]);

  // Get sessions for a specific date
  // const getSessionsForDate = (date) => {
  //   const dateStr = date.toISOString().split('T')[0];
  //   return sessions.filter(session => {
  //     if (!session.startTime) return false;
  //     const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
  //     return sessionDate === dateStr;
  //   });
  // };

  /// new code 

  const getSessionsForDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  return sessions.filter(session => {
    if (!session.startTime) return false;
    const sessionDate = new Date(session.startTime);
    return (
      sessionDate.getFullYear() === year &&
      sessionDate.getMonth() === month &&
      sessionDate.getDate() === day
    );
  });
};
  // Get sessions for current week
  const getSessionsForWeek = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return sessions.filter(session => {
      if (!session.startTime) return false;
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });
  };

  // Format time for display
  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Custom tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const daysSessions = getSessionsForDate(date);
      if (daysSessions.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {daysSessions.slice(0, 2).map((session, index) => (
              <div
                key={session.id || index}
                className={`w-2 h-2 rounded-full ${
                  session.confirmed ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                title={session.title}
              />
            ))}
            {daysSessions.length > 2 && (
              <div className="text-xs text-gray-600">+{daysSessions.length - 2}</div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Handle session creation
  // const handleSessionCreated = async (sessionData) => {
  //   try {
  //     // TODO: API Integration - Create new session
  //     // Backend endpoint: POST /api/groups/{groupId}/sessions
  //     // Headers: Authorization: Bearer {token}, Content-Type: application/json
  //     // Body: sessionData
      
  //     const response = await fetch(`${API_BASE}/groups/${sessionData.groupId}/sessions`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(sessionData)
  //     });

  //     if (response.ok) {
  //       const newSession = await response.json();
  //       // Add to local state with group info
  //       const sessionWithGroup = {
  //         ...newSession,
  //         groupName: userGroups.find(g => g.id === sessionData.groupId)?.name,
  //         groupId: sessionData.groupId,
  //         courseName: userGroups.find(g => g.id === sessionData.groupId)?.coursename
  //       };
  //       setSessions(prev => [...prev, sessionWithGroup]);
  //       setShowSessionForm(false);
  //     }
  //   } catch (error) {
  //     console.error('Error creating session:', error);
  //   }
  // };


  //new code

  const handleSessionCreated = (sessionData) => {
  const sessionWithGroup = {
    ...sessionData,
    groupName: userGroups.find(g => g.id === sessionData.groupId)?.name,
    courseName: userGroups.find(g => g.id === sessionData.groupId)?.coursename
  };
  setSessions(prev => {
    if (prev.some(s => String(s.id) === String(sessionData.id))) return prev;
    return [...prev, sessionWithGroup];
  });
  setShowSessionForm(false);
};
  // Render month view
  const renderMonthView = () => (
    <div className="calendar-container bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden">
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={({ date }) => {
          const dayEvents = getSessionsForDate(date);
          if (dayEvents.length > 0) {
            return (
              <div className="calendar-tile-content">
                {dayEvents.slice(0, 2).map((event, index) => (
                  <div 
                    key={index} 
                    className="calendar-event text-xs"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="calendar-more text-xs">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            );
          }
          return null;
        }}
        className="calendar-component w-full"
        onClickDay={(date) => {
          setSelectedDate(date);
          setView('day');
        }}
        formatShortWeekday={(locale, date) => {
          const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          // Return full names for larger screens, short names handled by CSS media queries
          return fullNames[date.getDay()];
        }}
        formatMonthYear={(locale, date) => ''}
        showNavigation={false}
        tileClassName={({ date, view }) => {
          if (view === 'month') {
            const classes = ['calendar-tile'];
            const today = new Date();
            const dayEvents = getSessionsForDate(date);
            
            if (date.toDateString() === today.toDateString()) {
              classes.push('calendar-today');
            }
            
            if (date.toDateString() === selectedDate.toDateString()) {
              classes.push('calendar-selected');
            }
            
            if (dayEvents.length > 0) {
              classes.push('calendar-has-events');
            }
            
            return classes.join(' ');
          }
          return null;
        }}
      />
    </div>
  );

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="week-view-container bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map(day => {
            const daySessions = getSessionsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            
            return (
              <div
                key={day.toISOString()}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 min-h-[120px] ${
                  isToday 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-200 dark:ring-blue-800' 
                    : isSelected 
                      ? 'border-blue-300 bg-blue-25 dark:bg-blue-800/30' 
                      : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-center mb-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide">
                    {day.toLocaleDateString([], { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold mt-1 ${
                    isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {daySessions.slice(0, 3).map(session => (
                    <button
                      key={session.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className={`w-full text-xs p-2 rounded text-left transition-all duration-200 hover:shadow-sm block ${
                        session.confirmed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/40'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                      }`}
                    >
                      <div className="font-medium leading-tight">{formatTime(session.startTime)}</div>
                      <div className="truncate text-xs opacity-90 mt-0.5">{session.title}</div>
                    </button>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-dark-textSecondary text-center py-1 bg-gray-100 dark:bg-dark-input rounded border border-gray-200 dark:border-dark-border">
                      +{daySessions.length - 3} more
                    </div>
                  )}
                  {daySessions.length === 0 && (
                    <div className="text-xs text-gray-400 dark:text-dark-textMuted text-center py-3 italic">
                      No sessions
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const daySessions = getSessionsForDate(selectedDate).sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );

    return (
      <div className="day-view-container bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatDate(selectedDate)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-1">
            {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        
        {daySessions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-dark-input rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions scheduled</h4>
            <p className="text-gray-500 dark:text-dark-textSecondary mb-4">
              You don't have any study sessions planned for this day.
            </p>
            <button
              onClick={() => setShowSessionForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Schedule a session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {daySessions.map((session, index) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full text-left p-5 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                        session.confirmed ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {session.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.confirmed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      }`}>
                        {session.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-dark-textSecondary">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                        <span>{session.groupName}</span>
                        {session.courseName && (
                          <span className="text-gray-400">• {session.courseName}</span>
                        )}
                      </div>
                    </div>
                    
                    {session.description && (
                      <p className="text-sm text-gray-600 dark:text-dark-textSecondary mt-3 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
            
            {/* Add new session button */}
            <button
              onClick={() => setShowSessionForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-dark-textSecondary group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <PlusIcon className="h-5 w-5" />
                <span className="font-medium">Add another session</span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
        <div className="flex-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Study Sessions Calendar</h2>
          <p className="text-gray-600 dark:text-dark-textSecondary mt-1">
            Manage and track your study sessions across all groups
          </p>
          {sessions.length > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {sessions.length} total session{sessions.length !== 1 ? 's' : ''} scheduled
            </p>
          )}
        </div>
        
        <button
          onClick={() => setShowSessionForm(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium min-w-fit"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="hidden sm:inline">New Session</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* View Controls */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
                else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
                else newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
              className="p-2 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white min-w-[180px] lg:min-w-[220px] text-center">
              {view === 'month' && selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              {view === 'week' && `Week of ${selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {view === 'day' && selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
                else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
                else newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
              className="p-2 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              aria-label="Next"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Today Button */}
          <div className="flex justify-center lg:justify-start">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800"
            >
              Today
            </button>
          </div>

          {/* View Type Buttons */}
          <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {['month', 'week', 'day'].map(viewType => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-[70px] ${
                  view === viewType
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Session Form Modal */}
      {showSessionForm && (
        <SessionForm
          groups={userGroups}
          onClose={() => setShowSessionForm(false)}
          onSessionCreated={handleSessionCreated}
          initialDate={selectedDate}
        />
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onRsvp={() => {}}
          onVote={() => {}}
          onFinalize={() => {}}
          isCreator={selectedSession.createdBy === userId}
        />
      )}
    </div>
  );
};

export default CalendarPage;










