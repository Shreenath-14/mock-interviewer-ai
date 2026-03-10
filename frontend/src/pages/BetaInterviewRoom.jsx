import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Bot, User, Sparkles, Volume2, ArrowRight, Eye, AlertTriangle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';

const BetaInterviewRoom = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State from Setup
    const { role, company, resume } = location.state || { role: 'Software Engineer', company: 'TechCorp', resume: null };
    const { user } = useAuth();

    // Core State
    const [conversationHistory, setConversationHistory] = useState([]);
    const [aiState, setAiState] = useState('idle'); // 'speaking', 'listening', 'thinking', 'idle'
    const [currentText, setCurrentText] = useState(''); // Subtitles
    const [userTranscript, setUserTranscript] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);

    // Refs
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    const hasStarted = useRef(false);
    const manualSubmitTriggered = useRef(false);
    const audioRef = useRef(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [silenceProgress, setSilenceProgress] = useState(0);
    const [isVideoActive, setIsVideoActive] = useState(true);

    // Face Analysis State
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceData, setFaceData] = useState({ eyeContact: 'Initializing...', emotion: '...' });
    const [attentionWarning, setAttentionWarning] = useState(false);
    const [eyeContactScore, setEyeContactScore] = useState(100);
    const attentionHistoryRef = useRef([]);
    const webcamRef = useRef(null);

    // Aggregated Stats for Report
    const accumulatedEmotions = useRef({}); // { happy: 10, neutral: 50 ... }
    const accumulatedAttention = useRef([]); // [true, true, false ...]

    // Initial Intro & Face Load
    useEffect(() => {
        loadModels();
        if (!hasStarted.current) {
            hasStarted.current = true;
            handleIntro();
        }
        return () => {
            // Cleanup logic...
            if (synthRef.current) synthRef.current.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (recognitionRef.current) recognitionRef.current.stop();
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    // Load Models
    const loadModels = async () => {
        try {
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            setModelsLoaded(true);
            console.log("FaceAPI Models Loaded");
        } catch (e) {
            console.error("Error loading models:", e);
        }
    };

    // Detection Loop
    useEffect(() => {
        let interval;
        if (modelsLoaded && isVideoActive) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                    const video = webcamRef.current.video;
                    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 }))
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    let isLooking = false;
                    let currentEmotion = 'Unknown';

                    if (detections) {
                        // 1. Emotion
                        const expressions = detections.expressions;
                        const sorted = Object.keys(expressions).sort((a, b) => expressions[b] - expressions[a]);
                        const topEmotion = sorted[0];
                        if (topEmotion) {
                            currentEmotion = topEmotion;
                            // Aggregation
                            accumulatedEmotions.current[topEmotion] = (accumulatedEmotions.current[topEmotion] || 0) + 1;
                        }

                        // 2. Attention (20-80% Rule)
                        const { x, y, width, height } = detections.detection.box;
                        const { videoWidth, videoHeight } = video;
                        const centerX = x + width / 2;
                        const centerY = y + height / 2;

                        const isCenteredX = centerX > videoWidth * 0.2 && centerX < videoWidth * 0.8;
                        const isCenteredY = centerY > videoHeight * 0.2 && centerY < videoHeight * 0.8;

                        if (isCenteredX && isCenteredY) {
                            isLooking = true;
                            setFaceData({
                                eyeContact: "Good",
                                emotion: currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)
                            });
                            setAttentionWarning(false);
                        } else {
                            setFaceData({
                                eyeContact: "Poor",
                                emotion: currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)
                            });
                        }
                    } else {
                        setFaceData({ eyeContact: 'None', emotion: 'Unknown' });
                        isLooking = false;
                    }

                    // 3. Update History
                    attentionHistoryRef.current.push(isLooking);
                    if (attentionHistoryRef.current.length > 60) attentionHistoryRef.current.shift();

                    const activeCount = attentionHistoryRef.current.filter(Boolean).length;
                    const avgScore = attentionHistoryRef.current.length > 0 ? Math.round((activeCount / attentionHistoryRef.current.length) * 100) : 100;
                    setEyeContactScore(avgScore);

                    // Long-term Attention Tracking
                    accumulatedAttention.current.push(isLooking);

                    // 4. Warning Logic (>5 secs lost)
                    const recentChecks = attentionHistoryRef.current.slice(-5);
                    if (recentChecks.length >= 5 && recentChecks.every(val => val === false)) {
                        setAttentionWarning(true);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [modelsLoaded, isVideoActive]);







    // Silence Detection & Progress Bar
    useEffect(() => {
        let submitTimer;
        let progressInterval;

        const SILENCE_LIMIT = 4000; // 4 seconds
        const UPDATE_FREQ = 100; // Update progress 10 times a second

        if (isMicActive && userTranscript.length > 5) {
            let elapsed = 0;

            // Progress Bar Animation
            setSilenceProgress(0);
            setIsFinalizing(false);

            progressInterval = setInterval(() => {
                elapsed += UPDATE_FREQ;
                const percent = Math.min((elapsed / SILENCE_LIMIT) * 100, 100);
                setSilenceProgress(percent);

                if (elapsed >= 1500 && !isFinalizing) {
                    setIsFinalizing(true); // Show "Finalizing..." text
                }
            }, UPDATE_FREQ);

            // Action: Auto-Submit after 4s
            submitTimer = setTimeout(() => {
                console.log("⏳ Silence detected. Auto-submitting...");
                manualSubmitTriggered.current = true; // Prevent onend conflict
                if (recognitionRef.current) recognitionRef.current.stop();
                handleTurn(userTranscript);
                setUserTranscript('');
                setSilenceProgress(0);
            }, SILENCE_LIMIT);

        } else {
            // Reset if speaking
            setSilenceProgress(0);
            setIsFinalizing(false);
        }

        return () => {
            clearTimeout(submitTimer);
            clearInterval(progressInterval);
        };
    }, [userTranscript, isMicActive]);

    const handleIntro = async () => {
        setAiState('thinking');
        try {
            // Note: In a real app, we would extract text from the PDF file here using pdf.js
            // or upload the file to an extraction endpoint first.
            // For this beta, we'll send a signal or if text is available.
            let resumeText = "";
            if (resume && resume.name) {
                // Fallback or placeholder for the AI to know a resume exists
                // For true handshake test, we'll pass a dummy text if filename implies it
                // resumeText = resume.name; 
            }

            const safeName = user?.full_name || "Candidate";
            console.log("🚀 Sending Name to Backend:", safeName);

            const res = await fetch('http://localhost:5000/api/beta/intro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company,
                    role,
                    resume_text: resumeText,
                    user_name: safeName
                })
            });

            const data = await res.json();

            if (data.success && data.data?.audio_text) {
                if (data.data.candidate_name) {
                    setCandidateName(data.data.candidate_name);
                }
                // Handshake Flow: Wait for audio to finish BEFORE listening
                await playAudio(data.data.audio_text, data.data.audio_url);
                startListening();
            }
        } catch (e) {
            console.error(e);
            await playAudio("Welcome to the interview. Let's begin.", null);
            startListening();
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser. Please use Chrome.");
            return;
        }

        setAiState('listening');
        setIsMicActive(true);
        setUserTranscript('');

        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.continuous = true; // CHANGED: Keep listening to avoid slight pauses cutting off
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setUserTranscript(transcript);
        };

        recognitionRef.current.onend = () => {
            if (manualSubmitTriggered.current) {
                // Handled manually, reset flag and exit
                manualSubmitTriggered.current = false;
                setIsMicActive(false);
                return;
            }

            if (userTranscript.trim().length > 0) {
                handleTurn(userTranscript);
            } else {
                // Restart if silence? Or allow user to manually click? 
                // For transparency, let's keep mic active until silence detection triggers end
            }
            setIsMicActive(false);
        };

        recognitionRef.current.start();
    };

    const handleTurn = async (answer) => {
        if (aiState === 'thinking') return; // Prevent double-submission
        setAiState('thinking');
        setIsFinalizing(false); // Clear finalizing badge

        // Add to local history
        const newHistory = [...conversationHistory, { role: 'user', content: answer }];
        setConversationHistory(newHistory);

        try {
            // Get last AI question
            const lastAiMsg = conversationHistory.filter(m => m.role === 'assistant').pop();
            const currentQuestion = lastAiMsg ? lastAiMsg.content : "Introduction";

            const res = await fetch('http://localhost:5000/api/beta/turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: newHistory, // Send simplified history
                    current_question: currentQuestion,
                    user_answer: answer,
                    candidate_name: candidateName
                })
            });

            const data = await res.json();
            if (data.success) {
                const { reaction, next_question, status, is_interview_over } = data.data;

                // Add AI response to history
                setConversationHistory(prev => [...prev, { role: 'assistant', content: next_question }]);

                // Speak Reaction then Question
                const fullText = `${reaction} ... ${next_question}`;
                await playAudio(fullText, data.data.audio_url);

                if (status === 'FINISHED' || status === 'COMPLETED' || is_interview_over) {
                    setAiState('idle');
                    // Automatically generate report when interview is done
                    finishInterview();
                } else {
                    startListening();
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const playAudio = (text, audioUrl) => {
        return new Promise((resolve) => {
            setAiState('speaking');
            setCurrentText(text);

            const onComplete = () => {
                setAiState('idle');
                setCurrentText('');
                resolve();
            };

            // Fallback to browser TTS if no audioUrl
            if (!audioUrl) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.onend = onComplete;
                synthRef.current.speak(utterance);
                return;
            }

            // Play generated audio
            if (audioRef.current) {
                audioRef.current.pause(); // Stop any previous
            }
            const audio = new Audio(`http://localhost:5000${audioUrl}`);
            audioRef.current = audio;

            audio.onended = onComplete;
            audio.play().catch(e => {
                console.error("Audio play failed, falling back to TTS", e);
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = onComplete;
                synthRef.current.speak(utterance);
            });
        });
    };

    const handleManualSubmit = () => {
        manualSubmitTriggered.current = true;

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        if (userTranscript.trim().length > 0) {
            setAiState('thinking');
            handleTurn(userTranscript);
            setUserTranscript(''); // Clear for UI immediate feedback
        } else {
            manualSubmitTriggered.current = false; // Reset flag so re-listening works
            alert("Please say something first!");
            // Optionally restart listening here?
        }
    };

    // Called when user clicks "End Call" - Abort without report
    const abortInterview = () => {
        if (webcamRef.current && webcamRef.current.video) {
            const stream = webcamRef.current.video.srcObject;
            if (stream) stream.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current) recognitionRef.current.stop();
        if (synthRef.current) synthRef.current.cancel();
        navigate('/dashboard');
    };

    const finishInterview = async () => {
        setAiState('thinking');
        if (recognitionRef.current) recognitionRef.current.stop();

        // Calculate Final Stats
        const totalFrames = accumulatedAttention.current.length || 1;
        const attendedFrames = accumulatedAttention.current.filter(Boolean).length;
        const finalAvgAttention = Math.round((attendedFrames / totalFrames) * 100);

        // Navigate to Report
        navigate('/interview/report', {
            state: {
                mode: 'beta',
                history: conversationHistory,
                emotionStats: accumulatedEmotions.current,
                avgAttention: finalAvgAttention,
                company,
                role,
                userId: user?.user_id || user?.id // Pass User ID
            }
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    REC
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-gray-800 px-3 py-1 rounded-full text-xs font-mono text-blue-300 border border-blue-500/30">
                        Question {Math.max(1, Math.ceil(conversationHistory.length / 2))} / 5
                    </div>
                    <span className="font-semibold text-gray-300">{company} | {role}</span>

                    <button onClick={abortInterview} title="End Call (No Report)" className="p-2 bg-red-600/20 text-red-400 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                        <PhoneOff className="w-5 h-5" />
                    </button>
                </div>
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

            {/* Main Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">

                {/* User Camera */}
                <div className={`relative bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl transition-all duration-300 ${aiState === 'listening' ? 'pulse-ring border-green-500/50' : ''}`}>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        className="w-full h-full object-cover mirrored"
                        mirrored={true}
                    />

                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full z-10 border border-white/10">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">You {candidateName ? `(${candidateName})` : ''}</span>
                        {modelsLoaded && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" title="AI Analysis Active"></span>}
                    </div>

                    {/* Live Analysis Badge (Bottom Right) */}
                    {modelsLoaded && (
                        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-10">
                            <div className="px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/70 text-white text-xs font-medium flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                                <Eye className="w-3 h-3 text-blue-400" />
                                <span>Attention: {eyeContactScore}%</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 bg-black/70 text-white text-xs font-medium flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 delay-100">
                                <span>😐 Emotion: {faceData.emotion}</span>
                            </div>
                        </div>
                    )}

                    {/* Live Analysis Badge (Bottom Right) */}


                    {/* Status Badge Overlay */}
                    <div className="absolute top-6 right-6">
                        {aiState === 'listening' && (
                            <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse shadow-lg font-bold">
                                <Mic className="w-5 h-5" /> Listening... Speak Now
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Avatar */}
                <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl overflow-hidden border border-indigo-500/30 shadow-2xl flex items-center justify-center">

                    {/* Abstract Avatar Visualization */}
                    <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${aiState === 'speaking' ? 'scale-110' : 'scale-100'}`}>
                        <div className={`absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 ${aiState === 'speaking' ? 'animate-pulse' : ''}`}></div>
                        <div className="w-40 h-40 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-inner relative z-10">
                            <Bot className="w-20 h-20 text-white/90" />
                        </div>

                        {/* Ring Animations */}
                        {aiState === 'speaking' && (
                            <>
                                <div className="absolute inset-0 border-4 border-blue-400/30 rounded-full animate-ping"></div>
                                <div className="absolute -inset-4 border-2 border-purple-400/20 rounded-full animate-pulse delay-75"></div>
                            </>
                        )}
                        {aiState === 'listening' && (
                            <div className="absolute -inset-8 border-2 border-green-400/30 rounded-full animate-pulse"></div>
                        )}
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">AI Interviewer</span>
                    </div>

                    {/* AI Status Badge */}
                    <div className="absolute top-6 right-6">
                        {aiState === 'thinking' && (
                            <div className="bg-yellow-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg font-bold">
                                <span className="animate-spin">🧠</span> Thinking...
                            </div>
                        )}
                        {aiState === 'speaking' && (
                            <div className="bg-blue-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg font-bold">
                                <Volume2 className="w-5 h-5 animate-pulse" /> AI Speaking...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Captions & Controls */}
            <div className="mt-6 max-w-4xl mx-auto w-full text-center">

                {/* Transcript / Subtitles */}
                {/* Transcript / Subtitles / Controls Mixed */}
                <div className="min-h-[100px] mb-8 flex flex-col items-center justify-center">
                    {/* Caption for AI */}
                    {currentText && (
                        <p className="text-2xl font-medium text-blue-200 animate-in fade-in slide-in-from-bottom-2 mb-6">
                            "{currentText}"
                        </p>
                    )}

                    {/* Live User Transcript */}
                    {aiState === 'listening' && (
                        <div className="w-full max-w-2xl px-4">
                            <div className="transcript-container bg-gray-900/50 border border-gray-700 rounded-xl p-4 relative overflow-hidden">
                                {/* Text Area */}
                                <div className="flex-1 min-h-[1.5em] text-left">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Live Transcript</div>
                                    <p className="text-xl text-white font-medium">
                                        {userTranscript || <span className="text-gray-600 italic">Listening...</span>}
                                    </p>
                                </div>

                                {/* Circular Manual Send Button */}
                                <button
                                    onClick={handleManualSubmit}
                                    title="Force Reply (Stop Listening)"
                                    className="manual-send-btn group bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    disabled={!userTranscript}
                                >
                                    {isFinalizing ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : (
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                </button>
                                {/* Visual Progress Bar */}
                                {silenceProgress > 0 && isMicActive && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-100 ease-linear" style={{ width: `${silenceProgress}%` }}></div>
                                )}
                            </div>

                            {/* Smart Status Text */}
                            {isFinalizing && (
                                <p className="silence-status text-blue-300 font-bold animate-pulse">
                                    ⏳ Finalizing...
                                </p>
                            )}
                        </div>
                    )}

                    {/* AI State Indicators (When NOT listening) */}
                    {aiState !== 'listening' && (
                        <div className="h-14 flex items-center text-gray-500 gap-2 mt-4">
                            {aiState === 'thinking' ? (
                                <span className="animate-pulse text-yellow-500">🧠 Processing your answer...</span>
                            ) : (
                                <span className="text-blue-400">AI is speaking...</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BetaInterviewRoom;
