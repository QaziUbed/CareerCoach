"""
Test script for PDF generation.
Run this after installing dependencies: pip install -r requirements.txt

This will generate sample_resume.pdf and sample_cover_letter.pdf
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.pdf_generator import generate_resume_pdf, generate_cover_letter_pdf


def test_resume_pdf():
    """Test resume PDF generation with sample data."""
    sample_data = {
        "summary": "Experienced Software Engineer with 5+ years of expertise in full-stack development, cloud architecture, and agile methodologies. Proven track record of delivering scalable solutions and leading cross-functional teams to achieve business objectives. Passionate about leveraging cutting-edge technologies to solve complex problems.",
        "experience": [
            {
                "company": "Tech Innovations Inc.",
                "title": "Senior Software Engineer",
                "dates": "Jan 2021 - Present",
                "bullets": [
                    "Led development of microservices architecture serving 2M+ daily active users, improving system reliability by 40%",
                    "Architected and implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes",
                    "Mentored team of 5 junior developers, conducting code reviews and technical training sessions",
                    "Collaborated with product managers to define technical requirements and deliver features on schedule"
                ]
            },
            {
                "company": "Digital Solutions Corp.",
                "title": "Software Engineer",
                "dates": "Jun 2018 - Dec 2020",
                "bullets": [
                    "Developed RESTful APIs using Python/Django serving 500K+ requests per day",
                    "Optimized database queries reducing average response time by 60%",
                    "Implemented automated testing framework increasing code coverage from 45% to 85%",
                    "Participated in agile ceremonies and contributed to sprint planning and retrospectives"
                ]
            }
        ],
        "skills": [
            "Python", "JavaScript", "React", "Node.js", "Django", "FastAPI",
            "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git",
            "CI/CD", "Microservices", "REST APIs", "GraphQL", "Redis", "Terraform"
        ]
    }
    
    output_path = "sample_resume.pdf"
    candidate_name = "John Doe"
    
    print("Generating sample resume PDF...")
    generate_resume_pdf(sample_data, output_path, candidate_name)
    print(f"✓ Sample resume PDF generated: {output_path}")


def test_cover_letter_pdf():
    """Test cover letter PDF generation with sample data."""
    sample_text = """Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at Tech Innovations Inc. With over 5 years of experience in full-stack development and a proven track record of delivering scalable solutions, I am confident that I would be a valuable addition to your team.

In my current role at Digital Solutions Corp., I have led the development of microservices architecture serving over 2 million daily active users, improving system reliability by 40%. I have also architected and implemented CI/CD pipelines that reduced deployment time from 2 hours to just 15 minutes. My experience with Python, React, AWS, and Docker aligns perfectly with the technical requirements outlined in your job description.

I am particularly excited about the opportunity to work on cutting-edge technologies and contribute to innovative projects at Tech Innovations Inc. I am confident that my technical expertise, leadership skills, and passion for problem-solving would make me a strong fit for your team. I look forward to the opportunity to discuss how I can contribute to your organization's success.

Thank you for considering my application."""
    
    output_path = "sample_cover_letter.pdf"
    candidate_name = "John Doe"
    
    print("Generating sample cover letter PDF...")
    generate_cover_letter_pdf(sample_text, candidate_name, output_path)
    print(f"✓ Sample cover letter PDF generated: {output_path}")


if __name__ == "__main__":
    try:
        test_resume_pdf()
        test_cover_letter_pdf()
        print("\n✓ All PDF generation tests passed!")
        print("Check the generated PDFs to verify formatting.")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
