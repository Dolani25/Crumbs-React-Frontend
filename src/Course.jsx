import React from "react";
import { Link } from "react-router-dom";
import './Course.css'

const Course = ({ course }) => {
  return (
    <Link 
      to={`/course/module/${course.id}`} 
      className="course-link"
      style={{ /* Add these styles */ 
        display: 'block', 
        height: '100%',
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <div className="course">
        {course.image?.url && (
          <img
            id="courseImg"
            className="down1"
            src={course.image.url}
            alt={course.name}
          />
        )}
        <div className="down2">
          <h2>{course.name}</h2>
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Course;