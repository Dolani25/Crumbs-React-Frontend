import { useRef, useState } from 'react';
import './UploadFile.css';
import File from './assets/file.svg';

function UploadFile() {
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

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
      uploadFile(file, fileName);
    }
  };

  // Upload file function
  const uploadFile = (file, fileName) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/uploadfile', true);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const fileLoaded = Math.floor((event.loaded / event.total) * 100);
        setProgress(fileLoaded);
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const fileSize = (file.size < 1024 * 1024) 
          ? (file.size / 1024).toFixed(2) + " KB" 
          : (file.size / (1024 * 1024)).toFixed(2) + " MB";

        setUploadedFiles(prevFiles => [
          { name: fileName, size: fileSize },
          ...prevFiles
        ]);
        setProgress(0);
      }
    };

    xhr.send(formData);
  };

  return (
    <>
      <div className="filter">
        <div id="uploadBox">
          <div className="wrapper3">
            <h3>Choose a File</h3>
            <form className="fileUpload" encType="multipart/form-data">
              {/* Hidden file input */}
              <input 
                ref={fileInputRef} 
                className="file-input" 
                type="file" 
                name="file" 
                accept=".pdf, .txt" 
                hidden 
                onChange={handleFileChange} 
              />

              {/* Clickable area to trigger file input */}
              <div className="upload-area" onClick={handleFileClick}>
                <img src={File} alt="Upload icon" />
                <p>Browse files to upload</p>
              </div>

              {/* Progress bar */}
              {progress > 0 && (
                <section className="progress-area">
                  <li className="row">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FE4F30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    <div className="content">
                      <div className="details">
                        <span className="name">Uploading...</span>
                        <span className="percent">{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </li>
                </section>
              )}

              <button type="button" id="submitBtn">Upload Docs</button>
            </form>

            {/* Uploaded files list */}
            <section className="uploaded-area">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="row">
                  <div className="content upload">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FE4F30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    <div className="details">
                      <span className="name">{file.name} • Uploaded</span>
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