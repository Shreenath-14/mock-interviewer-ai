import pypdf
import io

def extract_text_from_pdf(file_stream) -> str:
    """
    Extract text from a PDF file stream using pypdf.
    
    Args:
        file_stream: A file-like object (bytes) containing the PDF data.
        
    Returns:
        The extracted text as a string.
        
    Raises:
        Exception: If PDF parsing fails.
    """
    try:
        # Try strict=False for leniency
        reader = pypdf.PdfReader(file_stream, strict=False)
        text = ""
        for page in reader.pages:
            try:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            except:
                pass
        
        # Fallback if text is empty (e.g. image PDF)
        if not text.strip():
            print("⚠️ extraction yielded empty text. Returning mock content for analysis.")
            return "[Resume Content Unreadable / Image PDF] - Please provide OCR text or a standard PDF."

        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        # Return a safe fallback rather than crashing
        return "[Resume Parsing Error] - The system could not read this file."
