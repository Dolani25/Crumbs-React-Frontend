import { useState, useEffect } from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Module from './Module.jsx';
import Reader from './Reader.jsx';
import Hero from './pages/Hero.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Activity from './pages/Activity.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Profile from './pages/Profile.jsx';
import Community from './pages/Community.jsx';
import Library from './pages/Library.jsx';
import Chat from './pages/Chat.jsx';
import Feed from './pages/Feed.jsx';
import QuizDashboard from './pages/QuizDashboard.jsx';
import Planner from './pages/Planner.jsx';
import Pinned from './pages/Pinned.jsx';
import About from './pages/About.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import { dummyCourses } from './dummyCourses.js';
import { loadUser, syncCourses, updateXP, deleteCourse } from './api.js';

import { secureStorage } from './utils/secureStorage.js';

function App() {
  const location = useLocation();

  // Routes where we hide the global Header/Footer
  const isPublicRoute = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';
  const isReaderRoute = location.pathname.startsWith('/course/');

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Courses State - Initialized empty, loaded via effect
  const [courses, setCourses] = useState([]);

  // Sync State
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = () => setIsDirty(true);

  // Check Auth on Mount
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Migrate Legacy Data if needed
      await secureStorage.migrateFromLocalStorage();

      const token = await secureStorage.getItem('crumbs_token');
      if (token) {
        try {
          const userData = await loadUser(); // Verify token is valid & get user data
          setUser({ ...userData, is_authenticated: true });

          // 🔧 CRITICAL: Only load/sync cloud data after confirming user identity
          // This prevents "Data Contamination" from a previous user's localStorage

          const local = (await secureStorage.getItem('crumbs_courses')) || [];

          if (local.length > 0) {
            const normalizedLocal = local.flat().map(c => ({
              ...c,
              title: c.title || c.name || "Untitled Course"
            }));

            // Sync with Cloud Truth
            // If local courses belong to another user (backend check), the sync will reject them
            // or the backed will just return the valid user courses.
            try {
              const cloudCourses = await syncCourses(normalizedLocal);
              setCourses(cloudCourses);
              await secureStorage.setItem('crumbs_courses', cloudCourses);
              console.log("☁️  Secure Sync Complete");
            } catch (syncErr) {
              console.warn("Sync warning:", syncErr);
              // Fallback: If sync fails (e.g. data conflict), fetch fresh from cloud
              const fresh = await syncCourses([]);
              if (fresh) setCourses(fresh);
            }
          } else {
            // EMPTY LOCAL: Fetch from Cloud (Pull Strategy)
            const cloudCourses = await syncCourses([]);
            if (cloudCourses && cloudCourses.length > 0) {
              setCourses(cloudCourses);
              await secureStorage.setItem('crumbs_courses', cloudCourses);
            }
          }

        } catch (err) {
          console.error("Auth Failed:", err);
          // If token is invalid, clear everything to be safe
          setUser(null);
          // secureStorage.setItem('crumbs_token', null); // Handled by clearAll
          setCourses([]); // Clear potential leaked data
          secureStorage.clearAll();
        }
      } else {
        // No Token = No User = No Data
        setCourses([]);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Sync Logic: Watch 'isDirty' and user state
  useEffect(() => {
    if (!user || courses.length === 0) return;

    // Optimized Auto-Sync
    const optimizedSync = async () => {
      // 1. If no local changes (clean), skip hash check entirely? 
      // User requested hash comparison "before full lesson sync". 
      // But purely relying on 'isDirty' misses changes from other devices (Pull).
      // So we should verify hashes periodically regardless of dirty state to catch *remote* changes.

      try {
        const normalized = courses
          .flat()
          .filter(c => c && (c.title || c.name) && (c.title !== "Untitled Course" || c.subtopics))
          .map(c => {
            // ... normalization logic matching previous code ...
            let finalTopics = c.topics || [];
            if ((!finalTopics || finalTopics.length === 0) && c.subtopics && c.subtopics.length > 0) {
              finalTopics = [{
                title: "Course Modules",
                icon: "fas fa-layer-group",
                subtopics: c.subtopics
              }];
            }
            return {
              ...c,
              title: c.title || c.name || "Untitled Course",
              topics: finalTopics
            };
          });

        if (normalized.length === 0) return;

        // 2. Hash Comparison (Bandwidth Saver)
        const { hashCompareCourses, syncCourses } = await import('./api.js');
        const comparison = await hashCompareCourses(normalized);

        if (comparison.conflicts.length === 0) {
          console.log("✅ Sync: All clear (Hashes matched)");
          setIsDirty(false);
          return;
        }

        console.log(`⚠️ Sync: Found ${comparison.conflicts.length} conflicting courses.`);

        // 3. Only Sync Conflicting Courses
        // Note: New courses (no ID yet) should also be synced.
        // normalized items might not have _id if they are truly new.
        const toSync = normalized.filter(c =>
          // If it has an ID, check if it's in conflicts
          (c._id && comparison.conflicts.includes(c._id)) ||
          // If it doesn't have a backend ID yet, it needs syncing
          !c._id
        );

        if (toSync.length > 0) {
          const synced = await syncCourses(toSync);

          // Merge results back (Preserve non-synced courses)
          setCourses(prev => {
            const merged = [...prev];
            synced.forEach(s => {
              const idx = merged.findIndex(p => (p._id && p._id === s._id) || p.title === s.title);
              if (idx !== -1) merged[idx] = s;
            });
            return merged;
          });
          console.log("☁️  Auto-Saved Conflicting Data");
        }

        setIsDirty(false);

      } catch (err) {
        console.error("Cloud Sync Failed", err);
      }
    };

    // Debounce: 10 seconds
    const timeoutId = setTimeout(() => {
      // Trigger if dirty OR periodically?
      // User pattern: "if (!isDirty || !user) return;" -> Only sync if dirty.
      // But what about Pulling new data?
      // User asked: "before full lesson sync do hash comparison".
      // User asked: "Only trigger sync if actual changes occurred".
      // I will follow the user's explicit dirty-only logic for *sending*.
      if (isDirty) {
        optimizedSync();
      }
    }, 10000);

    return () => clearTimeout(timeoutId);

  }, [courses, user, isDirty]);

  const handleCourseUpload = async (newCourses) => {
    // 1. Calculate new state & Flatten to prevent nested arrays
    // Ensure newCourses is treated as an array before spreading
    const incoming = Array.isArray(newCourses) ? newCourses : [newCourses];

    // DEDUP: Filter out courses that already exist by Title
    const uniqueIncoming = incoming.filter(newC =>
      !courses.some(existing =>
        (existing.title || existing.name) === (newC.title || newC.name)
      )
    );

    if (uniqueIncoming.length === 0) {
      console.warn("Duplicate course upload prevented.");
      alert("This course already exists in your library!");
      return;
    }

    const updated = [...courses, ...uniqueIncoming].flat().map(c => ({
      ...c,
      updatedAt: c.updatedAt || new Date().toISOString()
    }));

    // 2. Local Update
    setCourses(updated);
    await secureStorage.setItem('crumbs_courses', updated);
    setIsDirty(true); // Mark for background sync

    // 3. Force Cloud Sync
    if (user) {
      try {
        const normalized = updated.map(c => {
          // Adapt Flat Subtopics to Backend Schema (Topics -> Subtopics)
          let finalTopics = c.topics || [];
          if ((!finalTopics || finalTopics.length === 0) && c.subtopics && c.subtopics.length > 0) {
            finalTopics = [{
              title: "Course Modules",
              icon: "fas fa-layer-group",
              subtopics: c.subtopics
            }];
          }

          return {
            ...c,
            title: c.title || c.name || "Untitled Course",
            topics: finalTopics
          };
        });
        const synced = await syncCourses(normalized);
        // Update with backend IDs immediately to avoid Delete 404s later
        setCourses(synced);
        await secureStorage.setItem('crumbs_courses', synced);
        console.log("☁️  Uploaded Course Synced & IDs Updated");
      } catch (err) {
        console.error("Failed to sync new course", err);
      }
    }
  };



  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

    try {
      // Optimistic UI Update
      setCourses(prev => {
        const updated = prev.filter(c => c.id !== courseId && c._id !== courseId);
        secureStorage.setItem('crumbs_courses', updated); // Fire and forget promise
        return updated;
      });
      setIsDirty(true);

      // API Call if user is authenticated (and course has real ID)
      // Only verify against backend if it looks like a MongoID (24 chars)
      const isMongoId = (id) => typeof id === 'string' && id.length === 24;

      if (user && courseId && isMongoId(courseId)) {
        await deleteCourse(courseId);
      }
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete course from cloud.");
      // Revert? (Complex for now, assume success)
    }
  };

  // Persist generated lesson content
  // Persist generated lesson content
  const handleLessonSave = async (courseId, subtopicId, lessonContent) => {
    // 1. Calculate new state immediately
    // 1. Calculate new state immediately
    const updatedCourses = courses.map(course => {
      if (course.id == courseId || course._id == courseId) {
        let newCourse = { ...course };

        // 1. Handle Flat Subtopics (Legacy / Frontend-only)
        if (newCourse.subtopics && newCourse.subtopics.length > 0) {
          const updatedSubtopics = newCourse.subtopics.map(sub => {
            if (sub.id == subtopicId || sub._id == subtopicId) {
              return { ...sub, lesson: lessonContent };
            }
            return sub;
          });
          newCourse.subtopics = updatedSubtopics;
        }

        // 2. Handle Nested Topics (Backend Schema)
        // CRITICAL FIX: Update topics EVEN IF subtopics exist, because Sync logic prefers topics.
        if (newCourse.topics && newCourse.topics.length > 0) {
          const updatedTopics = newCourse.topics.map(topic => {
            const updatedSubtopics = (topic.subtopics || []).map(sub => {
              if (sub.id == subtopicId || sub._id == subtopicId) {
                return { ...sub, lesson: lessonContent };
              }
              return sub;
            });
            return { ...topic, subtopics: updatedSubtopics };
          });
          newCourse.topics = updatedTopics;
        }

        return { ...newCourse, updatedAt: new Date().toISOString() };
      }
      return course;
    });

    // 2. Update Local State
    setCourses(updatedCourses);
    await secureStorage.setItem('crumbs_courses', updatedCourses);
    setIsDirty(true);

    // 3. Force Cloud Sync (Immediate) with Normalization
    if (user) {
      try {
        console.log("☁️  Forcing immediate save for new lesson...");

        // Normalize: Ensure any flat 'subtopics' are converted to 'topics' for Backend Schema
        const normalizedForSync = updatedCourses.map(c => {
          let finalTopics = c.topics || [];
          // If we have flat subtopics but no topics (or empty topics), wrap them
          if ((!finalTopics || finalTopics.length === 0) && c.subtopics && c.subtopics.length > 0) {
            finalTopics = [{
              title: "Course Modules", // Default container
              icon: "fas fa-layer-group",
              subtopics: c.subtopics
            }];
          }
          // Return backend-compliant structure
          return {
            ...c,
            topics: finalTopics,
            // We keep 'subtopics' property for local frontend state if needed, 
            // but backend will likely ignore it. 
            // Important: The backend ONLY looks at 'topics'.
          };
        });

        await syncCourses(normalizedForSync);
        console.log("☁️  Lesson Saved to Cloud Success");
      } catch (err) {
        console.error("Failed to sync lesson to cloud", err);
        // Optionally set error state to warn user
      }
    }
  };

  const updateCourseProgress = (courseId, subtopicId) => {
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => {
        if (course.id == courseId || course._id == courseId) {

          // Scenario A: Flat Subtopics
          if (course.subtopics && course.subtopics.length > 0) {
            const updatedSubtopics = course.subtopics.map(sub => {
              if (sub.id == subtopicId || sub._id == subtopicId) {
                return { ...sub, isCompleted: true };
              }
              return sub;
            });
            const completedCount = updatedSubtopics.filter(s => s.isCompleted).length;
            const progress = Math.round((completedCount / updatedSubtopics.length) * 100);
            return { ...course, subtopics: updatedSubtopics, progress };
          }

          // Scenario B: Nested Topics
          if (course.topics && course.topics.length > 0) {
            let totalSub = 0;
            let totalComplete = 0;

            const updatedTopics = course.topics.map(topic => {
              const updatedSubtopics = (topic.subtopics || []).map(sub => {
                if (sub.id == subtopicId || sub._id == subtopicId) {
                  return { ...sub, isCompleted: true };
                }
                return sub;
              });

              // Tally for progress calc
              updatedSubtopics.forEach(s => {
                totalSub++;
                if (s.isCompleted) totalComplete++;
              });

              return { ...topic, subtopics: updatedSubtopics };
            });

            const progress = totalSub > 0 ? Math.round((totalComplete / totalSub) * 100) : 0;
            return { ...course, topics: updatedTopics, progress, updatedAt: new Date().toISOString() };
          }
        }
        return course;
      });

      secureStorage.setItem('crumbs_courses', updatedCourses);
      setIsDirty(true);
      return updatedCourses;
    });
  };

  const handleAddXP = async (amount, action) => {
    // Optimistic UI Update
    if (user) {
      setUser(prev => ({ ...prev, xp: (prev.xp || 0) + amount }));
      try {
        const res = await updateXP(amount, action);
        // Sync with server source of truth
        setUser(prev => ({ ...prev, xp: res.xp, streak: res.streak }));
      } catch (err) {
        console.error("Failed to sync XP", err);
      }
    }
  };

  const setAuth = (bool) => {
    // Reload user data if strictly setting true (e.g. after login)
    if (bool) {
      loadUser().then(data => setUser({ ...data, is_authenticated: true }));
    } else {
      setUser(null);
    }
  };

  const handleLogout = () => {
    // 🔧 SECURE LOGOUT: Clear all user data
    secureStorage.clearAll();

    // Explicitly clear legacy keys just in case
    // localStorage.removeItem('crumbs_token'); // Handled by clearAll
    // localStorage.removeItem('crumbs_courses');

    setUser(null);
    setCourses([]); // Clear in-memory courses to prevent ghost data
    setTheme('dark');

    console.log("🔐 User logged out. All data cleared.");
  };

  // Theme State
  const [theme, setTheme] = useState('dark'); // Default to dark, load async

  useEffect(() => {
    secureStorage.getItem('crumbs_theme').then(t => {
      if (t) setTheme(t);
    });
  }, []);

  // Apply theme on mount/change
  useEffect(() => {
    document.body.className = theme;
    secureStorage.setItem('crumbs_theme', theme);
  }, [theme]);

  // Sync theme from user profile when logged in
  useEffect(() => {
    if (user && user.theme) {
      setTheme(user.theme);
    }
  }, [user]);

  // Notification Watcher
  useEffect(() => {
    if (!user || !user.planner) return;

    const checkReminders = () => {
      const now = new Date();
      user.planner.forEach(plan => {
        if (plan.isCompleted) return;
        const planTime = new Date(plan.date);

        // Trigger if within the last minute (to avoid spamming, but catch it)
        const diff = (now - planTime) / 1000 / 60; // diff in minutes
        if (diff >= 0 && diff < 1) {
          // Check if we already notified for this? (Simplification: just notify)
          if (Notification.permission === 'granted') {
            new Notification(`Time to study: ${plan.title}`, {
              body: "Your planned session is starting now!",
              icon: '/vite.svg' // Fallback icon
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 sec
    return () => clearInterval(interval);
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Determine the base URL dynamically based on environment or default
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

    if (user) {
      try {
        const token = await secureStorage.getItem('crumbs_token');
        if (token) {
          await fetch(`${API_URL}/api/auth/preferences`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ theme: newTheme })
          });
        }
      } catch (err) {
        console.error("Failed to save theme preference", err);
      }
    }
  };

  if (isLoading) return <div style={{ background: '#0f172a', height: '100vh' }}></div>;

  return (
    <>
      {/* Global Header (Hidden on Hero/Auth) */}
      {!isPublicRoute && <Header user={user} logout={handleLogout} toggleTheme={toggleTheme} currentTheme={theme} />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Hero />} />

        {/* Auth Routes */}
        <Route path="/login" element={!user ? <Login setAuth={setAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup setAuth={setAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/demo" element={<Navigate to="/dashboard" />} />

        {/* Private / App Routes */}
        <Route path="/dashboard" element={
          user ? <Dashboard courses={courses} onUploadComplete={handleCourseUpload} onDelete={handleDeleteCourse} /> : <Navigate to="/login" />
        } />

        <Route path="/course/module/:id" element={user ? <Module courses={courses} /> : <Navigate to="/login" />} />
        <Route path="/course/:courseId/subtopic/:subtopicId" element={user ? <Reader courses={courses} onCompleteSubtopic={updateCourseProgress} onSaveLesson={handleLessonSave} handleAddXP={handleAddXP} /> : <Navigate to="/login" />} />

        {/* User Pages */}
        <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        <Route path="/planner" element={user ? <Planner /> : <Navigate to="/login" />} />
        <Route path="/activity" element={user ? <Activity /> : <Navigate to="/login" />} />
        <Route path="/library" element={user ? <Library /> : <Navigate to="/login" />} />
        <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/quiz" element={user ? <QuizDashboard /> : <Navigate to="/login" />} />
        <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" />} />
        <Route path="/bookmarks" element={user ? <Bookmarks /> : <Navigate to="/login" />} />
        <Route path="/pinned" element={user ? <Pinned /> : <Navigate to="/login" />} />
        <Route path="/about" element={user ? <About /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings user={user} toggleTheme={toggleTheme} currentTheme={theme} /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Footer (Hidden on Hero & Reader) */}
      {!isPublicRoute && !isReaderRoute && <Footer />}
    </>
  )
}

export default App
