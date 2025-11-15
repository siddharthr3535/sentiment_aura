import { useState, useEffect } from "react";
import "./KeywordsDisplay.css";

function KeywordsDisplay({ keywords }) {
  const [displayedKeywords, setDisplayedKeywords] = useState([]);

  useEffect(() => {
    const newKeywords = keywords.filter((k) => !displayedKeywords.includes(k));

    newKeywords.forEach((keyword, index) => {
      setTimeout(() => {
        setDisplayedKeywords((prev) => [...prev, keyword]);
      }, index * 200);
    });
  }, [keywords]);

  const uniqueKeywords = [...new Set(displayedKeywords)].slice(-10);

  return (
    <div className="keywords-container">
      <div className="keywords-header">Key Topics</div>
      <div className="keywords-list">
        {uniqueKeywords.length === 0 ? (
          <span className="placeholder">No keywords yet...</span>
        ) : (
          uniqueKeywords.map((keyword, index) => (
            <div
              key={`${keyword}-${index}`}
              className="keyword-tag"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {keyword}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KeywordsDisplay;
