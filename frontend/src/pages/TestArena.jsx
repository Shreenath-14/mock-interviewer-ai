import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ChevronRight, RefreshCw, Home, AlertCircle, Trophy, BarChart2, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Confetti from 'react-confetti';

const TestArena = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State from navigation
    const questions = state?.questions || [];
    const topic = state?.topic || 'Unknown Topic';
    const difficulty = state?.difficulty || 'Medium';
    const timerDuration = state?.timerDuration || 30;
    const enableAntiCheat = state?.enableAntiCheat || false;

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({}); // { 0: 'Option A', 1: 'Option B' }
    const [timeLeft, setTimeLeft] = useState(timerDuration); // Dynamic duration
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [saving, setSaving] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [warnings, setWarnings] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [terminated, setTerminated] = useState(false);

    // Refs
    const timerRef = useRef(null);

    // Initial Redirect if no questions
    useEffect(() => {
        if (!questions || questions.length === 0) {
            navigate('/test/setup');
        }
    }, [questions, navigate]);

    // Window resize for confetti
    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (isSubmitted) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNext(true); // Auto advance
                    return timerDuration;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [currentIndex, isSubmitted]);

    // Anti-Cheat: Visibility Change
    useEffect(() => {
        if (!enableAntiCheat || isSubmitted || terminated) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        // DISQUALIFY
                        setTerminated(true);
                        finishTest(true); // true = forced
                    } else {
                        setShowWarningModal(true);
                    }
                    return newCount;
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [enableAntiCheat, isSubmitted, terminated]);


    const handleOptionSelect = (option) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [currentIndex]: option
        }));
    };

    const handleNext = (auto = false) => {
        clearInterval(timerRef.current);

        // If it was auto, and no answer selected, record it as skipped/timeout if needed
        // For now we just move on.

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(timerDuration);
        } else {
            finishTest();
        }
    };

    const finishTest = (forced = false) => {
        setIsSubmitted(true);
        clearInterval(timerRef.current);
        calculateScore(forced);
    };

    const calculateScore = async (forced = false) => {
        let newScore = 0;
        // If forced (cheating), score might be invalidated or just calculated as is.
        // Let's calculate what they did so far.
        const details = questions.map((q, idx) => {
            const userAns = selectedAnswers[idx];
            const isCorrect = userAns === q.correct_answer;
            if (isCorrect) newScore++;
            return {
                question: q.question,
                user_answer: userAns || null,
                correct_answer: q.correct_answer,
                is_correct: isCorrect,
                explanation: q.explanation
            };
        });

        // If forced termination, score is 0? Or just marked?
        // Let's keep the score but show FAIL.
        if (forced) {
            // Maybe set score to 0 or keeping it real but marking as terminated
        }

        setScore(newScore);
        setShowResult(true);

        // Save Result
        setSaving(true);
        try {
            const userId = user?.user_id || user?.id || JSON.parse(localStorage.getItem('user'))?.user_id || 'guest';
            await fetch('http://localhost:5000/api/test/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    topic: topic,
                    score: newScore,
                    total: questions.length,
                    details: details
                })
            });
        } catch (e) {
            console.error("Failed to save score", e);
        } finally {
            setSaving(false);
        }
    };

    if (!questions || questions.length === 0) return null;

    // --- RESULT VIEW ---
    if (showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        const isPassing = percentage >= 70;

        return (
            <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
                {isPassing && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} />}

                <div className="max-w-4xl mx-auto">

                    {terminated && (
                        <div className="bg-red-500/10 border border-red-500 rounded-2xl p-6 mb-8 text-center animate-pulse">
                            <h2 className="text-3xl font-bold text-red-500 mb-2 flex items-center justify-center gap-2">
                                <AlertTriangle className="w-8 h-8" />
                                Test Terminated
                            </h2>
                            <p className="text-red-300">
                                You exceeded the maximum allowed tab switches. Your test has been flagged.
                            </p>
                        </div>
                    )}

                    {/* Score Header */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8 text-center shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${isPassing ? 'bg-green-500' : 'bg-red-500'}`}></div>

                        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gray-800 mb-6">
                            {isPassing ? <Trophy className="w-10 h-10 text-yellow-500" /> : <BarChart2 className="w-10 h-10 text-gray-400" />}
                        </div>

                        <h1 className="text-4xl font-bold mb-2">{isPassing ? 'Great Job!' : 'Keep Practicing!'}</h1>
                        <p className="text-gray-400 mb-6">You scored <span className={`text-2xl font-bold ${isPassing ? 'text-green-400' : 'text-red-400'}`}>{score}</span> out of {questions.length}</p>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => navigate('/test/setup')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Try Another
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <Home className="w-4 h-4" /> Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Question Review */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-300 ml-1">Detailed Review</h2>
                        {questions.map((q, idx) => {
                            const userAns = selectedAnswers[idx];
                            const isCorrect = userAns === q.correct_answer;
                            const isSkipped = !userAns;

                            return (
                                <div key={idx} className={`bg-gray-900/50 border rounded-xl p-6 transition-all ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            {isCorrect ? (
                                                <CheckCircle className="w-6 h-6 text-green-500" />
                                            ) : isSkipped ? (
                                                <AlertCircle className="w-6 h-6 text-yellow-500" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-lg mb-3">{idx + 1}. {q.question}</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                {q.options.map((opt, i) => {
                                                    const isSelected = userAns === opt;
                                                    const isTheCorrectOne = opt === q.correct_answer;

                                                    let className = "p-3 rounded-lg border text-sm ";
                                                    if (isTheCorrectOne) className += "bg-green-500/20 border-green-500 text-green-300 font-medium";
                                                    else if (isSelected && !isCorrect) className += "bg-red-500/20 border-red-500 text-red-300";
                                                    else className += "bg-gray-800 border-gray-700 text-gray-400 opacity-60";

                                                    return (
                                                        <div key={i} className={className}>
                                                            {opt} {isTheCorrectOne && " (Correct)"} {isSelected && !isTheCorrectOne && " (Your Answer)"}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300 border border-gray-700/50">
                                                <span className="font-semibold text-blue-400">Explanation: </span>
                                                {q.explanation}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // --- TEST VIEW ---
    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">

            {/* Top Bar */}
            <div className="h-20 border-b border-gray-800 bg-gray-900/50 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-20">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">{topic} &bull; {difficulty}</span>
                    <span className="text-xl font-bold">Question {currentIndex + 1} <span className="text-gray-500 text-lg">/ {questions.length}</span></span>
                </div>

                {enableAntiCheat && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold animate-pulse">
                        <Shield className="w-3 h-3" /> PROCTORED
                    </div>
                )}

                <div className={`px-4 py-2 rounded-full font-mono text-xl font-bold border flex items-center gap-2 ${timeLeft <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-gray-800 text-blue-400 border-gray-700'}`}>
                    <Clock className="w-5 h-5" />
                    00:{timeLeft.toString().padStart(2, '0')}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-800">
                <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Main Arena */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">

                <div className="w-full bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl relative">
                    {/* Question */}
                    <h2 className="text-2xl md:text-3xl font-medium leading-relaxed mb-10 text-center animate-in fade-in slide-in-from-right-4 duration-300" key={currentIndex}>
                        {currentQ.question}
                    </h2>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {currentQ.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(opt)}
                                className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.01] ${selectedAnswers[currentIndex] === opt
                                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                                    : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:border-blue-500/50 hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${selectedAnswers[currentIndex] === opt
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'border-gray-600 text-gray-500'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="font-medium text-lg">{opt}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-end pt-4 border-t border-gray-800">
                        <button
                            onClick={() => handleNext()}
                            className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 transform active:scale-95"
                        >
                            {currentIndex === questions.length - 1 ? "Submit Test" : "Next Question"}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Warning Modal */}
            {showWarningModal && !terminated && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-gray-900 border-2 border-red-500 rounded-2xl p-8 max-w-md text-center shadow-2xl shadow-red-500/20">
                        <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-bounce" />
                        <h2 className="text-3xl font-bold text-white mb-2">Warning!</h2>
                        <h3 className="text-xl text-red-400 font-bold mb-4">{warnings}/3 Tab Switches Detected</h3>
                        <p className="text-gray-300 mb-8">
                            Please stay on this tab. 3 warnings will result in automatic disqualification.
                        </p>
                        <button
                            onClick={() => setShowWarningModal(false)}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}
        </div>

    );
};

export default TestArena;
