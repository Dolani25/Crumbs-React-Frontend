import React from "react";
import { Link } from "react-router-dom";
import './Course.css'

const Course = ({ course, onDelete }) => {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDelete) onDelete(course.id || course._id);
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          padding: '4px',
          color: '#ef4444', // Red-500
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          transition: 'opacity 0.2s',
          borderRadius: '50%'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        title="Delete Course"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '22px', height: '22px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>

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
            id="courseImg"
            className="down1"
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