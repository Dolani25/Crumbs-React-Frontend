export const dummyLessons = {
  1: { // Course ID
    1: { // Subtopic ID
      title: "30 Days of React",
      lessonNumber: "Lesson 03",
      topic: "First Components",
      content: {
        text: [
          "Components are the building blocks of React applications...",
          "A component can be either functional or class-based..."
        ],
        code: `function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}`,
        media: {
          image: "profilePic.jpg",
          video: "gh.mp4",
          audio: "your-audio.mp3"
        }
      }
    },
    2: {
      title: "React Fundamentals",
      lessonNumber: "Lesson 04",
      topic: "Props and State",
      content: { /* ... */ }
    }
  }
};