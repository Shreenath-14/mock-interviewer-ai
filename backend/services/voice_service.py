import os
import hashlib
import asyncio
import edge_tts

CACHE_DIR = os.path.join(os.getcwd(), "static", "audio_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Helper to run async code in sync flask
async def _save_edge_audio(text, filepath):
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    await communicate.save(filepath)

def generate_audio_url(text):
    """
    Generate audio using Microsoft Edge TTS (Free Neural Voice).
    Returns relative URL path (e.g. /static/audio_cache/xyz.mp3).
    """
    if not text:
        return None

    # 1. Create unique filename
    try:
        file_hash = hashlib.md5(text.encode()).hexdigest()
        filename = f"{file_hash}.mp3"
        filepath = os.path.join(CACHE_DIR, filename)

        # 2. Check Cache
        if not os.path.exists(filepath):
            print(f"🎤 Generating new audio for: {text[:20]}... (AriaNeural)")
            try:
                # Use asyncio.run to execute the async edge-tts generation
                asyncio.run(_save_edge_audio(text, filepath))
            except Exception as e:
                print(f"🔴 EdgeTTS Error: {e}")
                return None
        else:
             print(f"🔊 Returning cached audio for: {filename}")

        # 3. Return Relative URL (Frontend prepends domain)
        return f"/static/audio_cache/{filename}"
        
    except Exception as e:
        print(f"Error in voice generation: {e}")
        return None
