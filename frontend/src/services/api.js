import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const generateQuestions = async (resumeText, role, difficulty = 'medium') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/interviews/generate-questions`, {
      resume_text: resumeText,
      role,
      difficulty,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Failed to generate questions';
    throw new Error(message);
  }
};

export default {
  generateQuestions,
};

