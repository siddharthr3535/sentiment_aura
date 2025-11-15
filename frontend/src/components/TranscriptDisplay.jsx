import { useEffect, useRef } from "react";
import "./TranscriptDisplay.css";

function TranscriptDisplay({ transcript }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="transcript-container">
      <div className="transcript-header">Transcript</div>
      <div className="transcript-content" ref={containerRef}>
        {transcript || <span className="placeholder">Start speaking...</span>}
      </div>
    </div>
  );
}

export default TranscriptDisplay;
