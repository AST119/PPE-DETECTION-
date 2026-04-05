import React, { useState, useEffect, useRef } from 'react';
import { Camera, Zap, ShieldAlert, Activity } from 'lucide-react';
import VideoFeed from './components/VideoFeed';
import StatsPanel from './components/StatsPanel';
import SafetyStatus from './components/SafetyStatus';

const HF_TOKEN = "hf_xxxxxxxxxxxxxxxx"; // Replace with yours

export default function App() {
  const [mode, setMode] = useState('photo'); // 'photo' or 'live'
  const [detections, setDetections] = useState([]);
  const [counts, setCounts] = useState({ person: 0, helmet: 0, vest: 0, gloves: 0 });
  const [aiAdvice, setAiAdvice] = useState("System standby. Capture data for analysis.");
  const [status, setStatus] = useState('green'); // green, yellow, red

  // Handle Logic whenever detections change
  useEffect(() => {
    processSafetyLogic();
  }, [detections]);

  const processSafetyLogic = () => {
    const persons = detections.filter(d => d.class === 'person');
    const gear = detections.filter(d => d.class !== 'person');
    
    // Update Counts
    const newCounts = { person: persons.length, 
      helmet: gear.filter(g => g.class === 'helmet').length,
      vest: gear.filter(g => g.class === 'vest').length,
      gloves: gear.filter(g => g.class === 'gloves').length
    };
    setCounts(newCounts);

    if (persons.length === 0) {
      setStatus('green');
      return;
    }

    // Check if every person has a helmet (intersection logic)
    let violation = false;
    let spareAvailable = false;

    persons.forEach(p => {
      const hasHelmet = gear.some(g => g.class === 'helmet' && 
        (g.x > p.x - p.width/2 && g.x < p.x + p.width/2));
      if (!hasHelmet) violation = true;
    });

    if (violation) {
      spareAvailable = newCounts.helmet > 0; // Simple logic: is there a helmet in frame?
      setStatus(spareAvailable ? 'yellow' : 'red');
    } else {
      setStatus('green');
    }
    
    fetchAiAdvice(newCounts, status);
  };

  const fetchAiAdvice = async (c, s) => {
    const prompt = `Safety Report: ${c.person} people. ${c.helmet} hard hats. Status: ${s}. Instructions:`;
    try {
      const res = await fetch("https://api-inference.huggingface.co/models/gpt2", {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      });
      const result = await res.json();
      setAiAdvice(result[0].generated_text.split("Instructions:")[1]?.split(".")[0] + "." || "Maintain safety.");
    } catch (e) { setAiAdvice("Check all safety equipment immediately."); }
  };

  return (
    <div className="h-screen w-screen bg-industrial text-white flex flex-col p-2 gap-2">
      {/* Top Header */}
      <header className="h-14 bg-[#0d1117] border border-blue-900/30 rounded-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
            <ShieldAlert className="text-neon" />
            <h1 className="font-black tracking-tighter text-xl">PPE<span className="text-neon">COMMAND</span></h1>
        </div>
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setMode('photo')}
            className={`px-4 py-1 rounded-md text-xs font-bold transition ${mode === 'photo' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
          >PHOTO MODE</button>
          <button 
            onClick={() => setMode('live')}
            className={`px-4 py-1 rounded-md text-xs font-bold transition ${mode === 'live' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}
          >LIVE STREAM</button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
        <StatsPanel counts={counts} />
        <VideoFeed mode={mode} onData={setDetections} />
        <SafetyStatus status={status} />
        <div className="bg-[#0d1117] rounded-2xl border border-blue-900/20 p-6 flex flex-col justify-between">
           <div className="flex items-center gap-4">
             <div className={`p-4 rounded-full ${status === 'red' ? 'bg-red-600 animate-ping' : 'bg-slate-800'}`}>
                <Activity size={24} />
             </div>
             <div>
               <h3 className="font-black text-2xl italic tracking-tighter uppercase">AI Safety Officer</h3>
               <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Real-time Feedback</p>
             </div>
           </div>
           <div className="mt-4 bg-black/40 p-4 rounded-xl border border-white/5 min-h-[100px]">
              <p className="text-slate-300 italic text-sm leading-relaxed leading-relaxed">{aiAdvice}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
