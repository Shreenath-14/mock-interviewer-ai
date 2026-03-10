
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from services.ai_service import generate_beta_turn

def test_ai_repetition():
    print("[INFO] Starting AI Repetition Test...")
    
    # Mock History: User has already introduced themselves
    history = [
        {"role": "assistant", "content": "Tell me about yourself."},
        {"role": "user", "content": "I am a software engineer with 5 years of experience in Python and React."}
    ]
    
    current_question = "Tell me about yourself."
    user_answer = "I am a software engineer."
    
    print(f"\n[INFO] Initial History Length: {len(history)}")
    
    # Simulate 3 Turns
    for i in range(1, 4):
        print(f"\n[INFO] Turn {i}...")
        
        # Call AI Logic
        response = generate_beta_turn(history, current_question, user_answer, candidate_name="Tester")
        
        next_q = response.get('next_question', '')
        reaction = response.get('reaction', '')
        
        print(f"   AI Reaction: {reaction}")
        print(f"   AI Question: {next_q}")
        
        if not next_q:
            print("   [ERROR] Error: No question returned.")
            break
            
        # Check for repetition
        previous_questions = [h['content'] for h in history if h['role'] == 'assistant']
        if next_q in previous_questions:
            print(f"   [FAILURE] AI repeated a question: '{next_q}'")
        else:
            print(f"   [SUCCESS] Question is unique.")
            
        # Append to history for next turn
        history.append({"role": "assistant", "content": next_q})
        history.append({"role": "user", "content": "This is a mock answer to satisfy the simulation."})
        current_question = next_q
        user_answer = "This is a mock answer to satisfy the simulation."

if __name__ == "__main__":
    test_ai_repetition()
