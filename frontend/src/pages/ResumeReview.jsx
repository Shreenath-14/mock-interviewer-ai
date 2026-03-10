import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResumeReview = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please upload a valid PDF file.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch('http://localhost:5000/api/resume/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.error || 'Failed to analyze resume.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('An error occurred while uploading. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </div>
                        <h1 className="text-2xl font-bold">Resume AI Scanner</h1>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Upload */}
                    <div className="space-y-6">
                        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-400" />
                                Upload Resume
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Upload your resume (PDF) to get an instant analysis against FAANG standards.
                            </p>

                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${file ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/50'
                                }`}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="resume-upload"
                                />

                                {file ? (
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FileText className="w-6 h-6 text-green-400" />
                                        </div>
                                        <p className="font-medium text-green-400">{file.name}</p>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="text-xs text-gray-500 hover:text-gray-300 mt-2 underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="resume-upload" className="cursor-pointer text-center w-full">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Upload className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <p className="font-medium">Click to upload PDF</p>
                                        <p className="text-xs text-gray-500 mt-1">Maximum size: 5MB</p>
                                    </label>
                                )}
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Scanning...
                                    </>
                                ) : (
                                    <>
                                        Run Analysis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Results */}
                    <div className="space-y-6">
                        {!result ? (
                            <div className="h-full min-h-[400px] bg-gray-900/40 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                <Star className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-lg font-medium">No results yet</p>
                                <p className="text-sm">Upload your resume to see the analysis.</p>
                            </div>
                        ) : (
                            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 shadow-lg animate-fadeIn">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-semibold">Analysis Report</h2>
                                    <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                                        {result.score}
                                        <span className="text-sm text-gray-500 font-normal ml-1">/ 100</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Content</p>
                                        <p className={`text-xl font-bold ${getScoreColor(result.content_score)}`}>
                                            {result.content_score}%
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Formatting</p>
                                        <p className={`text-xl font-bold ${getScoreColor(result.formatting_score)}`}>
                                            {result.formatting_score}%
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                                            Suggested Improvements
                                        </h3>
                                        <ul className="space-y-2">
                                            {result.improvements?.map((imp, idx) => (
                                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 mt-1.5 shrink-0" />
                                                    {imp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {result.missing_keywords?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-blue-400" />
                                                Missing Keywords
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {result.missing_keywords.map((kw, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-md border border-blue-500/20">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeReview;
