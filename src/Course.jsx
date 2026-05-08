import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, MoreVertical, FileText, Upload, CheckCircle, RotateCcw, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Course.css'

const Course = ({ course, onDelete, onReset }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = (action, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);

    if (action === 'delete') {
      if (onDelete) onDelete(course.id || course._id);
    } else if (action === 'publish') {
      alert(`Published "${course.title || course.name}" to the global library! 🌍`);
    } else if (action === 'select') {
      alert(`Selected "${course.title || course.name}" ✅`);
    } else if (action === 'reset') {
      if (onReset) onReset(course.id || course._id);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Menu Trigger */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '8px',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '4px',
          color: 'white',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'all 0.2s',
          width: '28px',
          height: '28px'
        }}
        className="course-action-btn"
      >
        <MoreVertical size={16} />
      </button>

      {/* Action Menu Information Modal/Dropdown */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '40px',
            right: '10px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            zIndex: 30,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            width: '120px',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handleAction('select', e)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 12px', background: 'transparent', border: 'none',
              color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <CheckCircle size={14} style={{ color: '#4ade80' }} /> Select
          </button>
          <button
            onClick={(e) => handleAction('publish', e)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 12px', background: 'transparent', border: 'none',
              color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Globe size={14} style={{ color: '#60a5fa' }} /> Publish
          </button>

          <button
            onClick={(e) => handleAction('reset', e)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 12px', background: 'transparent', border: 'none',
              color: '#fbbf24', cursor: 'pointer', fontSize: '0.85rem',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <RotateCcw size={14} style={{ color: '#fbbf24' }} /> Reset Course
          </button>

          <div style={{ height: '1px', background: '#334155', margin: '2px 0' }}></div>
          <button
            onClick={(e) => handleAction('delete', e)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 12px', background: 'transparent', border: 'none',
              color: '#f87171', cursor: 'pointer', fontSize: '0.85rem',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <Link
        to={`/course/module/${course.id || course._id}`}
        className="course-link"
        style={{
          display: 'block',
          height: '100%',
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        <div className="course">
          <img
            className="course-img down1"
            src={course.image?.url || "https://picsum.photos/seed/default/200/300"}
            onError={(e) => { e.target.onerror = null; e.target.src = "https://picsum.photos/seed/fallback/200/300"; }}
            alt={course.title || course.name}
          />
          <div className="down2">
            <h2>{course.title || course.name}</h2>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Course;