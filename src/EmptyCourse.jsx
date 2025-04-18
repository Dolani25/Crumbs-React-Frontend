import './EmptyCourse.css'
import NotFound from './assets/Screenshot_20230929-193445_1.png'

function EmptyCourse({onAddClick}){
  return(
    <>
      <img src={NotFound}/>
          <h3>No Course found</h3>
          <p3>Let's get started shall we?</p3>
          
          <div id="add" class="add-box" onClick={onAddClick}>+ Add Course</div>
    </>
    )
}

export default EmptyCourse