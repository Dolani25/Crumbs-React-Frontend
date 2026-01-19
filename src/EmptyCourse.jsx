import './EmptyCourse.css'
import NotFound from './assets/Screenshot_20230929-193445_1.png'

function EmptyCourse({ onAddClick }) {
  return (
    <div className="empty-course-container">
      <img src={NotFound} alt="Not Found" />
      <h3>No Course found</h3>
      <p>Let's get started shall we?</p>

      <div id="add" className="add-box" onClick={onAddClick}>+ Add Course</div>
    </div>
  )
}

export default EmptyCourse