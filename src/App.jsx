import { useState } from 'react'
import './App.css'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import Nav from './Nav.jsx'
import Course from './Course.jsx'
import CourseUploader from './CourseUploader.jsx'
import { dummyCourses } from './dummyCourses.js'


import Module from './Module.jsx';

import Reader from './Reader.jsx';

import { Routes, Route, useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  const isReaderRoute = location.pathname.startsWith('/course/');

  return (
    <>
      <Header/>
      <Nav/>
      <Routes>
        <Route path="/" element={
          <div className="courses-container">
            {dummyCourses.map(course => (
              <Course key={course.id} course={course} />
            ))}
          </div>
        }/>
        <Route path="/course/module/:id" element={<Module />} />
        <Route path="/course/:courseId/subtopic/:subtopicId" element={<Reader />} />
      </Routes>
      {!isReaderRoute && <Footer/>}
    </>
  )
}

export default App

