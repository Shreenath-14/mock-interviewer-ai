import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const FeedbackResult = ({ score, feedback, weakAreas, behavioralMetrics, onBack }) => {
    // Determine color based on score
    const getScoreColor = (s) => {
        if (s >= 80) return 'text-green-400 border-green-400';
        if (s >= 60) return 'text-yellow-400 border-yellow-400';
        return 'text-red-400 border-red-400';
    };

    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 shadow-lg flex flex-col items-center max-w-2xl mx-auto animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                Interview Complete
            </h2>

            {/* Score Circle */}
            <div className={`relative w-40 h-40 rounded-full border-4 flex items-center justify-center mb-6 ${getScoreColor(score)}`}>
                <div className="text-center">
                    <span className="text-5xl font-bold">{score}</span>
                    <span className="block text-sm uppercase tracking-wider opacity-80 mt-1">Score</span>
                </div>
            </div>

            <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-3">Feedback Summary</h3>
                <p className="text-gray-300 leading-relaxed">{feedback}</p>
            </div>

            {weakAreas && weakAreas.length > 0 && (
                <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-6 mb-8">
                    <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Areas for Improvement
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                        {weakAreas.map((area, idx) => (
                            <li key={idx} className="pl-2">
                                <span className="-ml-2">{area}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Behavioral Metrics (New) */}
            {behavioralMetrics && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Eye Contact Card */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
                        <div className="text-sm text-gray-400 mb-1">👀 Eye Contact</div>
                        <div className={`text-2xl font-bold ${behavioralMetrics.eye_contact >= 70 ? 'text-green-400' : behavioralMetrics.eye_contact >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {behavioralMetrics.eye_contact}%
                        </div>
                    </div>
                    {/* Emotion Card */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
                        <div className="text-sm text-gray-400 mb-1">😊 Dominant Vibe</div>
                        <div className="text-2xl font-bold text-blue-300">
                            {behavioralMetrics.dominant_emotion || "Neutral"}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition-all text-white font-medium"
            >
                <RefreshCw className="w-4 h-4" />
                Back to Dashboard
            </button>
        </div>
    );
};

export default FeedbackResult;
