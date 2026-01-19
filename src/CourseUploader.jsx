import { useState } from "react";
import EmptyCourse from "./EmptyCourse";
import FileSource from "./FileSource";
import UploadFile from "./UploadFile";
import GoogleDrivePicker from "./GoogleDrivePicker";

function CourseUploader({ onUploadComplete, initialStep = "emptyCourse" }) {
  const [step, setStep] = useState(initialStep); // Initial Step
  const [driveFile, setDriveFile] = useState(null); // Valid file from Drive

  const handleDriveFilePicked = (file) => {
    setDriveFile(file);
    setStep("uploadFile");
  };

  return (
    <div>
      {step === "emptyCourse" && <EmptyCourse onAddClick={() => setStep("fileSource")} />}
      {step === "fileSource" && <FileSource onContinueClick={(source) => setStep(source)} />}

      {/* If we have a drive file, we pass it to UploadFile. Note: UploadFile needs to support receiving a pre-selected file prop */}
      {step === "uploadFile" && <UploadFile initialFile={driveFile} onUploadComplete={onUploadComplete} />}

      {step === "googleDrive" && (
        <GoogleDrivePicker
          onFilePicked={handleDriveFilePicked}
          onCancel={() => setStep("fileSource")}
        />
      )}
    </div>
  );
}

export default CourseUploader;