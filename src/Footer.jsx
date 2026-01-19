import './Footer.css'
import Course from './assets/applebook.svg'
import Library from './assets/library.svg'
import Feed from './assets/feed.svg'
import Chat from './assets/chat.svg'
import Quiz from './assets/quiz.svg'

function Footer() {
  return (
    <footer>
      <button><a href="/" ><img src={Course} /><span>Courses</span></a></button>
      <button onClick={() => alert("Library clicked")}><img src={Library} /><span>Library</span></button>
      <button><a href="#" onClick={(e) => e.preventDefault()} ><img src={Feed} /><span>Feed</span></a></button>
      <button onClick={() => alert("Chat clicked")}><img src={Chat} /><span>Chat</span></button>

      <button onClick={() => alert("Quiz clicked")}><img src={Quiz} /><span>Quiz</span></button>

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