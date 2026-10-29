import fitz
import re
from typing import Dict

def extract_text(file_path: str) -> str:
    """
    Given a file path to a PDF, use PyMuPDF to extract text from all pages.
    Cleans up the text by removing excessive whitespaces and common OCR artifacts.
    
    Args:
        file_path (str): The absolute or relative path to the PDF file.
        
    Returns:
        str: The fully cleaned, plain string extracted from the PDF.
        
    Raises:
        ValueError: If the PDF cannot be processed or opened.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise ValueError(f"Failed to open or parse the PDF: {str(e)}")
        
    raw_text_chunks = []
    
    # Iterate through every page in the document
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        raw_text_chunks.append(text)
        
    doc.close()
    
    combined_text = "\n".join(raw_text_chunks)
    
    # Cleaning sequence:
    # 1. Replace various Unicode space variants (like non-breaking spaces) with standard spaces
    combined_text = combined_text.replace('\xa0', ' ')
    # 2. Fix excessive newlines (more than 2 down to 2)
    combined_text = re.sub(r'\n{3,}', '\n\n', combined_text)
    # 3. Strip leading/trailing whitespace
    return combined_text.strip()


def structure_resume(raw_text: str) -> dict:
    """
    Parses unformatted raw resume text into distinct logical sections via Regex.
    Handles various standard headers like EXPERIENCE, EDUCATION, SKILLS, etc.
    
    Args:
        raw_text (str): The unformatted string block extracted from a resume.
        
    Returns:
        dict: A dictionary containing exact mapped buckets:
            {
               "summary": str,
               "experience_text": str,
               "education_text": str,
               "skills_text": str,
               "projects_text": str,
               "certifications_text": str,
               "full_text": str
            }
    """
    result = {
        "summary": "",
        "experience_text": "",
        "education_text": "",
        "skills_text": "",
        "projects_text": "",
        "certifications_text": "",
        "full_text": raw_text
    }
    
    # Map friendly dictionary keys to the Regex groups
    section_mapping = {
        "experience": "experience_text",
        "work experience": "experience_text",
        "professional experience": "experience_text",
        "education": "education_text",
        "academic background": "education_text",
        "skills": "skills_text",
        "technical skills": "skills_text",
        "summary": "summary",
        "objective": "summary",
        "professional summary": "summary",
        "projects": "projects_text",
        "personal projects": "projects_text",
        "certifications": "certifications_text"
    }

    # Match lines that consist essentially of JUST standard headers (all caps or Title Case)
    # Examples: "EDUCATION", "Professional Experience", "SKILLS:"
    # (?i) makes it case-insensitive.
    # ^ indicates the start of a line.
    header_pattern = re.compile(
        r'^(experience|work experience|professional experience|education|academic background|'
        r'skills|technical skills|summary|objective|professional summary|projects|personal projects|certifications)[\s\:\_\-]*$',
        re.MULTILINE | re.IGNORECASE
    )
    
    # Find all header matches so we can slice the text properly
    matches = list(header_pattern.finditer(raw_text))
    
    # Helper to clean section text
    def clean_section(text):
        return text.strip()
    
    # If no standard headers were detected at all, we fall back to dumping it all in summary
    if not matches:
        result["summary"] = clean_section(raw_text)
        return result

    # Loop through our found headers to extract the blocks belonging to them
    for i, match in enumerate(matches):
        current_header = match.group(1).lower().strip()
        start_index = match.end()
        
        # The block runs until the *next* headermatch, or the end of the text if it's the last one
        end_index = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)
        
        section_content = raw_text[start_index:end_index]
        
        # Map our normalized header to the targeted bucket in the dictionary
        key_name = section_mapping.get(current_header)
        
        if key_name:
            # We append in case there are multiple matching sections for some reason
            if result[key_name]:
                result[key_name] += "\n\n" + clean_section(section_content)
            else:
                result[key_name] = clean_section(section_content)
    
    return result

# Simple Text Block Test Driver
if __name__ == '__main__':
    dummy_text = """
JOHN DOE
Software Engineer | johndoe@email.com

SUMMARY
Passionate software developer with 4 years building scalable web backends.

TECHNICAL SKILLS
Python, FastAPI, Postgres, React Native, Typescript, AWS

WORK EXPERIENCE
Senior Backend Engineer at TechCorp
May 2020 - Present
- Designed microservices architecture reducing server load by 30%
- Led migration of legacy user system to Supabase Auth

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2016 - 2020

PROJECTS
CareerCoach App
- Built a career coaching AI tool using React Native and Python.
"""
    print("Testing structure_resume on dummy string...\n")
    parsed = structure_resume(dummy_text)
    
    for k, v in parsed.items():
        if k != "full_text":
            print(f"[{k.upper()}]\n{v}\n")
