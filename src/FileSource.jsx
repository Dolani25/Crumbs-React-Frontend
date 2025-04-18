import './FileSource.css'

function FileSource({ onContinueClick }){
  return ( 
    <>
    <div class="filter">
          
        <form>
           <h3>Choose an upload source</h3>
      <span id ="radioFlex">
      <div class="radio-buttons">
        <label class="custom-radio">
          <input type="radio" name="radio" checked />
          <span class="radio-btn"
            ><i class="las la-check"></i>
            <div class="hobbies-icon">
              <i class="las la-google-drive"></i>
              <h3>Biking</h3>
            </div>
          </span>
        </label>
        <label class="custom-radio">
          <input type="radio" name="radio" />
          <span class="radio-btn"
            ><i class="las la-check"></i>
            <div class="hobbies-icon">
              <i class="las la-file"></i>
              <h3>Football</h3>
            </div>
          </span>
        </label>

      </div>
      </span>
      <button id="continue" onClick={onContinueClick}>Continue</button>
        
        </form>
        </div>
           
            </>
    )
}

export default FileSource