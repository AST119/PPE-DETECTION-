import React, { useRef, useState, useEffect } from "react";
import { connectors, webrtc, streams } from "@roboflow/inference-sdk";

export default function VideoFeed({ mode, onData }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const connectionRef = useRef(null);
  const [frozenImg, setFrozenImg] = useState(null);

  // Toggle Live/Photo Logic
  useEffect(() => {
    if (mode === 'live') {
      setFrozenImg(null);
      startWebRTC();
    } else {
      stopWebRTC();
      initLocalCamera();
    }
    return () => stopWebRTC();
  }, [mode]);

  // Key Listener for Photo Mode
  useEffect(() => {
    const handleKey = (e) => {
      if (mode === 'photo') takePhoto();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode]);

  async function initLocalCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  }

  async function startWebRTC() {
    const connector = connectors.withApiKey("cqgYJtTKSrUPMyoV48y1", { serverUrl: "https://serverless.roboflow.com" });
    const stream = await streams.useCamera();
    connectionRef.current = await webrtc.useStream({
      source: stream, connector,
      wrtcParams: {
        workspaceName: "gaming-nkqzr",
        workflowId: "detect-count-and-visualize-2",
        streamOutputNames: ["output_image"],
        dataOutputNames: ["predictions"]
      },
      onData: (data) => onData(data.predictions || [])
    });
    videoRef.current.srcObject = await connectionRef.current.remoteStream();
  }

  function stopWebRTC() {
    connectionRef.current?.cleanup();
  }

  async function takePhoto() {
    // 1. Capture Frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    // 2. Set UI to frozen state
    setFrozenImg(canvas.toDataURL('image/jpeg'));

    // 3. Call REST API for Photo Analysis
    const res = await fetch("https://serverless.roboflow.com/gaming-nkqzr/workflows/detect-count-and-visualize-2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: "cqgYJtTKSrUPMyoV48y1", inputs: { "image": { "type": "base64", "value": base64 } } })
    });
    const result = await res.json();
    onData(result.outputs[0].predictions || []);
  }

  return (
    <div className="relative bg-black rounded-2xl border border-blue-900/20 overflow-hidden group">
      {frozenImg ? (
        <img src={frozenImg} className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur rounded-full text-[10px] font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition">
        {mode === 'photo' ? "PRESS ANY KEY TO CAPTURE" : "LIVE WEBRTC SCANNING"}
      </div>
    </div>
  );
}
