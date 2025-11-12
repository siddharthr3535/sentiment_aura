import "./Controls.css";

function Controls({ isRecording, onStart, onStop }) {
  return (
    <div className="controls">
      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? onStop : onStart}
      >
        <div className="button-inner">
          {isRecording ? (
            <>
              <span className="pulse"></span>
              <span className="text">Stop Recording</span>
            </>
          ) : (
            <span className="text">Start Recording</span>
          )}
        </div>
      </button>

      {isRecording && (
        <div className="recording-indicator">
          <span className="dot"></span>
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
}

export default Controls;
