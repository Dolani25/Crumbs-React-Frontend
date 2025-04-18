import React, { useEffect, useState } from "react";
import "./Reader.css";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams } from 'react-router-dom';
import { dummyLessons } from './lessons';

const Reader = () => {
  const { courseId, subtopicId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [scrollValue, setScrollValue] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({ display: "none" });

  // Scroll progress effect
  useEffect(() => {
    const handleScroll = () => {
      const pos = document.documentElement.scrollTop;
      const calcHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const value = Math.round((pos * 100) / calcHeight);
      setScrollValue(value);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tooltip effect
  useEffect(() => {
    const showTooltip = (e) => {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setTooltipStyle({
          left: `${rect.left + rect.width/2}px`,
          top: `${rect.top - 40}px`,
          display: "block",
        });
      }
    };

    const hideTooltip = () => setTooltipStyle({ display: "none" });

    document.addEventListener("contextmenu", showTooltip);
    document.addEventListener("click", hideTooltip);

    return () => {
      document.removeEventListener("contextmenu", showTooltip);
      document.removeEventListener("click", hideTooltip);
    };
  }, []);

  // Load lesson effect
  useEffect(() => {
    const loadLesson = async () => {
      const data = dummyLessons[courseId]?.[subtopicId] || null;
      setLesson(data);
    };
    loadLesson();
  }, [courseId, subtopicId]);

  if (!lesson) return <div>Loading...</div>;

  return (
    <div className="reader-rroot">
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
        {/* Scroll Progress */}
        <div 
          id="pprogress"
          style={{ 
            background: `conic-gradient(#03CC65 ${scrollValue}%, #d7d7d7 ${scrollValue}%)`,
            display: scrollValue > 5 ? "grid" : "none"
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span id="pprogress-value">
            <i className="fas fa-arrow-up"></i>
          </span>
        </div>

        {/* Tooltip */}
        <ul className="tooltip" style={tooltipStyle}>
          <li onClick={() => alert("Explain clicked")}>Explain</li>
          <li>Bookmark</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>

        {/* Lesson Content */}
        
        {lesson.content.text.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}

        {lesson.content.code && (
          <pre>
            <div className="ccode">
              {lesson.content.code}
            </div>
          </pre>
        )}

        <MathJaxContext>
          <div className="mmath">
            <MathJax>{"x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"}</MathJax>
          </div>
        </MathJaxContext>

        {/* Media Components */}
        {lesson.content.media?.video && (
          <div className="vvideo-container">
            <video controls>
              <source src={lesson.content.media.video} type="video/mp4" />
            </video>
          </div>
        )}

        {lesson.content.media?.image && (
          <div className="image-container">
            <img 
              src={lesson.content.media.image} 
              alt="Lesson" 
              onClick={(e) => e.target.requestFullscreen()}
            />
          </div>
        )}

        <div className="nnext">Next</div>
      </div>
    </div>
  );
};

export default Reader;