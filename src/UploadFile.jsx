import { useRef, useState, useEffect } from 'react';
import './UploadFile.css';
import FileIcon from './assets/file.svg';
import * as pdfjsLib from 'pdfjs-dist';
import { parseCourseWithGemini } from './ai/GeminiParser';

// Explicitly set the worker source for Vite compatibility
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function UploadFile({ initialFile, onUploadComplete }) {
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (initialFile) {
      processFile(initialFile, initialFile.name);
    }
  }, [initialFile]);

  // Trigger file input when clicking upload area
  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      let fileName = file.name;
      if (fileName.length >= 12) {
        let splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 13) + "... ." + splitName[1];
      }
      processFile(file, fileName);
    }
  };

  const processFile = async (file, fileName) => {
    setStatusMessage("Reading PDF...");
    // Simulating upload progress
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += 5;
      if (simulatedProgress > 90) clearInterval(progressInterval);
      setProgress(Math.min(simulatedProgress, 90));
    }, 200);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);

      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';

        // Progress update...
      }

      clearInterval(progressInterval);
      setProgress(95);

      // Attempt AI Parsing logic
      setStatusMessage("Analyzing with AI...");
      await handleParsing(fullText);

      const fileSize = (file.size < 1024 * 1024)
        ? (file.size / 1024).toFixed(2) + " KB"
        : (file.size / (1024 * 1024)).toFixed(2) + " MB";

      // Success UI update
      setTimeout(() => {
        setUploadedFiles(prevFiles => [
          { name: fileName, size: fileSize },
          ...prevFiles
        ]);
        setProgress(0); // Hide progress bar
        setStatusMessage("");
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error processing PDF:", error);
      alert("Failed to process PDF.");
      setProgress(0);
      setStatusMessage("");
    }
  };

  const handleParsing = async (text) => {
    // Use Puter.js AI for parsing
    let parsedData = null;

    try {
      console.log("Using Puter AI for PDF Parsing...");
      parsedData = await parseCourseWithGemini(text);
    } catch (e) {
      console.error("AI Parsing failed, falling back to heuristic.", e);
      // Fallback to heuristic
    }

    // Fallback Heuristic
    if (!parsedData) {
      console.log("Using Heuristic Parser...");
      parsedData = parseCoursesHeuristic(text);
    }

    if (parsedData) {
      console.log("Final Parsed Data:", parsedData);
      if (onUploadComplete) onUploadComplete(parsedData);
    }
  };

  const parseCoursesHeuristic = (text) => {
    console.log("Parsing courses from text...");

    // Heuristic Parser
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const parsedCourses = [];
    let currentCourse = null;

    // Regex for possible course headers
    const coursePatterns = [/^(Course|Unit|Module)\s*\d+/i, /^[A-Z\s]{5,}/]; // Starts with Course/Unit OR is mostly uppercase

    lines.forEach(line => {
      const isHeader = coursePatterns.some(pattern => pattern.test(line));

      if (isHeader || !currentCourse) {
        if (isHeader && currentCourse && currentCourse.subtopics.length === 0) {
          // Optimization: if previous course has no subtopics, maybe replace it or keep it?
        }

        // If !currentCourse and we didn't find a header, use the first line as course name
        if (!currentCourse && !isHeader) {
          currentCourse = {
            id: Date.now(),
            name: "Introduction to " + line,
            progress: 0,
            image: { url: `https://picsum.photos/seed/${Date.now()}/200/300` },
            subtopics: []
          };
          parsedCourses.push(currentCourse);
          return;
        }

        if (isHeader) {
          currentCourse = {
            id: Date.now() + parsedCourses.length,
            name: line,
            progress: 0,
            image: { url: `https://picsum.photos/seed/${lines.indexOf(line)}/200/300` },
            subtopics: []
          };
          parsedCourses.push(currentCourse);
        }
      }

      if (currentCourse && !isHeader) {
        // Treat as subtopic
        currentCourse.subtopics.push({
          id: currentCourse.subtopics.length + 1,
          title: line,
          image: { url: `https://picsum.photos/seed/${parsedCourses.length}-${currentCourse.subtopics.length}/50/50` }
        });
      }
    });

    if (parsedCourses.length === 0) {
      parsedCourses.push({
        id: Date.now(),
        name: "Uploaded Course (Basic)",
        progress: 0,
        image: { url: "https://picsum.photos/seed/default/200/300" },
        subtopics: [{ id: 1, title: "Course Overview", image: { url: "https://picsum.photos/seed/1/50/50" } }]
      });
    }
    return parsedCourses;
  };

  return (
    <>
      <div className="filter">
        <div id="uploadBox">
          <div className="wrapper3">
            <h3>Choose a File</h3>
            <form className="fileUpload" encType="multipart/form-data" onSubmit={(e) => e.preventDefault()}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                className="file-input"
                type="file"
                name="file"
                accept=".pdf"
                hidden
                onChange={handleFileChange}
              />

              {/* Clickable area to trigger file input */}
              <div className="upload-area" onClick={handleFileClick}>
                <img src={FileIcon} alt="Upload icon" />
                <p>Browse files to upload</p>
              </div>
            </form>

            <section className="progress-area">
              {progress > 0 && (
                <li className="row">
                  <img src={FileIcon} alt="File" style={{ width: '24px', marginRight: '15px' }} />
                  <div className="content">
                    <div className="details">
                      <span className="name">{statusMessage || "Uploading..."}</span>
                      <span className="percent">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </li>
              )}
            </section>

            {/* Uploaded files list */}
            <section className="uploaded-area">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="row">
                  <div className="content upload">
                    <img src={FileIcon} alt="File" style={{ width: '24px', marginRight: '15px' }} />
                    <div className="details">
                      <span className="name">{file.name} • Processed</span>
                      <span className="size">{file.size}</span>
                    </div>
                  </div>
                  <i className="fas fa-check"></i>
                </li>
              ))}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default UploadFile;