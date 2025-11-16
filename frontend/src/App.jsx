import { useState, useRef, useEffect } from "react";
import "./App.css";
import PerlinNoiseVisualization from "./components/PerlinNoiseVisualization";
import TranscriptDisplay from "./components/TranscriptDisplay";
import KeywordsDisplay from "./components/KeywordsDisplay";
import Controls from "./components/Controls";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sentiment, setSentiment] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [emotion, setEmotion] = useState("neutral");

  const deepgramSocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?punctuate=true&interim_results=true`;

      const socket = new WebSocket(deepgramUrl, ["token", DEEPGRAM_API_KEY]);
      deepgramSocketRef.current = socket;

      socket.onopen = () => {
        console.log("Deepgram connection opened");

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250);
      };

      socket.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        const transcriptText = data.channel?.alternatives?.[0]?.transcript;

        if (transcriptText && transcriptText.trim() !== "") {
          setTranscript((prev) => prev + " " + transcriptText);

          if (data.is_final) {
            try {
              const response = await fetch(
                "http://localhost:8000/process_text",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: transcriptText }),
                }
              );

              const result = await response.json();

              // Update state with sentiment data
              setSentiment(result.sentiment);
              setKeywords((prev) => [...prev, ...result.keywords]);
              setEmotion(result.emotion);
            } catch (error) {
              console.error("Error analyzing sentiment:", error);
            }
          }
        }
      };

      socket.onerror = (error) => {
        console.error("Deepgram error:", error);
      };

      socket.onclose = () => {
        console.log("Deepgram connection closed");
      };

      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Error accessing microphone. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (deepgramSocketRef.current) {
      deepgramSocketRef.current.close();
    }

    setIsRecording(false);
  };

  return (
    <div className="app">
      <PerlinNoiseVisualization sentiment={sentiment} keywords={keywords} />

      <div className="ui-overlay">
        <Controls
          isRecording={isRecording}
          onStart={startRecording}
          onStop={stopRecording}
        />

        <TranscriptDisplay transcript={transcript} />

        <KeywordsDisplay keywords={keywords} />
      </div>
    </div>
  );
}

export default App;
