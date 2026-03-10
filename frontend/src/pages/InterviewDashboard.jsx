import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateQuestions } from '../services/api';
import { Sparkles, Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, ArrowRight, Eye, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import FeedbackResult from '../components/FeedbackResult';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const InterviewDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract state from Setup Page
  const { role, company, resume, setupComplete } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [interviewId, setInterviewId] = useState(null);

  // Audio/Video State
  const [isListening, setIsListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const recognitionRef = useRef(null);
  const listeningIntentRef = useRef(false);
  const baseTextRef = useRef('');

  // Face Analysis State
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceData, setFaceData] = useState({ eyeContact: 'Initializing...', emotion: '...' });
  const [attentionWarning, setAttentionWarning] = useState(false);
  const attentionHistoryRef = useRef([]); // Stores true/false for eye contact per check
  const totalFramesRef = useRef(0);
  const attentionFramesRef = useRef(0);
  const emotionCountsRef = useRef({});
  const [eyeContactScore, setEyeContactScore] = useState(100);

  // Auto-start logic
  useEffect(() => {
    if (!setupComplete) {
      navigate('/interview/setup');
      return;
    }
    if (setupComplete && !questions.length && !loading && !interviewId) {
      handleGenerate();
    }
  }, [setupComplete, navigate]);

  // Load Face API Models from CDN
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Using GitHub Pages CDN as requested
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("FaceAPI Models Loaded from CDN");
      } catch (err) {
        console.error("Failed to load models", err);
        // Fallback or alert user
      }
    };
    loadModels();
  }, []);

  // Face Detection Loop (1000ms)
  useEffect(() => {
    let interval;
    if (modelsLoaded && cameraActive) {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;

          // Detect face
          const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          let isLooking = false;
          let currentEmotion = 'Unknown';

          if (detections) {
            // 1. Analyze Emotion
            const expressions = detections.expressions;
            const sorted = Object.keys(expressions).sort((a, b) => expressions[b] - expressions[a]);
            const topEmotion = sorted[0];
            if (topEmotion) {
              currentEmotion = topEmotion;
            }

            // 2. Analyze Eye Contact / Attention (Heuristic: Face Centered)
            const { x, y, width, height } = detections.detection.box;
            const { videoWidth, videoHeight } = video;
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            // Check if face center is within the middle 60% of the video frame
            const isCenteredX = centerX > videoWidth * 0.2 && centerX < videoWidth * 0.8;
            const isCenteredY = centerY > videoHeight * 0.2 && centerY < videoHeight * 0.8;

            // Also consider Score
            const score = detections.detection.score;

            if (isCenteredX && isCenteredY && score > 0.5) {
              isLooking = true;
              setFaceData({
                eyeContact: "Good",
                emotion: topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1)
              });
              setAttentionWarning(false);
            } else {
              setFaceData({
                eyeContact: "Poor",
                emotion: topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1)
              });
            }

          } else {
            // No face detected
            setFaceData({ eyeContact: 'None', emotion: 'Unknown' });
            isLooking = false;
          }

          // 3. Update Attention History & Score
          attentionHistoryRef.current.push(isLooking);
          if (attentionHistoryRef.current.length > 60) attentionHistoryRef.current.shift(); // Keep last 60 checks (~1 min)

          const activeCount = attentionHistoryRef.current.filter(v => v).length;
          const totalCount = attentionHistoryRef.current.length;
          const avgScore = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;
          setEyeContactScore(avgScore);

          // Update Cumulative Stats for Final Report
          totalFramesRef.current += 1;
          if (isLooking) attentionFramesRef.current += 1;
          if (currentEmotion !== 'Unknown') {
            emotionCountsRef.current[currentEmotion] = (emotionCountsRef.current[currentEmotion] || 0) + 1;
          }


          // 4. Warning Logic: if not looking for active 5 secs in a row (approx 5 checks)
          const recentChecks = attentionHistoryRef.current.slice(-5);
          if (recentChecks.length >= 5 && recentChecks.every(val => val === false)) {
            setAttentionWarning(true);
          }

        }
      }, 1000); // 1000ms Interval
    }
    return () => clearInterval(interval);
  }, [modelsLoaded, cameraActive]);


  // TTS Logic - unchanged
  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]) {
      const textToSpeak = questions[currentQuestionIndex].question;
      speak(textToSpeak);
    }
    return () => window.speechSynthesis.cancel();
  }, [currentQuestionIndex, questions]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGenerate = async () => {
    setError('');
    const resumeContext = "Generic resume context";

    setLoading(true);
    try {
      const userId = user?.user_id || user?.id || JSON.parse(localStorage.getItem('user'))?.user_id;

      if (!userId) {
        throw new Error('User not identified. Please log in again.');
      }

      // 1. Start Interview Session
      const startRes = await fetch('http://localhost:5000/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          job_role: role,
          difficulty: 'medium',
          skills: []
        })
      });
      const startData = await startRes.json();
      if (!startData.success) throw new Error(startData.error || 'Failed to start interview session');

      setInterviewId(startData.interview_id);

      // 2. Generate Questions
      const data = await generateQuestions(resumeContext, role, 'medium');
      if (data?.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setCurrentQuestionIndex(0);
      } else {
        setError(data?.error || 'Failed to fetch questions.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async (finalHistory) => {
    setSubmitting(true);

    // Calculate final metrics
    const totalFrames = totalFramesRef.current;
    const attentionFrames = attentionFramesRef.current;
    const finalEyeContactScore = totalFrames > 0 ? Math.round((attentionFrames / totalFrames) * 100) : 0;

    let dominantEmotion = 'Neutral';
    let maxCount = 0;
    for (const [emo, count] of Object.entries(emotionCountsRef.current)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emo;
      }
    }
    // Capitalize
    dominantEmotion = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);

    try {
      const response = await fetch('http://localhost:5000/api/interviews/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: finalHistory,
          user_id: user?.id,
          interview_id: interviewId,
          job_role: role,
          eye_contact_score: finalEyeContactScore, // Legacy field
          behavioral_metrics: {
            eye_contact: finalEyeContactScore,
            dominant_emotion: dominantEmotion
          }
        }),
      });
      const result = await response.json();
      if (result.success) {
        setReportData(result.data || result);
      } else {
        setError(result.error || 'Failed to get feedback.');
      }
    } catch (err) {
      console.error('Error submitting interview:', err);
      setError('Failed to submit interview feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (isListening) {
      listeningIntentRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }

    const newHistory = [
      ...conversationHistory,
      {
        question: questions[currentQuestionIndex]?.question,
        answer: userAnswer.trim() || "(No answer provided)",
      },
    ];

    setConversationHistory(newHistory);
    setUserAnswer('');
    baseTextRef.current = '';

    if (currentQuestionIndex >= questions.length - 1) {
      await finishInterview(newHistory);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      listeningIntentRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Browser doesn't support speech recognition.");
        return;
      }
      listeningIntentRef.current = true;
      setIsListening(true);
      baseTextRef.current = userAnswer;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const spacer = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : '';
        setUserAnswer(baseTextRef.current + spacer + transcript);
      };

      recognition.onend = () => {
        if (listeningIntentRef.current) {
          try { recognition.start(); } catch (e) { setIsListening(false); }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleEndCall = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.confirm("Are you sure you want to end the interview?")) {
      navigate('/dashboard');
    }
  };

  if (reportData) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <FeedbackResult
          score={reportData.score || 0}
          feedback={reportData.feedback || 'No feedback available.'}
          weakAreas={reportData.weak_areas || []}
          behavioralMetrics={reportData.behavioral_metrics}
          onBack={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-950 text-white overflow-hidden flex flex-col relative">

      {/* Header Info */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-1 drop-shadow-md">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          {company || 'Interview Session'}
        </h2>
        <p className="text-sm text-gray-300 ml-5 opacity-80">{role}</p>
      </div>

      {/* Attention Warning Toast */}
      {attentionWarning && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-red-400/50">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">⚠️ Please maintain eye contact with the camera.</span>
          </div>
        </div>
      )}

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex p-4 gap-4 overflow-hidden relative pb-28">

        {/* Left: User Video */}
        <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl border border-gray-800 group">
          {cameraActive ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              className="w-full h-full object-cover"
              mirrored={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-10 h-10 text-gray-500" />
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium flex items-center gap-2">
            <span>You ({user?.full_name || 'Candidate'})</span>
            {modelsLoaded && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="AI Analysis Active"></span>}
          </div>

          {/* Live Analysis Badge */}
          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-10">
            <div className="px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/70 text-white text-xs font-medium flex items-center gap-2 shadow-lg">
              <Eye className="w-3 h-3 text-blue-400" />
              <span>Attention: {eyeContactScore}%</span>
            </div>
            <div className="px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/70 text-white text-xs font-medium flex items-center gap-2 shadow-lg">
              <span>😐 Emotion: {faceData.emotion}</span>
            </div>
          </div>

          <div className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur border transition-all ${isListening ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>
        </div>

        {/* Right: AI Interviewer */}
        <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col items-center justify-center">

          {/* Avatar */}
          <div className="relative mb-12">
            <div className="w-40 h-40 rounded-full bg-blue-600/20 flex items-center justify-center relative animate-pulse-slow">
              <div className="w-32 h-32 rounded-full bg-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-blue-300" />
              </div>
            </div>
            {window.speechSynthesis?.speaking && (
              <div className="absolute -inset-4 border-2 border-blue-400/50 rounded-full animate-ping-slow"></div>
            )}
          </div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium">
            AI Interviewer
          </div>

          {/* Caption Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent min-h-[30%] flex flex-col justify-end">
            {loading ? (
              <div className="flex items-center gap-3 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-lg">AI is thinking...</span>
              </div>
            ) : questions.length > 0 ? (
              <div className="animate-in slide-in-from-bottom-5 fade-in duration-500">
                <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed drop-shadow-md">
                  "{questions[currentQuestionIndex]?.question}"
                </h3>
                {userAnswer && (
                  <div className="mt-4 text-sm text-gray-400 italic border-l-2 border-blue-500 pl-3">
                    TRANSCRIPT: {userAnswer}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-400">{error || "Initializing..."}</div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-full px-8 py-4 shadow-2xl z-30 flex items-center gap-6">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${isListening ? 'bg-white text-gray-900 shadow-lg shadow-white/20' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          title={isListening ? "Mute Mic" : "Unmute Mic"}
        >
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setCameraActive(!cameraActive)}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${cameraActive ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
          title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
        >
          {cameraActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <div className="w-px h-8 bg-gray-700 mx-2"></div>

        <button
          onClick={handleNextQuestion}
          disabled={submitting || loading || !questions.length}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-blue-600/20"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : currentQuestionIndex >= questions.length - 1 ? "Finish" : "Next Question"}
          {!submitting && <ArrowRight className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 transform hover:scale-105 ml-2"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default InterviewDashboard;
