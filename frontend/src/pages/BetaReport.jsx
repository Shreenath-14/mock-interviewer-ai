import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Activity, Smile, BarChart2, Share2, Award, Download } from 'lucide-react';

const BetaReport = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { mode, history, emotionStats, avgAttention, company, role, userId } = location.state || {}; // Fallback safe

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!mode || mode !== 'beta') {
            // Redirect if accessed directly or wrong mode
            navigate('/dashboard');
            return;
        }

        const fetchReport = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/beta/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history,
                        emotion_stats: emotionStats,
                        avg_attention_score: avgAttention,
                        user_id: userId // Send User ID for history saving
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setReport(data.report);
                } else {
                    console.error("Report generation failed");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="w-16 h-16 border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Generating Multimodal Analysis...
                </h2>
                <p className="text-gray-400 mt-2 max-w-md">Processing your biometric signals (Eye Contact, Facial Expressions) and technical answers.</p>
            </div>
        );
    }

    if (!report) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading report.</div>;
    }

    const { scores, mood_analysis, technical_feedback, behavioral_feedback } = report;

    // Helper for donut charts
    const getCircleOffset = (score) => {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        return circumference - (score / 100) * circumference;
    };

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 md:p-12 print:bg-white print:text-black">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .report-container, .report-container * {
                        visibility: visible;
                    }
                    .report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        color: black;
                        padding: 20px;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Adjust colors for print */
                    .bg-gray-900, .bg-gray-800, .bg-gradient-to-r {
                        background: none !important;
                        background-color: white !important;
                        border: 1px solid #ddd !important;
                        color: black !important;
                        box-shadow: none !important;
                    }
                    .text-gray-300, .text-gray-400 {
                        color: #333 !important;
                    }
                    .text-white {
                        color: black !important;
                    }
                }
            `}</style>
            <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-700 report-container">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-400 uppercase tracking-widest mb-1">
                            <BrainCircuit className="w-4 h-4" /> Beta Intelligence Report
                        </div>
                        <h1 className="text-4xl font-bold text-white">{company} <span className="text-gray-600">/</span> {role}</h1>
                        <p className="text-gray-400 mt-1">Session completed on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3 no-print">
                        <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-all flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Dashboard
                        </button>
                        <button onClick={handleDownload} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>
                </div>

                {/* Score Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

                    {/* Overall Score - Big Circle */}
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" className="text-gray-800" fill="transparent" />
                                <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" className="text-blue-500 transition-all duration-1000 ease-out"
                                    strokeDasharray="251.2" strokeDashoffset={getCircleOffset(scores.overall)} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-bold text-white">{scores.overall}</span>
                                <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Overall</span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Stats */}
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-all">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium uppercase">Confidence</h3>
                            <div className="text-3xl font-bold mt-1">{scores.confidence}%</div>
                            <div className="text-xs text-gray-500 mt-2">Based on Eye Contact & Voice</div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium uppercase">Technical</h3>
                            <div className="text-3xl font-bold mt-1">{scores.technical}%</div>
                            <div className="text-xs text-gray-500 mt-2">Accuracy of Answers</div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-pink-500/30 transition-all">
                            <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                                <Smile className="w-6 h-6" />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium uppercase">Behavioral</h3>
                            <div className="text-3xl font-bold mt-1">{scores.communication}%</div>
                            <div className="text-xs text-gray-500 mt-2">Expression Analysis</div>
                        </div>
                    </div>
                </div>

                {/* Analysis Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Behavioral / Mood */}
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-pink-400" />
                                Mood & Behavioral Analysis
                            </h3>
                            <div className="prose prose-invert">
                                <p className="text-gray-300 leading-relaxed text-lg italic">"{mood_analysis}"</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Detailed Feedback</h4>
                                <p className="text-gray-400 text-sm">{behavioral_feedback}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Technical */}
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-purple-400" />
                                Technical Evaluation
                            </h3>
                            <div className="prose prose-invert">
                                <p className="text-gray-300 leading-relaxed">{technical_feedback}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Improvements Section */}
            {report.improvement_suggestions && report.improvement_suggestions.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-bottom-6 duration-700 delay-200">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                            <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                                <Activity className="w-5 h-5" />
                            </span>
                            Top 5 Areas for Improvement
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {report.improvement_suggestions.map((tip, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BetaReport;
