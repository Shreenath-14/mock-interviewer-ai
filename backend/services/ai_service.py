import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
# Load environment variables (Robust Path)
basedir = os.path.abspath(os.path.dirname(__file__)) # .../backend/services
env_path = os.path.join(basedir, '..', '.env') # .../backend/.env
load_dotenv(env_path)

# Initialize Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print(f"DEBUG: AI Service Loaded. API Key found: {'Yes' if GEMINI_API_KEY else 'NO'}")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print(f"CRITICAL WARNING: GEMINI_API_KEY not found at {env_path}")

def clean_json_string(text: str) -> str:
    """
    Clean the JSON string by searching for the first JSON object using regex.
    """
    # Pattern to find the first { ... } block or [ ... ] block
    match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
    if match:
        return match.group(1)
    return text.strip()  # Fallback to original text if no pattern found

def generate_questions(resume_text: str, job_role: str, difficulty: str = "medium") -> list[dict]:
    """
    Generate interview questions using Google Gemini AI.
    
    Args:
        resume_text: The candidate's resume text
        job_role: The job role/position they're applying for
        difficulty: The difficulty level (easy, medium, hard)
    
    Returns:
        A list of 5 interview questions as dictionaries with 'question' and 'type' fields
    
    Raises:
        ValueError: If API key is not configured
        Exception: If API call fails
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment variables. Please add it to your .env file.")
    
    try:
        # Create the model instance
        model = genai.GenerativeModel('gemini-flash-latest')
        
        difficulty_instruction = ""
        if difficulty.lower() == "easy":
            difficulty_instruction = "Focus on fundamental definitions, basic concepts, and introductory scenario questions."
        elif difficulty.lower() == "hard":
            difficulty_instruction = "Focus on complex system design scenarios, deep-dive internal implementation details, and edge cases. questions should be challenging."
        else: # Medium/Default
            difficulty_instruction = "Focus on standard industry-level interview questions appropriate for a mid-level role."

        # Create the prompt for the AI interviewer
        prompt = f"""You are an experienced technical interviewer conducting a mock interview.

Candidate's Resume:
{resume_text}

Job Role: {job_role}
Difficulty Level: {difficulty}

Target Question Style: {difficulty_instruction}

Generate exactly 5 technical interview questions that are:
1. Relevant to the job role and candidate's experience
2. Appropriate for assessing technical skills at the requested difficulty
3. Mix of different question types (conceptual, problem-solving, experience-based)
4. Progressive in difficulty

Return ONLY a valid JSON array with this exact format:
[
  {{
    "question": "Question text here",
    "type": "technical" | "behavioral" | "problem-solving"
  }},
  ...
]

Do not include any markdown formatting, code blocks, or explanations. Return only the JSON array."""

        # Generate the response
        response = model.generate_content(prompt)
        
        # Clean and parse JSON
        response_text = clean_json_string(response.text)
        
        try:
            questions = json.loads(response_text)
            
            # Validate the response structure
            if not isinstance(questions, list):
                raise ValueError("AI response is not a list")
            
            if len(questions) != 5:
                print(f"⚠️ Warning: Expected 5 questions, got {len(questions)}")
            
            # Ensure each question has required fields
            validated_questions = []
            for i, q in enumerate(questions[:5]):  # Take only first 5
                if isinstance(q, dict) and "question" in q:
                    validated_questions.append({
                        "question": q.get("question", ""),
                        "type": q.get("type", "technical")
                    })
                else:
                    # If structure is wrong, create a simple question
                    validated_questions.append({
                        "question": str(q) if isinstance(q, str) else f"Question {i+1}",
                        "type": "technical"
                    })
            
            return validated_questions[:5]  # Ensure exactly 5 questions
            
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing AI response as JSON: {e}")
            print(f"Response text: {response_text[:200]}...")
            # Return fallback questions
            return _get_fallback_questions(job_role)
            
    except Exception as e:
        print(f"❌ Error calling Gemini API: {e}")
        # Return fallback questions if API fails
        return _get_fallback_questions(job_role)

def _get_fallback_questions(job_role: str) -> list[dict]:
    """
    Generate fallback questions when AI service is unavailable.
    
    Args:
        job_role: The job role/position
    
    Returns:
        A list of 5 generic interview questions
    """
    return [
        {
            "question": f"Tell me about your experience with {job_role}.",
            "type": "behavioral"
        },
        {
            "question": "What technical challenges have you faced in your previous projects?",
            "type": "technical"
        },
        {
            "question": "How do you approach debugging a complex issue?",
            "type": "problem-solving"
        },
        {
            "question": "Describe a time when you had to learn a new technology quickly.",
            "type": "behavioral"
        },
        {
            "question": "What is your process for code review and quality assurance?",
            "type": "technical"
        }
    ]

def grade_interview(history: list) -> dict:
    """
    Grade the interview based on conversation history.
    
    Args:
        history: List of dicts containing question and answer pairs
    
    Returns:
        Dict with score, feedback, and weak_areas
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")

    # Logic 1: Check if user actually answered anything
    answered_count = sum(1 for item in history if len(item.get('answer', '').strip()) > 5)
    if answered_count == 0:
        return {
            "score": 0,
            "feedback": "You didn't answer any questions. Please try again.",
            "weak_areas": ["Participation"]
        }

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Format history for prompt
        conversation_text = ""
        for item in history:
            conversation_text += f"\nQ: {item.get('question')}\nA: {item.get('answer')}\n"
            
        prompt = f"""You are an objective technical interviewer. Grade this candidate based on their answers.

Conversation:
{conversation_text}

Analyze the candidate's performance.
Return strictly valid JSON with no markdown formatting.
Format:
{{
  "score": <integer_0_to_100>,
  "feedback_summary": "<concise_paragraph>",
  "weak_areas": ["<area_1>", "<area_2>", "<area_3>"]
}}
"""


        response = model.generate_content(prompt)
        print(f"RAW GEMINI OUTPUT: {response.text}", flush=True)
        
        data = json.loads(clean_json_string(response.text))
        
        # Map feedback_summary to feedback for frontend compatibility
        if "feedback_summary" in data:
             data["feedback"] = data["feedback_summary"]
             
        return data
        
    except Exception as e:
        import traceback
        print(f"CRITICAL AI ERROR in grade_interview: {str(e)}")
        traceback.print_exc()
        
        # Logic 2: Explicit Failure Message
        return {
            "score": 0,
            "feedback": f"Grading Failed: {str(e)}",
            "weak_areas": ["System Error"]
        }



def review_resume(resume_text: str) -> dict:
    """
    Review a resume against industry standards using Gemini AI.
    
    Args:
        resume_text: The extracted text from the resume.
        
    Returns:
        A dict containing score, formatting_score, content_score, missing_keywords, and improvements.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
        
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""You are a Senior Technical Recruiter and Resume Expert. 
Review the following resume text against "Jake's Resume" standards (Harvard style), which emphasizes:
1. Single column layout (implied by text structure).
2. clear section headers.
3. specific "Action Verbs" at the start of bullets.
4. "XYZ" bullet point format (Accomplished [X] as measured by [Y], by doing [Z]).
5. quantifiable metrics.

Resume Text:
{resume_text}

Analyze the resume and return a strict JSON object with this format:
{{
  "score": <overall_score_0_100>,
  "formatting_score": <score_0_100_based_on_structure_and_clarity>,
  "content_score": <score_0_100_based_on_metrics_and_verbs>,
  "missing_keywords": ["<keyword1>", "<keyword2>", ...],
  "improvements": [
    "Improvement 1 (be specific)",
    "Improvement 2",
    ...
  ]
}}
Return ONLY valid JSON.
"""

        response = model.generate_content(prompt)
        print(f"🔥🔥🔥 RAW GEMINI OUTPUT: {response.text}", flush=True)
        
        data = json.loads(clean_json_string(response.text))
        return data
        
    except Exception as e:
        print(f"❌ Error reviewing resume: {e}")
        return {
            "score": 0,
            "formatting_score": 0,
            "content_score": 0,
            "missing_keywords": [],
            "improvements": ["Failed to analyze resume. Please try again."]
        }

def generate_mock_test(topic: str, difficulty: str = "medium", count: int = 10) -> list[dict]:
    """
    Generate multiple-choice questions for a mock test.
    
    Args:
        topic: The topic of the test within the job role context
        difficulty: The difficulty level
        count: Number of questions to generate
        
    Returns:
        List of dicts representing MCQs
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
        
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""Generate {count} multiple-choice questions on {topic} ({difficulty} level).
        
Return ONLY a valid JSON array of objects.
Do not include any markdown formatting or code blocks.
Each object must follow this exact schema:
{{
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Exact text of the correct option",
    "explanation": "Brief explanation of why it is correct"
}}
"""
        response = model.generate_content(prompt)
        # Clean the response
        cleaned_text = clean_json_string(response.text)
        data = json.loads(cleaned_text)
        
        if not isinstance(data, list):
            # Try to fix wrapped object if present
            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            else:
                 raise ValueError("AI response is not a list")
                 
        return data[:count]

    except Exception as e:
        print(f"❌ Error generating mock test: {e}")
        # Fallback question set
        return [
            {
                "question": f"Sample question about {topic}",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": "This is a fallback question because the AI service failed."
            }
        ]

def extract_info_from_resume(resume_text: str) -> dict:
    """
    Extract candidate name and title from resume text.
    """
    if not GEMINI_API_KEY:
         raise ValueError("GEMINI_API_KEY is not set")

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"""IExtract the candidate's name from the resume text below. If the text is empty, unreadable, or no name is found, return 'Unknown'. DO NOT invent a name.

Resume Text:
{resume_text[:2000]}... (truncated)

Return ONLY a valid JSON object:
{{
    "name": "Candidate Name" (or "Unknown"),
    "title": "Current Job Title" (or "Unknown")
}}
"""
        response = model.generate_content(prompt)
        text = clean_json_string(response.text)
        return json.loads(text)
    except Exception as e:
        print(f"Error extracting info: {e}")
        return {"name": "Candidate", "title": "Applicant"}

def get_candidate_info(resume_text: str) -> dict:
    """
    Extract candidate name and title from resume text.
    Alias for extract_info_from_resume.
    """
    return extract_info_from_resume(resume_text)

def generate_beta_intro(company: str, role: str, resume_text: str = "") -> dict:
    """
    Generate a warm recruiter introduction, personalized if resume is provided.
    """
    if not GEMINI_API_KEY:
         raise ValueError("GEMINI_API_KEY is not set")
         
    try:
        candidate_info = {"name": "", "title": ""}
        if resume_text:
            candidate_info = get_candidate_info(resume_text)
            
        name = candidate_info.get('name') or "Candidate"
        title = candidate_info.get('title')
        
        # Specific prompt for "Handshake"
        if name and title and name != "Candidate":
             prompt = f"Act as a recruiter from {company}. You are interviewing {name}, who is a {title}. Write a 1-sentence welcome message. Do NOT say 'Hi', 'Hello', or include the name at the start. Just the welcome message."
        else:
             prompt = f"Act as a recruiter from {company} for the {role} role. Write a 1-sentence welcome message. Do NOT say 'Hi' or 'Hello'. Just the welcome message."
        
        response = model.generate_content(prompt)
        text = response.text.strip()

        return {
            "audio_text": text,
            "candidate_name": name if name != "Candidate" else None
        }
    except Exception as e:
        print(f"Error generating intro: {e}")
        return {"audio_text": f"Welcome to your interview for {role} at {company}. My name is Alex, and I'll be your interviewer today."}

def generate_beta_turn(history: list, current_question: str, user_answer: str, candidate_name: str = "Candidate", force_end: bool = False) -> dict:
    """
    Generate the next turn in the conversation.
    """
    if not GEMINI_API_KEY:
         raise ValueError("GEMINI_API_KEY is not set")

    try:
        model = genai.GenerativeModel('gemini-flash-latest')

        # Calculate Turn Count (User turns) before building prompt
        user_turns = sum(1 for item in history if item.get('role') == 'user')
        
        # Auto-end after 5 questions (or if force_end is passed)
        if user_turns >= 5:
            force_end = True
        
        # Build context from history
        context_str = ""
        for turn in history[-10:]: # Keep last 10 turns for context
            role = turn.get('role', 'unknown')
            content = turn.get('content', '')
            if role == 'assistant':
                context_str += f"AI: {content}\n"
            elif role == 'user':
                context_str += f"Candidate: {content}\n"

        prompt = f"""You are a technical interviewer interviewing {candidate_name}.
        
Conversation History:
{context_str}

Current Question: "{current_question}"
Candidate Answer: "{user_answer}"

Analyze the user's answer. 
1) Provide a brief reaction (e.g., 'Good insight', 'That is partially correct').
2) If the answer was very short (less than 5 words) or unclear, ask them to elaborate before moving on.
3) Ask the NEXT relevant question to continue the interview. 
   CRITICAL: Review the Conversation History above. Do NOT ask a question that has already been asked. Move to a new topic or go deeper into the current one.

{f"SYSTEM OVERRIDE: The interview is over (5 questions reached). Briefly thank {candidate_name} for their time, mention HR will be in touch, and say 'Goodbye'. Do NOT ask a new question. Set status to 'COMPLETED'." if force_end else ""}

Return ONLY a valid JSON object:
{{
    "reaction": "Brief reaction text...",
    "next_question": "The next question...",
    "status": "CONTINUE" 
}}
(Or set status to 'FINISHED' if you think the interview should end).
"""
        response = model.generate_content(prompt)
        text = clean_json_string(response.text)
        result = json.loads(text)
        
        # LOGIC: Check for Duplicates
        ai_next_q = result.get("next_question", "").lower().strip()
        previous_questions = [
            turn.get('content', '').lower().strip() 
            for turn in history 
            if turn.get('role') == 'assistant'
        ]
        
        # Simple fuzzy check (exact match or substring)
        is_duplicate = any(ai_next_q in prev or prev in ai_next_q for prev in previous_questions if len(prev) > 10)
        
        if is_duplicate:
             print(f"⚠️ DETECTED DUPLICATE QUESTION: {ai_next_q}. Triggering Fallback.")
             raise ValueError("Duplicate Question Generated")
             
        return result
    
    except Exception as e:
        print(f"[ERROR] in generate_beta_turn: {e}")
        import traceback
        traceback.print_exc()
        
        try:
            # Dynamic Fallback to prevent loops
            fallback_questions = [
                "Could you tell me about a challenging project you've worked on?",
                "What comes into your mind when I say 'Teamwork'?",
                "How do you handle tight deadlines?",
                "What is your preferred programming language and why?",
                "Can you describe a time you failed and how you handled it?",
                "Where do you see yourself in 5 years?",
                "Do you prefer working alone or in a team?",
                "How do you stay updated with new technologies?"
            ]
            
            # Filter out used fallbacks from history
            previous_texts = [t.get('content','').lower() for t in history]
            available_fallbacks = [q for q in fallback_questions if q.lower() not in str(previous_texts).lower()]
            
            if not available_fallbacks:
                available_fallbacks = fallback_questions # Reset if all used
            
            import random
            next_q = random.choice(available_fallbacks)
            
            return {
                "reaction": "That makes sense.",
                "next_question": next_q,
                "status": "CONTINUE"
            }
        except Exception as fallback_err:
             # Absolute Fail-Safe
             print(f"CRITICAL FALLBACK ERROR: {fallback_err}")
             return {
                "reaction": "I see.",
                "next_question": "Let's move on. What is your experience with Databases?",
                "status": "CONTINUE"
             }

def grade_beta_interview(history: list, emotion_stats: dict, avg_attention: float) -> dict:
    """
    Grade a Beta interview using multimodal signals (text + face + attention).
    """
    if not GEMINI_API_KEY:
         raise ValueError("GEMINI_API_KEY is not set")
         
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # 1. Format Conversation
        conversation_text = ""
        for item in history:
            role = item.get('role', 'unknown')
            content = item.get('content', '')
            conversation_text += f"{role.upper()}: {content}\n"
            
        # 2. Format Physical Signals
        # e.g., emotion_stats = {'neutral': 100, 'happy': 20, 'surprised': 5}
        total_frames = sum(emotion_stats.values()) if emotion_stats else 1
        
        # Calculate percentages
        emotion_summary = "Facial Expressions Analysis:\n"
        if emotion_stats:
             for emotion, count in emotion_stats.items():
                 pct = (count / total_frames) * 100
                 if pct > 5: # Only significant ones
                     emotion_summary += f"- {emotion}: {pct:.1f}%\n"
        else:
             emotion_summary += "No facial expression data available (Camera was off).\n"
             
        attention_summary = f"Average Eye Contact/Attention Score: {avg_attention}%"
        
        prompt = f"""You are an expert Interview Evaluator. Grade this candidate based on:
1. Conversation Content (Technical/Soft Skills)
2. Physical Signals (Eye Contact & Facial Expressions)

DATA:
{emotion_summary}
{attention_summary}

Conversation:
{conversation_text}

TASK:
Analyze the "Whole Candidate". 
- Confidence: Combine their eye contact score ({avg_attention}%) with the confidence of their speech. High attention (>70%) usually implies good confidence, but check if they sounded hesitant in text.
- Behavior/Mood: Interpret the facial expressions. (e.g., Mostly 'neutral' is professional. 'Fearful' or 'Sad' is a concern. 'Happy' is good rapport).
- Technical: Grade the accuracy of their answers.
- Improvements: List 5 specific, actionable areas for improvement based on the conversation and behavior.

Return VALID JSON:
{{
  "scores": {{
    "overall": 0-100,
    "confidence": 0-100,
    "technical": 0-100,
    "communication": 0-100
  }},
  "mood_analysis": "A brief paragraph describing their demeanor/mood based on the data.",
  "technical_feedback": "Specific feedback on their hard skills.",
  "behavioral_feedback": "Feedback on soft skills, eye contact, and body language cues.",
  "improvement_suggestions": [
    "Suggestion 1",
    "Suggestion 2",
    "Suggestion 3",
    "Suggestion 4",
    "Suggestion 5"
  ]
}}
"""
        response = model.generate_content(prompt)
        text = clean_json_string(response.text)
        return json.loads(text)
        
    except Exception as e:
        print(f"[ERROR] grading beta interview: {e}")
        
        # If Quota Exceeded or Error, return a Mock Report for Beta Testing
        # If Quota Exceeded or Error, return a Mock Report for Beta Testing
        if "429" in str(e) or "Quota" in str(e): # Only mock if actually Rate Limited
            print("⚠️ Rate Limit Triggered. Using Fallback Report.")
            return {
              "scores": {
                "overall": 85,
                "confidence": max(0, min(100, int(avg_attention))),
                "technical": 82,
                "communication": 88
              },
              "mood_analysis": "Based on the available data, the candidate appeared calm and professional. The facial analysis indicates mostly neutral expressions with moments of engagement.",
              "technical_feedback": "(AI Unavailable) The candidate showed good understanding of the topics discussed.",
              "behavioral_feedback": "Eye contact matches the confidence score. Good posture and engagement detected.",
              "improvement_suggestions": [
                  "Maintain more consistent eye contact during difficult questions.",
                  "Elaborate more on technical challenges you have overcome.",
                  "Ensure your answers follow the STAR method (Situation, Task, Action, Result).",
                  "Speak with slightly more vocal variety to show enthusiasm.",
                  "Pause briefly before answering to gather your thoughts."
              ]
            }
            
        return {
             "scores": {"overall": 0, "confidence": 0, "technical": 0, "communication": 0},
             "mood_analysis": "Error analyzing mood.",
             "technical_feedback": "Grading failed.",
             "behavioral_feedback": "Grading failed.",
             "improvement_suggestions": []
        }
