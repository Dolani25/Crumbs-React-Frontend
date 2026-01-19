import './FileSource.css'

function FileSource({ onContinueClick }) {
  return (
    <>
      <div className="filter">
        <form onSubmit={(e) => e.preventDefault()}>
          <h3>Choose an upload source</h3>
          <span id="radioFlex">
            <div className="radio-buttons">
              <label className="custom-radio">
                <input
                  type="radio"
                  name="radio"
                  value="googleDrive"
                  onChange={() => onContinueClick('googleDrive')}
                />
                <span className="radio-btn">
                  <i className="las la-check"></i>
                  <div className="hobbies-icon">
                    <i className="lab la-google-drive"></i>
                    <h3>Google Drive</h3>
                  </div>
                </span>
              </label>
              <label className="custom-radio">
                <input
                  type="radio"
                  name="radio"
                  value="uploadFile"
                  onChange={() => onContinueClick('uploadFile')}
                />
                <span className="radio-btn">
                  <i className="las la-check"></i>
                  <div className="hobbies-icon">
                    <i className="las la-file-upload"></i>
                    <h3>Upload File</h3>
                  </div>
                </span>
              </label>
            </div>
          </span>
          {/* Continue button might be redundant if we trigger on selection, but keeping it for now if needed, though the prompt implies a flow. 
                Let's make it so selecting a radio button sets state, and continue proceeds. 
                But to simplify based on the existing code structure, I'll pass the selection up when Continue is clicked or just use buttons.
                The existing code had a Continue button. Let's make the selection stateful here or in parent.
                Actually, simpler: Just use onClick on the radio-btn span or input to set a local state, then Continue sends it.
                Or, better yet, the user might expect clicking the big box to select it. 
                Let's stick to the plan: Update copy first. 
            */}
        </form>
      </div>
    </>
  )
}

export default FileSource