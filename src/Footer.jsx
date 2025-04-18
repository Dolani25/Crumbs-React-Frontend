import './Footer.css'
import Course from './assets/applebook.svg'
import Library from './assets/library.svg'
import Feed from './assets/feed.svg'
import Chat from './assets/chat.svg'
import Quiz from './assets/quiz.svg'
function Footer(){
  return (
    <>
          <footer>
          <button><a href="{% url 'index' %}" ><img src={Course}/><span>Courses</span></a></button>
          <button onclick="alert(this.id)"><img src={Library}/><span>Library</span></button>
          <button><a href="{% url 'feed' %}" ><img src={Feed} /><span>Feed</span></a></button>
          <button onclick="populate(this.id)"><img src={Chat} /><span>Chat</span></button>
          
          <button onclick="populate(this.id)"><img src={Quiz} /><span>Quiz</span></button>
      </footer>
    </>
  )
}

export default Footer