import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import "./Reader.css";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyLessons } from './lessons';
import { generateCrumb, generateRemedialCrumb } from './ai/DavinciGenerator';
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

// ... (imports)

const Reader = ({ courses, onCompleteSubtopic, onSaveLesson, handleAddXP }) => {
  const { courseId, subtopicId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [crumbIndex, setCrumbIndex] = useState(0); // Track current crumb (paragraph)
  const [scrollValue, setScrollValue] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({ display: "none" });
  const [retryCount, setRetryCount] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isRemediating, setIsRemediating] = useState(false);
  const [postModal, setPostModal] = useState({ show: false, context: null });
  const [postContent, setPostContent] = useState('');

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

  // Text Selection / Tooltip
  useEffect(() => {
    let timeoutId;

    const handleSelection = () => {
      // Debounce logic to wait for selection to settle (especially on mobile)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const selection = window.getSelection();

        // If no valid selection, hide
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !selection.toString().trim()) {
          setTooltipStyle({ display: "none" });
          return;
        }

        const text = selection.toString().trim();
        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Calculate tooltip position
          // On mobile, native menu might appear, so we position it slightly higher
          const top = rect.top + window.scrollY - 60;
          const left = rect.left + window.scrollX + (rect.width / 2);

          setTooltipStyle({
            display: "flex",
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translateX(-50%)',
            position: 'absolute',
            zIndex: 99999 // Force super high z-index
          });
        }
      }, 200); // 200ms debounce
    };

    // Hybrid Listeners
    // 1. selectionchange: Catches everything but can be noisy (handled by debounce)
    document.addEventListener("selectionchange", handleSelection);

    // 2. Touchend: Critical for Mobile
    document.addEventListener("touchend", handleSelection);

    // 3. Mouseup/Keyup: standard desktop
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);

    // Clear on mousedown (starting new selection)
    const hideTooltip = () => {
      clearTimeout(timeoutId);
      setTooltipStyle({ display: "none" });
    }
    document.addEventListener("mousedown", hideTooltip);
    document.addEventListener("touchstart", hideTooltip);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("touchend", handleSelection);
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
      document.removeEventListener("mousedown", hideTooltip);
      document.removeEventListener("touchstart", hideTooltip);
      clearTimeout(timeoutId);
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

  const handleExplain = async () => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (!text) return;

    try {
      const prompt = `Explain this concept concisely for a student: "${text}"`;
      // Quick "mini-crumb" generation
      const explanation = await window.puter.ai.chat(prompt);
      // Using confirm/alert is a temporary UX. Ideally we would support a modal.
      // But for now, let's just use alert as requested by the "missing logic".
      alert(`💡 Explain: ${text}\n\n${explanation}`);
    } catch (err) {
      console.error("Explain failed", err);
    }
  };

  const handleDiscuss = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (!text) return;

    setPostModal({
      show: true,
      context: {
        lineContent: text,
        courseId: courseId,
        courseTitle: lesson.title,
        crumbId: lesson.topic // using topic as id roughly
      }
    });
    // Hide tooltip
    setTooltipStyle({ display: "none" });
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
    const loadLesson = async () => {
      setLesson(null);
      setCrumbIndex(0); // Reset crumb index on new lesson
      setShowQuiz(false); // Reset quiz state

      let rawData = null;

      // 1. Try Legacy / Dummy Data Lookup
      const staticData = dummyLessons[courseId]?.[subtopicId];

      if (staticData) {
        rawData = staticData;
      } else {
        // 2. Dynamic Lookup (Parsed Courses)
        const course = (courses || []).find(c => c.id == courseId || c._id == courseId);
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
            setLesson(subtopic.lesson);
            return;
          }

          if (subtopic) {
            try {
              rawData = await generateCrumb(course.title || course.name, subtopic.title);
            } catch (err) {
              console.error("Davinci failed:", err);
              // Set Error State
              setLesson({ isError: true, errorMessage: err.message || "Failed to generate lesson." });
              return;
            }
          }
        }
      }

      if (!rawData) {
        // 3. Fallback
        setLesson({
          title: "Not Found",
          topic: "Unknown Topic",
          lessonNumber: "404",
          content: { text: ["Sorry, we couldn't find this lesson."] }
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

      const finalLesson = { ...rawData, crumbs: normalizedCrumbs };
      setLesson(finalLesson);

      // Save to Cache (Only if successful and not static)
      if (onSaveLesson && !staticData) {
        onSaveLesson(courseId, subtopicId, finalLesson);
      }
    };

    loadLesson();
    window.scrollTo(0, 0);
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
          Try Baking Again <RefreshCw size={16} style={{ marginLeft: '10px' }} />
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

    // 1. Convert Markdown Bold to HTML Bold
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 2. Split by LaTeX delimiters ($...$)
    const parts = formattedText.split(/\$([^$]+)\$/g);

    return (
      <span>
        {parts.map((part, index) => {
          // Odd indices are Math (captured between $)
          if (index % 2 === 1) {
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
      {/* Selection Tooltip */}
      <div style={{
        ...tooltipStyle,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 1000,
        gap: '8px',
        alignItems: 'center'
      }}>
        <button
          onClick={handleExplain}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.9rem', fontWeight: 'bold'
          }}
        >
          <i className="las la-brain" style={{ fontSize: '1.2rem', color: '#8b5cf6' }}></i>
          Explain
        </button>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
        <button
          onClick={handleDiscuss}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.9rem', fontWeight: 'bold'
          }}
        >
          <i className="las la-comment-alt" style={{ fontSize: '1.2rem', color: '#6366f1' }}></i>
          Discuss
        </button>
      </div>

      {/* Lightbox Overlay */}
      {zoomedImage && (
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

      {/* Header Section */}
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
    </div>
  );
};

export default Reader;