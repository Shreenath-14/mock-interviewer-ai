
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Briefcase, Sparkles, FileText, Clock, AlertCircle, Edit2, X, Save, Loader2, BrainCircuit, Bot } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  // New split state
  const [normalInterviews, setNormalInterviews] = useState([]);
  const [betaInterviews, setBetaInterviews] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    skills: '',
    password: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        skills: user.skills ? user.skills.join(', ') : '',
        password: ''
      });
    }
  }, [user]);

  useEffect(() => {
    // Check for user_id or id
    const userId = user?.user_id || user?.id;

    if (userId) {
      setLoadingHistory(true);

      const fetchNormal = fetch(`http://localhost:5000/api/interviews/history?user_id=${userId}&type=normal`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setNormalInterviews(data.history || []);
        });

      const fetchBeta = fetch(`http://localhost:5000/api/interviews/history?user_id=${userId}&type=beta`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setBetaInterviews(data.history || []);
        });

      const fetchTests = fetch(`http://localhost:5000/api/test/history?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setTestHistory(data.data || []);
        });

      Promise.all([fetchNormal, fetchBeta, fetchTests])
        .catch(err => console.error("History fetch error", err))
        .finally(() => setLoadingHistory(false));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);

      // Get user ID with fallbacks
      const userId = user?.user_id || user?.id || JSON.parse(localStorage.getItem('user'))?.user_id;

      if (!userId) {
        throw new Error('User ID missing. Please try logging out and back in.');
      }

      const payload = {
        user_id: userId,
        full_name: formData.full_name,
        skills: skillsArray
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        updateUser(data.user);
        setShowEditProfile(false);
        setFormData(prev => ({ ...prev, password: '' })); // Clear password
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch (e) {
      setProfileError(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* User Info Card */}
        <div
          onClick={() => setShowEditProfile(true)}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6 cursor-pointer hover:border-gray-500 transition-all group relative"
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.full_name || 'User'}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Use Profile
                </h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {profileError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {profileError}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                  <input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Skills <span className="text-xs opacity-60">(comma separated)</span></label>
                  <input
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password <span className="text-xs opacity-60">(leave blank to keep current)</span></label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skills Section */}
        {user?.skills && user.skills.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Your Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all group">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white group-hover:text-blue-300 transition-colors">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Mock Interview
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Practice generic or role-specific mock interviews with our advanced AI.
              Get instant feedback on your answers, identify weak areas, and report cards.
            </p>
            <button
              onClick={() => navigate('/interview/setup')}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
            >
              Start New Session
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all group">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white group-hover:text-green-300 transition-colors">
              <FileText className="w-5 h-5 text-green-400" />
              Resume AI Scanner
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Upload your PDF resume to check it against FAANG standards.
              Get an instant score, formatting check, and list of missing keywords.
            </p>
            <button
              onClick={() => navigate('/resume-review')}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-all border border-gray-600 hover:border-gray-500"
            >
              Analyze Resume
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all group">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white group-hover:text-yellow-300 transition-colors">
              <BrainCircuit className="w-5 h-5 text-yellow-500" />
              Technical Mock Test
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Take a timed multiple-choice quiz on specific technical topics.
              Test your knowledge under pressure and get detailed solution explanations.
            </p>
            <button
              onClick={() => navigate('/test/setup')}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-all border border-gray-600 hover:border-gray-500"
            >
              Take Assessment
            </button>
          </div>
        </div>

        {/* AI Interview 2.0 Beta Entry */}
        <div className="mt-8 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none"></div>
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  AI Interview 2.0
                  <span className="px-2 py-0.5 bg-pink-500/20 border border-pink-500/30 text-pink-400 text-xs rounded-full uppercase tracking-wider font-bold">Beta</span>
                </h3>
                <p className="text-gray-400 mt-1 max-w-xl">
                  Experience a real-time conversational interview with a Human-like AI.
                  It listens, reacts, and adapts to your answers instantly.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/interview/setup?mode=beta')}
              className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 whitespace-nowrap shadow-xl shadow-white/10"
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              Try Beta Mode
            </button>
          </div>
        </div>

        {/* SECTION 1: AI Mock Interviews (Normal) */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            AI Mock Interviews (Standard)
          </h3>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-lg">
            {loadingHistory ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : normalInterviews.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No standard mock interviews taken yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                <div className="grid grid-cols-4 p-4 bg-gray-800/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div>Date</div>
                  <div className="col-span-2">Role</div>
                  <div className="text-right">Score</div>
                </div>
                {normalInterviews.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 p-4 items-center hover:bg-gray-750 transition-colors">
                    <div className="text-gray-300 text-sm">{item.date}</div>
                    <div className="col-span-2 text-white font-medium">{item.job_role}</div>
                    <div className={`text-right font-bold ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Beta Interviews (Special) */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Beta Interviews
            <span className="ml-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs rounded-full uppercase tracking-wider font-bold">
              Camera Enabled
            </span>
          </h3>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-900/30 rounded-xl overflow-hidden shadow-lg shadow-purple-900/10">
            {loadingHistory ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : betaInterviews.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No Beta interviews taken yet. Try the generic human-like mode!
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                <div className="grid grid-cols-4 p-4 bg-purple-900/20 text-xs font-semibold text-purple-200 uppercase tracking-wider">
                  <div>Date</div>
                  <div>Role</div>
                  <div className="text-center">Attention</div>
                  <div className="text-right">Score</div>
                </div>
                {betaInterviews.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 p-4 items-center hover:bg-gray-750 transition-colors">
                    <div className="text-gray-300 text-sm">{item.date}</div>
                    <div className="text-white font-medium">{item.job_role || "Beta Session"}</div>
                    <div className="text-center">
                      {item.avg_attention_score ? (
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {Math.round(item.avg_attention_score)}%
                        </span>
                      ) : <span className="text-gray-600">-</span>}
                    </div>
                    <div className={`text-right font-bold ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Assessments */}
        <div className="mt-12 mb-12">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-yellow-500" />
            Recent Assessments
          </h3>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-lg">
            {loadingHistory ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : testHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No assessments taken yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                <div className="grid grid-cols-4 p-4 bg-gray-800/80 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div>Date</div>
                  <div>Topic</div>
                  <div className="text-center">Level</div>
                  <div className="text-right">Score</div>
                </div>
                {testHistory.map((item) => {
                  const percentage = Math.round((item.score / item.total_questions) * 100) || 0;
                  return (
                    <div key={item.id} className="grid grid-cols-4 p-4 items-center hover:bg-gray-750 transition-colors">
                      <div className="text-gray-300 text-sm">{item.date}</div>
                      <div className="text-white font-medium">{item.topic}</div>
                      <div className="text-center text-xs text-gray-400">{item.difficulty || "Medium"}</div>
                      <div className={`text-right font-bold ${getScoreColor(percentage)}`}>
                        {item.score}/{item.total_questions}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
