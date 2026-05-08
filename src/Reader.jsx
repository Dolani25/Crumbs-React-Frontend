import React, { useEffect, useState, useRef } from "react";
import { RefreshCw } from "lucide-react";
import "./Reader.css";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyLessons } from './lessons';
import { generateCrumb, generateRemedialCrumb } from './ai/DavinciGenerator';
import { chatWithPuter } from './ai/puterClient';
import MoleculeViewer from './tools/MoleculeViewer';
import GraphViewer from './tools/GraphViewer';
import DesmosGrapher from './tools/DesmosGrapher';
import ConceptGraph from './visualizations/ConceptGraph';
import PhysicsSandbox from './visualizations/PhysicsSandbox';
import HistoricalMap from './visualizations/HistoricalMap';
import ErrorBoundary from './components/ErrorBoundary';
import QuizView from './tools/QuizView.jsx';
import ModelViewer from './tools/ModelViewer.jsx';


import VolumeViewer from './tools/VolumeViewer'; // VTK.js Volume Tool
import FlowChart from './tools/FlowChart'; // React Flow Process Tool
import ManimVisualizer from './tools/ManimVisualizer'; // Manim-style P5 Tool

// ... (imports)

const Reader = ({ courses, onCompleteSubtopic, onSaveLesson, handleAddXP }) => {
  const { courseId, subtopicId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [crumbIndex, setCrumbIndex] = useState(0); // Track current crumb (paragraph)
  const [scrollValue, setScrollValue] = useState(0);


  const [retryCount, setRetryCount] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isRemediating, setIsRemediating] = useState(false);
  const [postModal, setPostModal] = useState({ show: false, context: null });
  const [postContent, setPostContent] = useState('');

  const loadingSubtopicRef = useRef(null);

  // Scroll Progress with Throttle
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;
          const totalDocScrollLength = docHeight - windowHeight;
          if (totalDocScrollLength > 0) {
            const scrollPosition = Math.floor((scrollY / totalDocScrollLength) * 100);
            setScrollValue(scrollPosition);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeSelection, setActiveSelection] = useState({
    text: '',
    range: null,
    rect: null,
    isActive: false
  });

  // Native Selection Logic with `selectionchange` handling
  useEffect(() => {
    let selectionTimeout;

    const handleSelectionChange = () => {
      clearTimeout(selectionTimeout);

      // Debounce: 200ms
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          // Clear if nothing selected
          if (!selection || !selection.toString().trim()) {
            setActiveSelection(prev => prev.isActive ? { ...prev, isActive: false } : prev);
          }
          return;
        }

        const text = selection.toString().trim();
        if (!text) {
          setActiveSelection(prev => prev.isActive ? { ...prev, isActive: false } : prev);
          return;
        }

        // Robust Content Check
        // Sometimes anchor/focus are text nodes, sometimes elements.
        const anchor = selection.anchorNode;
        const focus = selection.focusNode;
        const range = selection.getRangeAt(0);

        let validContainer = false;

        // generated selection often has commonAncestorContainer as the wrapper
        if (range.commonAncestorContainer) {
          const container = range.commonAncestorContainer.nodeType === 3
            ? range.commonAncestorContainer.parentNode
            : range.commonAncestorContainer;
          if (container.closest('.nnote')) validContainer = true;
        }

        // If common ancestor check failed (rare), check nodes
        if (!validContainer && anchor && focus) {
          const anchorEl = anchor.nodeType === 3 ? anchor.parentNode : anchor;
          const focusEl = focus.nodeType === 3 ? focus.parentNode : focus;
          if (anchorEl.closest('.nnote') || focusEl.closest('.nnote')) {
            validContainer = true;
          }
        }

        if (validContainer) {
          // Force layout read
          const rect = range.getBoundingClientRect();

          // Only update if dimensions are valid
          if (rect.width > 0 || rect.height > 0) {
            setActiveSelection({
              text: text,
              range: range.cloneRange(),
              rect: rect,
              isActive: true
            });
          }
        } else {
          // Outside reader
          setActiveSelection(prev => prev.isActive ? { ...prev, isActive: false } : prev);
        }
      }, 200);
    };

    const handleInteract = (e) => {
      if (e.target.closest('.selection-toolbar')) return;
      handleSelectionChange(); // Check soon
    };

    // Touch End: Mobile selection often finalizes here
    const handleTouchEnd = () => {
      // Check multiple times? No, just one check with enough delay
      setTimeout(handleSelectionChange, 100);
    };

    // Explicitly hide context menu
    const preventContextMenu = (e) => {
      if (e.target.closest('.nnote')) {
        e.preventDefault();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mousedown", handleInteract);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mousedown", handleInteract);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("contextmenu", preventContextMenu);
      clearTimeout(selectionTimeout);
    };
  }, []);

  const handleRemediate = async (failedConcept) => {
    setIsRemediating(true);
    try {
      console.log("🧬 Learning DNA: Adapting lesson for", failedConcept);
      const remedialCrumb = await generateRemedialCrumb(lesson.title, failedConcept);

      // Insert new tool into the lesson flow
      const newCrumbs = [...lesson.crumbs, remedialCrumb];
      setLesson(prev => ({ ...prev, crumbs: newCrumbs }));

      // Switch view to the new tool
      setShowQuiz(false);
      setCrumbIndex(lesson.crumbs.length); // Index of the new item
    } catch (err) {
      console.error("Remediation failed", err);
    } finally {
      setIsRemediating(false);
    }
  };

  const [explainModal, setExplainModal] = useState({ show: false, text: '', explanation: '', loading: false });



  const handleExplain = async () => {
    // legacy direct check or state check
    const text = activeSelection.text || window.getSelection().toString();
    if (!text) return;

    // Show modal immediately with loading state
    setExplainModal({ show: true, text: text, explanation: '', loading: true });

    try {
      const prompt = `Explain this concept concisely for a student: "${text}"`;
      const response = await chatWithPuter(prompt);

      // Handle various response formats from Puter AI
      let textResponse = '';
      if (typeof response === 'string') {
        textResponse = response;
      } else if (response?.message?.content) {
        textResponse = response.message.content;
      } else {
        textResponse = String(response);
      }

      setExplainModal(prev => ({ ...prev, explanation: textResponse, loading: false }));
    } catch (err) {
      console.error("Explain failed", err);
      setExplainModal(prev => ({ ...prev, explanation: "Sorry, I couldn't explain that right now.", loading: false }));
    }
  };

  const handleCopy = async () => {
    const text = activeSelection.text || window.getSelection().toString();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      console.log("Copied to clipboard");
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDiscuss = () => {
    const text = activeSelection.text || window.getSelection().toString();
    if (!text) return;

    setPostModal({
      show: true,
      context: {
        lineContent: text,
        courseId: courseId,
        courseTitle: lesson.title,
        crumbId: lesson.topic
      }
    });
    // Optional: setActiveSelection(prev => ({ ...prev, isActive: false }));
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    try {
      const token = localStorage.getItem('crumbs_token');
      // Using fetch
      await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          content: postContent,
          type: 'question', // Default to question/discussion from reader
          context: postModal.context
        })
      });

      alert("Posted to Feed! 🌍");
      setPostModal({ show: false, context: null });
      setPostContent('');
    } catch (err) {
      console.error("Failed to post discussion", err);
      alert("Failed to post.");
    }
  };

  // Load lesson effect
  useEffect(() => {
    let ignore = false;
    const loadLesson = async () => {
      // Avoid resetting if we already have the correct lesson loaded
      if (lesson && lesson.topic && lesson._subtopicId === subtopicId) {
        return;
      }

      // Prevent duplicate generation if currently loading this subtopic
      if (loadingSubtopicRef.current === subtopicId) {
        return;
      }

      setLesson(null);
      setCrumbIndex(0); // Reset crumb index on new lesson
      setShowQuiz(false); // Reset quiz state
      loadingSubtopicRef.current = subtopicId;

      let rawData = null;

      // 1. Try Legacy / Dummy Data Lookup
      const staticData = dummyLessons[courseId]?.[subtopicId];

      if (staticData) {
        rawData = staticData;
      } else {
        // 2. Dynamic Lookup (Parsed Courses)
        if (!courses || courses.length === 0) return; // Wait for courses to load

        const course = courses.find(c => c.id == courseId || c._id == courseId);
        if (course) {
          // Normalize subtopics (Backend 'topics' vs Local 'subtopics')
          let allSubtopics = course.subtopics || [];
          if ((!allSubtopics || allSubtopics.length === 0) && course.topics) {
            allSubtopics = course.topics.flatMap(t => t.subtopics || []);
          }

          const subtopic = allSubtopics.find(s => s.id == subtopicId || s._id == subtopicId);

          // CHECK CACHE FIRST (Only if not retrying)
          if (subtopic && subtopic.lesson && retryCount === 0) {
            console.log("Loading lesson from cache...");
            if (ignore) return;
            loadingSubtopicRef.current = null;
            setLesson({ ...subtopic.lesson, _subtopicId: subtopicId });
            return;
          }

          if (subtopic) {
            try {
              // Double check we haven't unmounted or switched topics
              rawData = await generateCrumb(course.title || course.name, subtopic.title);
            } catch (err) {
              if (ignore) return;
              loadingSubtopicRef.current = null;
              console.error("Davinci failed:", err);
              // Set Error State
              setLesson({ isError: true, errorMessage: err.message || "Failed to generate lesson.", _subtopicId: subtopicId });
              return;
            }
          }
        }
      }

      if (ignore) return;
      loadingSubtopicRef.current = null;

      if (!rawData) {
        // 3. Fallback
        setLesson({
          title: "Not Found",
          topic: "Unknown Topic",
          lessonNumber: "404",
          content: { text: ["Sorry, we couldn't find this lesson."] },
          _subtopicId: subtopicId
        });
        return;
      }

      // Normalize Data Structure to "Crumbs" Array
      let normalizedCrumbs = [];

      if (rawData.crumbs) {
        // New "Davinci" Format
        normalizedCrumbs = rawData.crumbs;
      } else if (rawData.content && rawData.content.text) {
        // Legacy "lessons.js" Format
        normalizedCrumbs = rawData.content.text.map(t => ({ text: t }));

        // Attach legacy media/tools to the LAST crumb
        if (normalizedCrumbs.length > 0) {
          const lastIndex = normalizedCrumbs.length - 1;
          const lastCrumb = { ...normalizedCrumbs[lastIndex] };

          // Merge legacy properties
          if (rawData.content.media) lastCrumb.media = rawData.content.media;
          if (rawData.content.code) lastCrumb.code = rawData.content.code;
          if (rawData.content.embed) lastCrumb.embed = rawData.content.embed;

          // Check for top-level tool (lessons.js structure sometimes varies)
          if (rawData.tool) lastCrumb.tool = rawData.tool;
          else if (rawData.content.tool) lastCrumb.tool = rawData.content.tool;

          normalizedCrumbs[lastIndex] = lastCrumb;
        }
      }

      const finalLesson = { ...rawData, crumbs: normalizedCrumbs, _subtopicId: subtopicId };
      setLesson(finalLesson);

      // Save to Cache (Only if successful and not static)
      if (onSaveLesson && !staticData) {
        onSaveLesson(courseId, subtopicId, finalLesson);
      }
    };

    loadLesson();
    window.scrollTo(0, 0);

    return () => {
      ignore = true;
      // Reset the loading ref so React StrictMode re-mount can proceed
      // Without this, the ref blocks the 2nd mount while the 1st mount's
      // result gets discarded by `ignore`, leaving lesson permanently null.
      loadingSubtopicRef.current = null;
    };
  }, [courseId, subtopicId, courses, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleNext = () => {
    if (!lesson || !lesson.crumbs) return;

    // Check if there are more crumbs in the current lesson
    if (crumbIndex < lesson.crumbs.length - 1) {
      setCrumbIndex(prev => prev + 1);
      setScrollValue(0);
      window.scrollTo(0, 0);
    } else if (lesson.quiz && !showQuiz) {
      // Transition to Quiz Mode
      setShowQuiz(true);
      window.scrollTo(0, 0);
    } else {
      // End of this subtopic -> Go back to Module Page
      if (onCompleteSubtopic) {
        onCompleteSubtopic(courseId, subtopicId);
      }
      navigate(`/course/module/${courseId}`);
    }
  };

  // Loading State with Animation
  if (!lesson) {
    return (
      <div className="loader-container">
        <div className="loader-icon">
          <div className="ripple"></div>
          <i className="las la-cookie-bite crumb-icon"></i>
        </div>
        <div className="loader-text">Baking your fresh lesson...</div>
        <div className="loader-subtext">Consulting the Knowledge Base</div>
      </div>
    );
  }

  // Error State
  if (lesson.isError) {
    return (
      <div className="reader-rroot" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '4rem', color: '#f87171', marginBottom: '20px' }}></i>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Something went wrong...</h2>
        <p style={{ color: '#94a3b8', maxWidth: '400px', marginBottom: '30px' }}>
          DaVinci burnt the crumb. Please try again.
        </p>
        <button
          onClick={handleRetry}
          style={{
            padding: '12px 24px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Try Baking Again <RefreshCw size={16} style={{ marginLeft: '7px', color: 'white', marginTop: '5px' }} />
        </button>
      </div>
    )
  }



  // ... (Quiz Render block)
  if (showQuiz && lesson.quiz) {
    if (isRemediating) {
      return (
        <div className="loader-container">
          <div className="loader-icon">
            <div className="ripple" style={{ borderColor: '#a855f7' }}></div>
            <i className="fas fa-brain crumb-icon" style={{ color: '#a855f7' }}></i>
          </div>
          <div className="loader-text">Learning DNA Activating...</div>
          <div className="loader-subtext">Generating custom visualization for: {lesson.topic}</div>
        </div>
      );
    }

    return (
      <div className="reader-rroot">
        <div className="ffiltered-div">
          <div className="filtter"></div>
          <div className="content-wwrapper">
            <p id="ccourse">{lesson.title}</p>
            <p className="ttopic">Quiz Mode</p>
          </div>
        </div>

        <div className="nnote" style={{ marginTop: '2rem' }}>
          <QuizView
            quizData={lesson.quiz}
            onRemediate={handleRemediate}
            onComplete={() => {
              // Award XP for completing quiz
              if (handleAddXP) handleAddXP(50, 'QUIZ_COMPLETE');

              if (onCompleteSubtopic) onCompleteSubtopic(courseId, subtopicId);
              navigate(`/course/module/${courseId}`);
            }}
          />
        </div>
      </div>
    );
  }

  // Get current crumb data (Standard Mode)
  const currentCrumb = lesson.crumbs ? lesson.crumbs[crumbIndex] : {};
  const isLastCrumb = lesson.crumbs && crumbIndex === lesson.crumbs.length - 1;

  // Helper to parse text with inline math ($...$) and bold (**...**) 
  const renderTextWithMath = (input) => {
    if (!input) return null;
    const text = String(input); // Force string conversion

    // 0a. Clean up escaped LaTeX delimiters (\\), \\(, etc. that got mangled)
    // Remove escaped backslashes before delimiters
    let cleanedText = text.replace(/\\\\([()$])/g, '$1'); // \\) → ), \\( → (, \\$ → $
    cleanedText = cleanedText.replace(/\\([()])/g, ''); // \) → (empty), \( → (empty)

    // 0b. Clean up chemistry LaTeX commands (mhchem package)
    // Remove \ce{...}, \cee{...}, etc. and just show the formula
    cleanedText = cleanedText.replace(/\\c[a-z]*\{([^}]+)\}/g, '$1');

    // Also handle other common LaTeX commands that shouldn't render
    cleanedText = cleanedText.replace(/\\text\{([^}]+)\}/g, '$1');
    cleanedText = cleanedText.replace(/\\mathrm\{([^}]+)\}/g, '$1');

    // Clean up stray \frac commands outside of math mode (causes red text)
    // \frac{1}{d_o} → (1)/(d_o)
    cleanedText = cleanedText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    // Remove other common LaTeX commands if not in math mode
    cleanedText = cleanedText.replace(/\\([a-z]+_[a-z])/g, '$1'); // \d_o → d_o

    // 1. Convert Markdown Bold to HTML Bold
    const formattedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 2. Split by LaTeX delimiters ($...$)
    const parts = formattedText.split(/\$([^$]+)\$/g);

    return (
      <span>
        {parts.map((part, index) => {
          // Odd indices are Math (captured between $)
          if (index % 2 === 1) {
            // Defensive Check: "Runaway Math"
            // If the content contains HTML tags (like <p>, </div>, <br>) or is excessively long,
            // it means the AI likely forgot a closing '$' and swallowed the following text.
            // We fallback to rendering it as HTML to preserve readability.
            const isRunaway = part.match(/<\/[a-z]+>/i) || part.match(/<(p|div|br|li|ul|h\d)/i) || part.length > 400;

            if (isRunaway) {
              // Render as text, restoring the leading '$' for context
              return <span key={index} dangerouslySetInnerHTML={{ __html: "$" + part }} />;
            }

            return <InlineMath key={index} math={part} />;
          }
          // Even indices are Text (HTML)
          return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
      </span>
    );
  };

  return (
    <div className="reader-rroot">

      {/* Lightbox Overlay */}
      {zoomedImage && (
        // ... existing lightbox code ...
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.95)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column'
          }}
          onClick={() => setZoomedImage(null)} // Click outside to close
        >
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.2)', color: 'white',
              border: 'none', borderRadius: '50%',
              width: '50px', height: '50px', fontSize: '1.5rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            style={{ maxWidth: '95%', maxHeight: '85%', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
          />
        </div>
      )}

      {/* Explain Modal */}
      {explainModal.show && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.8)', zIndex: 10001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setExplainModal({ show: false, text: '', explanation: '', loading: false })}
        >
          <div
            style={{
              background: '#1e293b', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '500px',
              border: '1px solid #334155', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              maxHeight: '80vh', overflowY: 'auto', position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="las la-brain" style={{ color: '#818cf8', fontSize: '1.5rem' }}></i>
                AI Explanation
              </h3>
              <button
                onClick={() => setExplainModal({ show: false, text: '', explanation: '', loading: false })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', borderLeft: '3px solid #6366f1' }}>
              <p style={{ margin: 0, color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.9rem', lineHeight: '1.5' }}>
                "{explainModal.text}"
              </p>
            </div>

            {explainModal.loading ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div className="loader-icon" style={{ width: '40px', height: '40px', marginBottom: 0 }}>
                  <div className="ripple" style={{ borderColor: '#818cf8', animationDuration: '1.5s' }}></div>
                  <i className="las la-spinner" style={{ fontSize: '2rem', color: '#818cf8', animation: 'spin 1s linear infinite' }}></i>
                </div>
                <p style={{ color: '#94a3b8', margin: 0 }}>Consulting the neural network...</p>
              </div>
            ) : (
              <div style={{ lineHeight: '1.6', color: '#e2e8f0', fontSize: '1.05rem' }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{explainModal.explanation}</p>
              </div>
            )}

            {!explainModal.loading && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setExplainModal({ show: false, text: '', explanation: '', loading: false })}
                  style={{ background: '#6366f1', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {postModal.show && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.8)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setPostModal({ show: false, context: null })}
        >
          <div
            style={{
              background: '#1e293b', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '500px',
              border: '1px solid #334155', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>Start Discussion</h3>

            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', borderLeft: '3px solid #6366f1' }}>
              <p style={{ margin: 0, color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.9rem' }}>"{postModal.context.lineContent}"</p>
            </div>

            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Ask a question or share a thought about this..."
              style={{
                width: '100%', height: '100px', background: '#0f172a', border: '1px solid #334155',
                borderRadius: '8px', color: 'white', padding: '10px', marginBottom: '15px', resize: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPostModal({ show: false, context: null })}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePostSubmit}
                style={{ background: '#6366f1', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Post to Feed
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="ffiltered-div">
        <div className="filtter"></div>
        <div className="content-wwrapper">
          <p id="ccourse">{lesson.title}</p>
          <p className="llesson">{lesson.lessonNumber}</p>
          <p className="ttopic">{lesson.topic}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="nnote">
        {/* Current Crumb Content - Text */}
        {currentCrumb.text && (
          <p>{renderTextWithMath(currentCrumb.text)}</p>
        )}

        {/* Visuals - Render if present on CURRENT crumb */}
        {currentCrumb && (
          <>
            {/* Code */}
            {currentCrumb.code && (
              <pre className="pre-wrapper">
                <div className="ccode">
                  {currentCrumb.code}
                </div>
              </pre>
            )}

            {/* Math / LaTeX Rendering */}
            {currentCrumb.math && (
              <div className="math-container" style={{ margin: '20px 0', fontSize: '1.2rem', overflowX: 'auto' }}>
                <BlockMath math={currentCrumb.math} />
              </div>
            )}

            {/* Media Components */}
            {currentCrumb.media?.video && (
              <div className="vvideo-container">
                <video controls>
                  <source src={currentCrumb.media.video} type="video/mp4" />
                </video>
              </div>
            )}

            {currentCrumb.media?.image && (
              <div className="image-container">
                <img
                  src={currentCrumb.media.image}
                  alt="Lesson"
                  onClick={() => setZoomedImage(currentCrumb.media.image)}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
            )}

            {/* Embedded Content */}
            {currentCrumb.embed && (
              <div className="embed-container">
                {currentCrumb.embed.type === 'iframe' && (
                  <iframe
                    src={currentCrumb.embed.src}
                    width={currentCrumb.embed.width}
                    height={currentCrumb.embed.height}
                    title={currentCrumb.embed.title}
                    style={{ border: 'none', borderRadius: '8px', marginTop: '20px' }}
                    allowFullScreen
                  />
                )}
              </div>
            )}

            {/* Dynamic Visualization Tools */}
            {currentCrumb.tool && currentCrumb.tool.type === 'molecule-viewer' && (
              <MoleculeViewer compound={currentCrumb.tool.data} />
            )}

            {currentCrumb.tool && currentCrumb.tool.type === 'graph-viewer' && (
              <GraphViewer
                type={currentCrumb.tool.chartType}
                data={currentCrumb.tool.data}
                title={currentCrumb.tool.title}
                xKey={currentCrumb.tool.xKey}
                dataKey={currentCrumb.tool.dataKey}
                xLabel={currentCrumb.tool.xLabel}
                yLabel={currentCrumb.tool.yLabel}
              />
            )}

            {currentCrumb.tool && currentCrumb.tool.type === 'desmos-grapher' && (
              <ErrorBoundary>
                <DesmosGrapher
                  expression={currentCrumb.tool.data}
                  title={currentCrumb.tool.title || "Equation Plotter"}
                />
              </ErrorBoundary>
            )}

            {/* New Production Suite Visualizations */}
            {(currentCrumb.tool?.type === 'concept-graph') && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'serif', marginBottom: '10px' }}>Concept Map</h3>
                <ErrorBoundary>
                  <ConceptGraph width={window.innerWidth > 800 ? 600 : window.innerWidth - 40} />
                </ErrorBoundary>
              </div>
            )}

            {(currentCrumb.tool?.type === 'physics-sandbox') && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'serif', marginBottom: '10px' }}>Interactive Lab</h3>
                <ErrorBoundary>
                  <PhysicsSandbox data={currentCrumb.tool.data} />
                </ErrorBoundary>
              </div>
            )}

            {/* Manim-style Video Engine */}
            {(currentCrumb.tool?.type === 'video-explainer') && (
              <div style={{
                marginTop: '40px',
                background: '#0f172a', /* Dark slate background */
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #1e293b',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}>
                {/* Header Container */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #1e293b',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Yellow Icon */}
                  <div style={{
                    width: '32px', height: '32px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                  }}>
                    <i className="las la-film" style={{ color: '#fbbf24', fontSize: '1.2rem' }}></i>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '0.95rem', fontWeight: '600' }}>
                      {currentCrumb.tool?.data?.title || "Concept Visualizer"}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{
                        background: '#fbbf24',
                        color: '#000',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        AI Generated
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        • Manim JS Engine <i className="las la-play-circle" style={{ fontSize: '0.8rem' }}></i>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Canvas Area */}
                <div style={{ height: '400px', position: 'relative', background: 'black' }}>
                  <ErrorBoundary>
                    <ManimVisualizer scriptContent={currentCrumb.tool.data?.script} />
                  </ErrorBoundary>
                </div>

                {/* Footer / Caption */}
                <div style={{ padding: '10px 20px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                    Watch this step by step procedural animation.
                  </p>
                </div>
              </div>
            )}

            {(currentCrumb.tool?.type === 'historical-map') && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'serif', marginBottom: '10px' }}>Historical/Geographic Context</h3>
                <ErrorBoundary>
                  <HistoricalMap data={currentCrumb.tool.data} />
                </ErrorBoundary>
              </div>
            )}

            {/* CogniFlow 3D Engine Integration */}
            {(currentCrumb.tool?.type === 'model-viewer') && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'serif', marginBottom: '10px' }}>Interactive 3D Model</h3>
                <ErrorBoundary>
                  <ModelViewer
                    type={currentCrumb.tool.data?.type || 'ROCK'}
                    data={currentCrumb.tool.data}
                    title={currentCrumb.tool.title}
                  />
                </ErrorBoundary>
              </div>
            )}



            {(currentCrumb.tool?.type === 'volume-viewer') && (
              <div style={{ marginTop: '40px' }}>
                <ErrorBoundary>
                  <VolumeViewer title={currentCrumb.tool.title} />
                </ErrorBoundary>
              </div>
            )}

            {(currentCrumb.tool?.type === 'process-flow') && (
              <div style={{ marginTop: '40px' }}>
                <ErrorBoundary>
                  <FlowChart data={currentCrumb.tool.data} title={currentCrumb.tool.title} />
                </ErrorBoundary>
              </div>
            )}
          </>
        )}

        <div className="nnext" onClick={handleNext} style={{ cursor: 'pointer' }}>
          {isLastCrumb ? (lesson.quiz ? "Take Quiz" : "Finish Topic") : "Next Crumb"}
        </div>
      </div>

      {/* Native eBook/PDF Reader-style Text Selection */}
      {/* Selection Toolbar */}
      {activeSelection.isActive && activeSelection.rect && (
        <div
          className="selection-toolbar"
          style={{
            position: 'fixed',
            top: `${Math.max(10, activeSelection.rect.top - 55)}px`,
            // Smart clamping: Estimate toolbar width ~300px (half 150px)
            // Ensure the center point we position at is at least 150px from edges
            left: `${Math.max(150, Math.min(window.innerWidth - 150, activeSelection.rect.left + activeSelection.rect.width / 2))}px`,
            transform: 'translateX(-50%)',
            maxWidth: '95vw',
            zIndex: 10000
          }}
        >
          <button onClick={handleCopy} className="toolbar-btn">
            <i className="las la-copy"></i> Copy
          </button>
          <div className="toolbar-divider"></div>
          <button onClick={handleExplain} className="toolbar-btn">
            <i className="las la-brain"></i> Explain
          </button>
          <div className="toolbar-divider"></div>
          <button onClick={handleDiscuss} className="toolbar-btn">
            <i className="las la-comment"></i> Discuss
          </button>
        </div>
      )}
    </div>
  );
};

export default Reader;