import React from 'react';
import { useParams } from 'react-router-dom';
import './Module.css';
import { Link } from 'react-router-dom';

const Module = () => {
  const { id } = useParams();
  
  // Temporary data - replace with actual API call
  const course = {
    id: id,
    name: "Course Name",
    subtopics: [
      { id: 1, title: "Overview", image: { url: "https://picsum.photos/50/50" } },
      { id: 2, title: "Basic Concepts" },
      
            { id: 3, title: "New Concepts", image: { url: "https://picsum.photos/50/50" } },
      { id: 4, title: "Dolanism" },
      // Add more subtopics as needed
    ]
  };

  const getGridPosition = (index) => {
    if (index === 0) return '2'; // First item always centered
    return index % 2 === 1 ? '1' : '3'; // Alternate others
  };

  return (
    <div className="module-page">
      <h1>{course.name}</h1>
      <div className="container">
        {course.subtopics.map((subtopic, index) => (
          <div 
            key={subtopic.id}
            className="subtopic"
            style={{ gridColumn: getGridPosition(index) }}
          >
            <div>
      

{subtopic.image?.url ? (
  <Link 
    to={`/course/${course.id}/subtopic/${subtopic.id}`}
    className="subtopic-link"
  >
    <img className="subImg" src={subtopic.image.url} alt={subtopic.title} />
  </Link>
) : (
  <Link 
    to={`/course/${course.id}/subtopic/${subtopic.id}`}
    className="subtopic-link"
  >
    <div>var</div>
  </Link>
)}
              
            </div>
            <p>{subtopic.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Module;