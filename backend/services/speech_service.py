"""
Speech-to-Text service placeholder.
This will be implemented with a real speech recognition service later.
"""

def transcribe_audio(audio_file) -> str:
    """
    Transcribe audio file to text.
    
    This is a placeholder function that returns mock transcription.
    In the future, this will integrate with a real Speech-to-Text service
    (e.g., Google Speech-to-Text, AWS Transcribe, or Whisper).
    
    Args:
        audio_file: The audio file object (FileStorage from Flask)
    
    Returns:
        Transcribed text as a string
    
    Raises:
        NotImplementedError: Always, since this is a placeholder
    """
    # Placeholder implementation
    return "Mock transcription: This is a placeholder for the speech-to-text functionality. Real implementation coming soon."

def transcribe_audio_mock(audio_file) -> str:
    """
    Mock transcription function for testing purposes.
    
    Args:
        audio_file: The audio file object
    
    Returns:
        Mock transcribed text
    """
    return "Mock transcription: User's spoken answer would appear here after real speech-to-text integration."

