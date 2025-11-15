import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import CourseManager from '../courses/CourseManager';
import StudyGroups from './StudyGroups';
import PeerSuggestions from './PeerSuggestions';
import ChatList from '../chat/ChatList';
import UserSessionsCalendar from './UserSessionsCalendar';
import CalendarPage from '../calendar/CalendarPage';
import { useCourses } from '../../contexts/CoursesContext';
import { 
  GraduationCap, 
  Users, 
  UserPlus, 
  BookOpen, 
  MessageSquare, 
  Calendar 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';

const API_BASE_URL = "http://localhost:8080/courses"; 

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { enrolledCourses } = useCourses();
  const [stats, setStats] = useState({
    enrolledCourses: parseInt(localStorage.getItem('EnrolledCourses')) || 0,
    studyGroups: 0,
    suggestedPeers: 0
  });

  useEffect(() => {
    if (!user) return;
    
    // ✅ Move loadDashboardStats function inside useEffect to avoid hook rule violations
    const loadDashboardStats = async () => {
      try {
        const userId = user?.id || localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        // 1️⃣ Load enrolled courses count (cached)
        const cachedCount = parseInt(localStorage.getItem("EnrolledCourses")) || 0;
        setStats(prev => ({ ...prev, enrolledCourses: cachedCount }));

        // Try to fetch from backend, but don't fail if unavailable (demo mode)
        try {
          // 2️⃣ Fetch enrolled courses
          const courseResponse = await fetch(`${API_BASE_URL}/enrolled/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            const enrolledCount = Array.isArray(courseData)
              ? courseData.length
              : courseData.count || 0;

            setStats(prev => ({ ...prev, enrolledCourses: enrolledCount }));
            localStorage.setItem("EnrolledCourses", enrolledCount);
          }
        } catch (e) {
          console.warn("Could not fetch courses (backend unavailable):", e.message);
          // Use demo data
          setStats(prev => ({ ...prev, enrolledCourses: 3 }));
        }

        try {
          // 3️⃣ Fetch joined groups
          const groupResponse = await fetch(`http://localhost:8080/api/groups/joined/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            const joinedGroupsCount = Array.isArray(groupData)
              ? groupData.length
              : groupData.count || 0;
            setStats(prev => ({ ...prev, studyGroups: joinedGroupsCount }));
          }
        } catch (e) {
          console.warn("Could not fetch groups (backend unavailable):", e.message);
          // Use demo data
          setStats(prev => ({ ...prev, studyGroups: 2 }));
        }

        try {
          // 4️⃣ Fetch suggested peers
          const peersResponse = await fetch(`http://localhost:8080/courses/${userId}/peers`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          if (peersResponse.ok) {
        const peersData = await peersResponse.json();
        const suggestedPeersCount = Array.isArray(peersData)
          ? peersData.length
          : peersData.count || 0;
        setStats(prev => ({ ...prev, suggestedPeers: suggestedPeersCount }));
      }
        } catch (e) {
          console.warn("Could not fetch peers (backend unavailable):", e.message);
          // Use demo data
          setStats(prev => ({ ...prev, suggestedPeers: 5 }));
        }

      } catch (error) {
        console.error("Error in loadDashboardStats:", error);
        // Set default demo stats
        setStats({
          enrolledCourses: 3,
          studyGroups: 2,
          suggestedPeers: 5
        });
      }
    };
    
    loadDashboardStats();
  }, [user]);



  const tabs = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'groups', name: 'Study Groups', icon: Users },
    { id: 'peers', name: 'Find Peers', icon: UserPlus },
    { id: 'chats', name: 'Messages', icon: MessageSquare },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
  ];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="card-interactive h-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "p-3 rounded-xl",
              color === 'blue' && 'bg-primary/10 text-primary',
              color === 'green' && 'bg-success/10 text-success',
              color === 'purple' && 'bg-purple-100 text-purple-600'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const OverviewTab = () => (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Section */}
      <Card className="gradient-soft border-0">
        <CardContent className="p-8">
          <div className="mb-8">
            <motion.h1 
              className="text-4xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Welcome back, {localStorage.getItem("name")?.split(" ")[0]}! 👋
            </motion.h1>
            <motion.p 
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Ready to connect with your study partners and ace your courses?
            </motion.p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard title="Enrolled Courses" value={stats.enrolledCourses} icon={BookOpen} color="blue" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard title="Study Groups" value={stats.studyGroups} icon={Users} color="green" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >{/*{alert(stats.suggestedPeers)}*/}
          <StatCard title="Suggested Peers" value={stats.suggestedPeers} icon={UserPlus} color="purple" />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.button 
                onClick={() => setActiveTab('courses')} 
                className="p-6 border border-border rounded-xl hover:bg-primary/5 hover:border-primary/20 text-left transition-all duration-200 hover:-translate-y-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BookOpen className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Manage Courses</h4>
                <p className="text-sm text-muted-foreground">Add or remove courses</p>
              </motion.button>
              <motion.button 
                onClick={() => setActiveTab('groups')} 
                className="p-6 border border-border rounded-xl hover:bg-success/5 hover:border-success/20 text-left transition-all duration-200 hover:-translate-y-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="h-8 w-8 text-success mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Study Groups</h4>
                <p className="text-sm text-muted-foreground">Join or create groups</p>
              </motion.button>
              <motion.button 
                onClick={() => setActiveTab('peers')} 
                className="p-6 border border-border rounded-xl hover:bg-purple-50 hover:border-purple-200 text-left transition-all duration-200 hover:-translate-y-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="h-8 w-8 text-purple-600 mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Find Peers</h4>
                <p className="text-sm text-muted-foreground">Connect with classmates</p>
              </motion.button>
              <motion.button 
                onClick={() => window.location.href = '/profile'} 
                className="p-6 border border-border rounded-xl hover:bg-warning/5 hover:border-warning/20 text-left transition-all duration-200 hover:-translate-y-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GraduationCap className="h-8 w-8 text-warning mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Update Profile</h4>
                <p className="text-sm text-muted-foreground">Edit your information</p>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Sessions across groups */}
      <UserSessionsCalendar />

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <motion.div 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Mike Chen</span> joined your study group
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </motion.div>
              <motion.div 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Emma Wilson</span> enrolled in Calculus II
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </motion.div>
              <motion.div 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Sarah Johnson</span> wants to connect with you
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Tab Navigation */}
      <div className="border-b border-border mb-8 overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 py-3 px-4 whitespace-nowrap font-medium text-sm rounded-t-xl transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>


      {/* Tab Content */}
      <motion.div 
        className="bg-card rounded-2xl shadow-soft border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'courses' && <CourseManager />}
          {activeTab === 'groups' && <StudyGroups />}
          {activeTab === 'peers' && <PeerSuggestions />}
          {activeTab === 'chats' && <ChatList />}
          {activeTab === 'calendar' && <CalendarPage />}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
