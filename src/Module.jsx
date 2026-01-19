import React from 'react';
import { useParams } from 'react-router-dom';
import './Module.css';
import { Link } from 'react-router-dom';
import { dummyLessons } from './lessons.js';

const Module = ({ courses }) => {
  const { id } = useParams();

  // Find course in the passed prop (handle type mismatch for ID)
  // Ensure courses is an array before finding
  // Find course in the passed prop (handle type mismatch for ID)
  // Ensure courses is an array before finding
  const course = (courses || []).find(c => c.id == id || c._id == id);

  if (!course) return <div>Course not found</div>;

  /*
  // Legacy Adapter...
  */

  // For now, let's assume if it's a "known" ID (1-4), we might still want strictly parsed info?
  // No, user wants to see their parsed stuff.
  // Let's normalize: If course has subtopics, use them. Else try keys.
  // Also, for synced courses, subtopics might be { title, crumbId } objects.

  let subtopics = [];

  // Priority 1: Backend "Topics" (nested modules)
  if (course.topics && course.topics.length > 0) {
    // Flatten all subtopics from all topics
    subtopics = course.topics.flatMap(topic => topic.subtopics || []);
  }
  // Priority 2: Legacy Flat "Subtopics" (local state before sync)
  else if (course.subtopics && course.subtopics.length > 0) {
    subtopics = course.subtopics;
  } else {
    // Priority 3: Dummy Fallback
    const courseLessons = dummyLessons[id] || {};
    subtopics = Object.keys(courseLessons).map(lessonId => ({
      id: parseInt(lessonId),
      title: courseLessons[lessonId].topic,
      image: { url: `https://picsum.photos/seed/lesson${lessonId}/50/50` }
    }));
  }

  const displayCourse = {
    id: course.id || course._id,
    name: course.title || course.name, // Use title (backend) or name (local)
    subtopics: subtopics
  };

  return (
    <div className="module-page">
      <h1>{displayCourse.name}</h1>
      <div className="container">
        {displayCourse.subtopics.map((subtopic, index) => (
          <div
            key={`${subtopic.id || subtopic._id}-${index}`}
            className="subtopic"
          >
            <div>


              {subtopic.icon ? (
                <Link
                  to={`/course/${course.id || course._id}/subtopic/${subtopic.id || subtopic._id}`}
                  className="subtopic-link"
                  style={{ textDecoration: 'none', color: '#4338ca' }}
                >
                  <i className={subtopic.icon} style={{ fontSize: '1.6rem' }}></i>
                </Link>
              ) : subtopic.image?.url ? (
                /* Fallback to image if no icon exists (though we added icons to all) */
                <Link
                  to={`/course/${course.id || course._id}/subtopic/${subtopic.id || subtopic._id}`}
                  className="subtopic-link"
                >
                  <img className="subImg" src={subtopic.image.url} alt={subtopic.title} />
                </Link>
              ) : (
                <Link
                  to={`/course/${course.id || course._id}/subtopic/${subtopic.id || subtopic._id}`}
                  className="subtopic-link"
                >
                  <div>var</div>
                </Link>
              )}

            </div >
            <p>{subtopic.title}</p>
          </div >
        ))}
      </div >
    </div >
  );
};

export default Module;