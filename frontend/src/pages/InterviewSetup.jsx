import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Sparkles, Mic, Video, Volume2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InterviewSetup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isBetaMode = queryParams.get('mode') === 'beta';
    const { user } = useAuth();

    // Form State
    const [role, setRole] = useState('Full Stack Developer');
    const [company, setCompany] = useState('Google');
    const [customCompany, setCustomCompany] = useState('');
    const [resumeFile, setResumeFile] = useState(null);

    // Hardware State
    const [cameraPermission, setCameraPermission] = useState(false);
    const [audioTesting, setAudioTesting] = useState(false);

    // Webcam ref
    const webcamRef = useRef(null);

    const companies = [
        { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
        { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
        { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
        { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
        { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
        { name: 'Other', logo: null }
    ];

    const handleAudioTest = async () => {
        try {
            setAudioTesting(true);
            const res = await fetch('http://localhost:5000/api/voice/test');
            const data = await res.json();

            if (data.success && data.audio_url) {
                const audio = new Audio(`http://localhost:5000${data.audio_url}`);
                audio.onended = () => setAudioTesting(false);
                await audio.play();
            } else {
                alert("Failed to generate audio test.");
                setAudioTesting(false);
            }
        } catch (e) {
            console.error("Audio test failed", e);
            alert("Error testing audio. Ensure backend is running.");
            setAudioTesting(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setResumeFile(file);
        } else {
            alert("Please upload a PDF file.");
        }
    };

    const startSession = () => {
        // Correct company name logic
        const selectedCompany = company === 'Other' ? customCompany : company;

        if (!selectedCompany) {
            alert("Please select a company.");
            return;
        }
        if (!role) {
            alert("Please enter a target role.");
            return;
        }
        // Note: We are allowing resume to be optional for now as it's not strictly blocked by backend yet in all paths, 
        // but good to encourage. If mandatory, uncomment below:
        // if (!resumeFile) { alert("Please upload a resume."); return; }

        // Navigate to actual interview page with state
        const targetRoute = isBetaMode ? '/interview/beta-room' : '/interview';

        navigate(targetRoute, {
            state: {
                role,
                company: selectedCompany,
                resume: resumeFile,
                setupComplete: true
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
            <div className="max-w-6xl w-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2">

                {/* Left: Configuration */}
                <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-blue-400" />
                            {isBetaMode ? "Beta Experience Setup" : "Interview Setup"}
                        </h1>
                        <p className="text-gray-400 mt-2">Configure your simulation settings.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Company Selector */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Target Company</label>
                            <div className="grid grid-cols-3 gap-3">
                                {companies.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => setCompany(c.name)}
                                        className={`p-3 rounded-xl border transition-all flex items-center justify-center ${company === c.name
                                            ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-purple-500/50'
                                            : 'bg-white/5 border-gray-700 hover:border-gray-500 hover:bg-white/10'
                                            }`}
                                    >
                                        {c.logo ? (
                                            <img src={c.logo} alt={c.name} className="h-6 w-auto opacity-90" />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-300">{c.name}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Company Input */}
                            {company === 'Other' && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        value={customCompany}
                                        onChange={(e) => setCustomCompany(e.target.value)}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500"
                                        placeholder="Enter Company Name..."
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        {/* Role Input */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Target Role</label>
                            <input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="e.g. Senior Frontend Engineer"
                            />
                        </div>

                        {/* Resume Upload */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Resume (PDF)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleResumeUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="bg-gray-800/50 border border-dashed border-gray-600 rounded-xl p-4 text-center group-hover:border-blue-500 group-hover:bg-gray-800 transition-all">
                                    {resumeFile ? (
                                        <span className="text-blue-400 font-medium">{resumeFile.name}</span>
                                    ) : (
                                        <span className="text-gray-500">Drag & drop or click to upload PDF</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Hardware Check */}
                <div className="p-8 lg:p-12 bg-black/20 flex flex-col justify-center">
                    <div className="aspect-video bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden relative shadow-2xl mb-6 group">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            onUserMedia={() => setCameraPermission(true)}
                            onUserMediaError={() => setCameraPermission(false)}
                            className="w-full h-full object-cover"
                            mirrored={true}
                        />

                        {/* Overlay UI */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <div className={`w-2 h-2 rounded-full ${cameraPermission ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-xs font-medium text-white/90">
                                {cameraPermission ? 'Camera Active' : 'Camera Off'}
                            </span>
                        </div>

                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <span className="text-xs font-medium text-blue-300 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Face Tracking: Initializing...
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Video className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">Camera</div>
                                <div className="text-xs text-gray-400">Default WebCam</div>
                            </div>
                        </div>

                        <button
                            onClick={handleAudioTest}
                            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-800 hover:border-gray-500 transition-all text-left"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${audioTesting ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                <Volume2 className={`w-5 h-5 ${audioTesting ? 'animate-pulse' : ''}`} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">Audio Test</div>
                                <div className="text-xs text-gray-400">{audioTesting ? 'Playing...' : 'Click to test'}</div>
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={startSession}
                        disabled={!resumeFile}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg shadow-xl shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        {isBetaMode ? "Enter Beta Room" : "Enter Interview Room"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    {!resumeFile && (
                        <p className="text-center text-red-500 text-sm mt-3 font-medium animate-pulse">
                            Please upload your resume to generate personalized questions.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default InterviewSetup;
