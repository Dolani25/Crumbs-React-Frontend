import './Footer.css'
import { Link } from 'react-router-dom';
import Course from './assets/applebook.svg'
import Library from './assets/library.svg'
import Feed from './assets/feed.svg'
import Chat from './assets/chat.svg'
import Quiz from './assets/quiz.svg'

function Footer() {
  return (
    <footer>
      <button><a href="/" ><img src={Course} /><span>Courses</span></a></button>
      <button><Link to="/library"><img src={Library} /><span>Library</span></Link></button>
      <button><Link to="/feed"><img src={Feed} /><span>Feed</span></Link></button>
      <button><Link to="/chat"><img src={Chat} /><span>Chat</span></Link></button>

      <button><Link to="/quiz"><img src={Quiz} /><span>Quiz</span></Link></button>

      {/* Dev Tool: Reset Data */}
      <button onClick={() => {
        if (confirm("Reset all course data?")) {
          localStorage.removeItem('crumbs_courses');
          window.location.reload();
        }
      }} style={{ opacity: 0.5 }}>
        <span style={{ fontSize: '1.2rem', display: 'block' }}>↻</span>
        <span>Reset</span>
      </button>
    </footer>
  )
}

export default Footer