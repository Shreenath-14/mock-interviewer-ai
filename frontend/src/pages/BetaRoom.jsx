import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, User, Bot } from 'lucide-react';

const BetaRoom = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Placeholder for Beta Room
    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                    AI Interview 2.0 (Beta)
                </h1>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    This is the placeholder for the Conversational Interview Experience.
                    Development is in progress.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default BetaRoom;
