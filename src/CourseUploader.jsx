import { useState } from "react";
import EmptyCourse from "./EmptyCourse";
import FileSource from "./FileSource";
import UploadFile from "./UploadFile";

function CourseUploader() {
  const [step, setStep] = useState("emptyCourse"); // Initial Step

  return (
    <div>
      {step === "emptyCourse" && <EmptyCourse onAddClick={() => setStep("fileSource")} />}
      {step === "fileSource" && <FileSource onContinueClick={() => setStep("uploadFile")} />}
      {step === "uploadFile" && <UploadFile />}
    </div>
  );
}

export default CourseUploader;