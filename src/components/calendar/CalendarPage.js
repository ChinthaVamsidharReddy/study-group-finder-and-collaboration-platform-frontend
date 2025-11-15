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
import { cn } from '../../lib/utils';

// const API_BASE = "https://study-group-finder-and-collaboration.onrender.com/api";

const API_BASE="http://localhost:8080/api"

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [showDayView, setShowDayView] = useState(false); // For single day view when clicking dates

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Load user's joined groups
  useEffect(() => {
    const loadUserGroups = async () => {
      try {
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

  // ✅ FIXED VERSION – show sessions for every date between start and end
const getSessionsForDate = (date) => {
  return sessions.filter(session => {
    if (!session.startTime || !session.endTime) return false;

    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    // normalize time to start of the day
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // ✅ return true if the date falls within start and end (inclusive)
    return checkDate >= startDate && checkDate <= endDate;
  });
};
// Convert to local date string yyyy-mm-dd for easy comparison
const today = new Date().toISOString().split("T")[0];

const todaySessions = sessions.filter(session => {
  const startDate = new Date(session.startTime).toISOString().split("T")[0];
  const endDate = new Date(session.endTime).toISOString().split("T")[0];

  // session counts if today is between start and end date
  return today >= startDate && today <= endDate;
});


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
                className={cn(
                  "w-2 h-2 rounded-full",
                  session.confirmed ? "bg-green-500" : "bg-yellow-500"
                )}
                title={session.title}
              />
            ))}
            {daysSessions.length > 2 && (
              <div className="text-xs text-muted-foreground">+{daysSessions.length - 2}</div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Handle session creation
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
  const renderMonthView = () => {
    if (showDayView) {
      // Single day view when user clicks on a date
      const daySessions = getSessionsForDate(selectedDate).sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      );

      return (
        <div className="bg-card rounded-xl border shadow-sm border-border">
          {/* Header for single day view */}
          <div className="border-b border-border p-6 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {formatDate(selectedDate)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button
                onClick={() => setShowDayView(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                ← Back to Calendar
              </button>
            </div>
          </div>

          {/* Sessions list for the selected day */}
          <div className="p-6">
            {daySessions.length === 0 ? (
              <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-medium text-foreground mb-2">No sessions scheduled</h4>
                <p className="text-muted-foreground">There are no sessions for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {daySessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="p-6 bg-card rounded-lg border border-border cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          {session.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {session.groupName || session.courseName}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {new Date(session.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                            {session.endTime && (
                              <>
                                <span className="mx-2">-</span>
                                {new Date(session.endTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </>
                            )}
                          </div>
                          {session.location && (
                            <div className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-2" />
                              {session.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        "w-3 h-3 rounded-full flex-shrink-0 mt-2",
                        session.confirmed ? "bg-green-500" : "bg-yellow-500"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Regular month calendar view
    return (
      <div className={cn(
        "bg-card rounded-xl border shadow-sm",
        "border-border w-full"
      )}>
        <div className="p-6">
          <Calendar
            onChange={(date) => {
              setSelectedDate(date);
              setShowDayView(true); // Show single day view when clicking a date
            }}
            value={selectedDate}
            tileContent={tileContent}
            className="calendar-component"
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
              return '';
            }}
          />
        </div>
        
        {/* Selected Date Details - only show when not in single day view */}
        <div className="border-t border-border p-6 bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {formatDate(selectedDate)} - Sessions
          </h3>
          {(() => {
            const daySessions = getSessionsForDate(selectedDate).sort((a, b) => 
              new Date(a.startTime) - new Date(b.startTime)
            );
            
            if (daySessions.length === 0) {
              return (
                <div className="text-center py-8 bg-card rounded-lg border border-border">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No sessions scheduled for this day</p>
                </div>
              );
            }
            
            return (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {daySessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={cn(
                      "p-4 bg-card rounded-lg border border-border cursor-pointer",
                      "hover:shadow-md hover:border-primary/50 transition-all duration-200",
                      "transform hover:scale-[1.02]"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {session.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.groupName || session.courseName}
                        </p>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                        session.confirmed ? "bg-green-500" : "bg-yellow-500"
                      )} />
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {new Date(session.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                      {session.endTime && (
                        <span className="mx-1">-</span>
                      )}
                      {session.endTime && (
                        new Date(session.endTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      )}
                    </div>
                    {session.location && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <UserGroupIcon className="h-3 w-3 mr-1" />
                        {session.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

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
      <div className={cn(
        "bg-card rounded-xl border p-4 shadow-sm",
        "border-border"
      )}>
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map(day => {
            const daySessions = getSessionsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all duration-200 min-h-[120px]",
                  isToday 
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" 
                    : isSelected 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-muted hover:shadow-sm"
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-center mb-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {day.toLocaleDateString([], { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold mt-1",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
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
                      className={cn(
                        "w-full text-xs p-2 rounded text-left transition-all duration-200 hover:shadow-sm block",
                        session.confirmed 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/40"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                      )}
                    >
                      <div className="font-medium leading-tight">{formatTime(session.startTime)}</div>
                      <div className="truncate text-xs opacity-90 mt-0.5">{session.title}</div>
                    </button>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1 bg-muted rounded border border-border">
                      +{daySessions.length - 3} more
                    </div>
                  )}
                  {daySessions.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-3 italic">
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
      <div className={cn(
        "bg-card rounded-xl border p-6 shadow-sm",
        "border-border"
      )}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            {formatDate(selectedDate)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        
        {daySessions.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium text-foreground mb-2">No sessions scheduled</h4>
            <p className="text-muted-foreground mb-4">
              You don't have any study sessions planned for this day.
            </p>
            <button
              onClick={() => setShowSessionForm(true)}
              className={cn(
                "inline-flex items-center px-4 py-2 text-primary-foreground text-sm font-medium rounded-lg",
                "bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              )}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Schedule a session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {daySessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={cn(
                  "w-full text-left p-5 border rounded-xl transition-all duration-200 hover:shadow-md group",
                  "border-border hover:bg-muted hover:border-border/80"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex-shrink-0",
                        session.confirmed ? "bg-green-500" : "bg-yellow-500"
                      )} />
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {session.title}
                      </h4>
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        session.confirmed 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                      )}>
                        {session.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        <span className="font-medium">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>{session.groupName}</span>
                        {session.courseName && (
                          <span className="text-muted-foreground">• {session.courseName}</span>
                        )}
                      </div>
                    </div>
                    
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
            
            <button
              onClick={() => setShowSessionForm(true)}
              className={cn(
                "w-full p-4 border-2 border-dashed rounded-xl transition-all duration-200 group",
                "border-border hover:border-primary hover:bg-primary/5"
              )}
            >
              <div className="flex items-center justify-center gap-2 text-muted-foreground group-hover:text-primary">
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-xl border",
        "bg-gradient-to-r from-primary/5 to-primary/10",
        "border-border/50"
      )}>
        <div className="flex-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Study Sessions Calendar</h2>
          <p className="text-muted-foreground mt-1">
            Manage and track your study sessions across all groups
          </p>
          {todaySessions.length > 0 && (
            <p className="text-sm text-primary mt-1">
              {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} happening today
            </p>
          )}

        </div>
        
        <button
          onClick={() => setShowSessionForm(true)}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 text-primary-foreground rounded-lg",
            "bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg",
            "font-medium min-w-fit"
          )}
        >
          <PlusIcon className="h-5 w-5" />
          <span className="hidden sm:inline">New Session</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* View Controls */}
      <div className={cn(
        "bg-card rounded-xl border p-4 shadow-sm",
        "border-border"
      )}>
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
              className={cn(
                "p-2 border rounded-lg transition-all duration-200",
                "border-border hover:bg-muted hover:border-border/80"
              )}
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="text-lg lg:text-xl font-semibold text-foreground min-w-[180px] lg:min-w-[220px] text-center">
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
              className={cn(
                "p-2 border rounded-lg transition-all duration-200",
                "border-border hover:bg-muted hover:border-border/80"
              )}
              aria-label="Next"
            >
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Today Button */}
          <div className="flex justify-center lg:justify-start">
            <button
              onClick={() => setSelectedDate(new Date())}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                "text-primary hover:bg-primary/10 border border-primary/50"
              )}
            >
              Today
            </button>
          </div>

          {/* View Type Buttons */}
          <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
            {['month', 'week', 'day'].map(viewType => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 min-w-[70px]",
                  view === viewType
                    ? "bg-card text-primary shadow-sm border border-border"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
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
