import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, ArrowRight, Loader2, BookOpen, Clock, Hash, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TestSetup = () => {
    const navigate = useNavigate();
    const { } = useAuth();

    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionCount, setQuestionCount] = useState(10);
    const [timerDuration, setTimerDuration] = useState(30);
    const [enableAntiCheat, setEnableAntiCheat] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const difficultyOptions = [
        { value: 'Easy', label: 'Easy', color: 'bg-green-500/10 text-green-500 border-green-500/50' },
        { value: 'Medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' },
        { value: 'Hard', label: 'Hard', color: 'bg-red-500/10 text-red-500 border-red-500/50' }
    ];

    const suggestedTopics = ['React', 'Python', 'System Design', 'JavaScript', 'SQL'];

    const handleStartTest = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/test/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    difficulty: difficulty,
                    count: questionCount
                })
            });

            const data = await response.json();

            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                // Navigate to Arena with questions
                navigate('/test/start', {
                    state: {
                        questions: data.data,
                        topic: topic,
                        difficulty: difficulty,
                        timerDuration: timerDuration,
                        enableAntiCheat: enableAntiCheat
                    }
                });
            } else {
                setError(data.error || 'Failed to generate questions. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please check your internet or try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
            </div>

            <div className="w-full max-w-lg relative z-10">
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Mock Test Setup</h1>
                    <p className="text-gray-400">Challenge yourself with AI-generated questions.</p>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Topic Input */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Topic</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BookOpen className="w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="e.g. React Hooks, Docker, Python Basics..."
                            />
                        </div>
                        {/* Suggestions */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {suggestedTopics.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTopic(t)}
                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full px-3 py-1 text-xs text-gray-300 transition-colors"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-3 ml-1">Difficulty Level</label>
                        <div className="grid grid-cols-3 gap-3">
                            {difficultyOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setDifficulty(opt.value)}
                                    className={`py-3 rounded-xl border font-medium text-sm transition-all flex flex-col items-center gap-1 ${difficulty === opt.value
                                        ? `${opt.color} bg-opacity-20 shadow-lg`
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <Target className="w-4 h-4" />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Question Count */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3 ml-1 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-blue-400" />
                                Questions: <span className="text-white font-bold">{questionCount}</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                value={questionCount}
                                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                                <span>5</span>
                                <span>10</span>
                                <span>20</span>
                            </div>
                        </div>

                        {/* Timer Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3 ml-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                Time per Question
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[30, 60, 90, 120].map(seconds => (
                                    <button
                                        key={seconds}
                                        onClick={() => setTimerDuration(seconds)}
                                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${timerDuration === seconds
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                                            }`}
                                    >
                                        {seconds}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>



                    {/* Anti-Cheat Toggle */}
                    <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${enableAntiCheat ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 text-gray-400'}`}>
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Anti-Cheating Monitor</h3>
                                <p className="text-xs text-gray-400">Warnings for tab switching</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnableAntiCheat(!enableAntiCheat)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${enableAntiCheat ? 'bg-red-500' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enableAntiCheat ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleStartTest}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Test...
                            </>
                        ) : (
                            <>
                                Start Test <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default TestSetup;
