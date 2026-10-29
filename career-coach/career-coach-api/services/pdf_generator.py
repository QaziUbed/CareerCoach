from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from datetime import datetime
from typing import List, Dict, Any


def generate_resume_pdf(optimized_json: dict, output_path: str, candidate_name: str) -> None:
    """
    Generates a professional formatted resume PDF from optimized JSON data.
    
    Args:
        optimized_json: Dictionary containing resume sections (summary, experience, skills)
        output_path: Path where the PDF will be saved
        candidate_name: Name of the candidate for the header
    """
    # Create PDF document with 1 inch margins
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=1 * inch,
        leftMargin=1 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch
    )
    
    # Container for flowable objects
    elements = []
    
    # Define custom styles
    styles = getSampleStyleSheet()
    
    # Header style - Candidate name
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Contact info style
    contact_style = ParagraphStyle(
        'ContactStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    # Section header style
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=8,
        spaceBefore=16,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0
    )
    
    # Body text style
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1E293B'),
        leading=16,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    # Company/Title style
    company_style = ParagraphStyle(
        'CompanyStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=2,
        fontName='Helvetica-Bold'
    )
    
    # Job title style
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#475569'),
        spaceAfter=6,
        fontName='Helvetica-Oblique'
    )
    
    # Bullet point style
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1E293B'),
        leading=15,
        spaceAfter=4,
        leftIndent=20,
        fontName='Helvetica'
    )
    
    # Dates style (right-aligned)
    dates_style = ParagraphStyle(
        'DatesStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_RIGHT,
        fontName='Helvetica'
    )
    
    # === HEADER SECTION ===
    # Add candidate name
    name_para = Paragraph(candidate_name, header_style)
    elements.append(name_para)
    
    # Add contact placeholder
    contact_info = "Email: contact@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/profile"
    contact_para = Paragraph(contact_info, contact_style)
    elements.append(contact_para)
    
    # Add horizontal rule
    elements.append(HRFlowable(
        width="100%",
        thickness=1,
        color=colors.HexColor('#CBD5E1'),
        spaceAfter=12
    ))
    
    # === PROFESSIONAL SUMMARY SECTION ===
    if optimized_json.get('summary'):
        summary_header = Paragraph("PROFESSIONAL SUMMARY", section_header_style)
        elements.append(summary_header)
        
        summary_text = optimized_json['summary']
        summary_para = Paragraph(summary_text, body_style)
        elements.append(summary_para)
        elements.append(Spacer(1, 0.1 * inch))
    
    # === PROFESSIONAL EXPERIENCE SECTION ===
    if optimized_json.get('experience') and len(optimized_json['experience']) > 0:
        exp_header = Paragraph("PROFESSIONAL EXPERIENCE", section_header_style)
        elements.append(exp_header)
        
        for exp in optimized_json['experience']:
            company = exp.get('company', '')
            title = exp.get('title', '')
            dates = exp.get('dates', '')
            bullets = exp.get('bullets', [])
            
            # Create table for company name and dates on same line
            if company and dates:
                company_para = Paragraph(company, company_style)
                dates_para = Paragraph(dates, dates_style)
                
                # Table with two columns: company (left) and dates (right)
                company_table = Table(
                    [[company_para, dates_para]],
                    colWidths=[4.5 * inch, 2 * inch]
                )
                company_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('TOPPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ]))
                elements.append(company_table)
            elif company:
                company_para = Paragraph(company, company_style)
                elements.append(company_para)
            
            # Add job title
            if title:
                title_para = Paragraph(title, title_style)
                elements.append(title_para)
            
            # Add bullet points
            if bullets:
                for bullet in bullets:
                    # Ensure bullet starts with bullet point
                    bullet_text = bullet.strip()
                    if not bullet_text.startswith('•') and not bullet_text.startswith('-'):
                        bullet_text = f"• {bullet_text}"
                    elif bullet_text.startswith('-'):
                        bullet_text = f"• {bullet_text[1:].strip()}"
                    
                    bullet_para = Paragraph(bullet_text, bullet_style)
                    elements.append(bullet_para)
            
            # Add spacing between jobs
            elements.append(Spacer(1, 0.15 * inch))
    
    # === SKILLS SECTION ===
    if optimized_json.get('skills') and len(optimized_json['skills']) > 0:
        skills_header = Paragraph("SKILLS", section_header_style)
        elements.append(skills_header)
        
        skills = optimized_json['skills']
        
        # Arrange skills in 3 columns
        skills_per_column = (len(skills) + 2) // 3  # Round up division
        
        # Create skill columns
        col1 = skills[:skills_per_column]
        col2 = skills[skills_per_column:skills_per_column * 2]
        col3 = skills[skills_per_column * 2:]
        
        # Pad columns to equal length
        max_len = max(len(col1), len(col2), len(col3))
        col1 += [''] * (max_len - len(col1))
        col2 += [''] * (max_len - len(col2))
        col3 += [''] * (max_len - len(col3))
        
        # Create table data
        skills_data = []
        for i in range(max_len):
            row = [
                Paragraph(f"• {col1[i]}" if col1[i] else "", bullet_style),
                Paragraph(f"• {col2[i]}" if col2[i] else "", bullet_style),
                Paragraph(f"• {col3[i]}" if col3[i] else "", bullet_style)
            ]
            skills_data.append(row)
        
        # Create skills table
        skills_table = Table(
            skills_data,
            colWidths=[2.16 * inch, 2.16 * inch, 2.16 * inch]
        )
        skills_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(skills_table)
    
    # Build the PDF
    doc.build(elements)


def generate_cover_letter_pdf(text: str, candidate_name: str, output_path: str) -> None:
    """
    Generates a professional cover letter PDF using ReportLab.
    
    Args:
        text: The cover letter content
        candidate_name: Name of the candidate
        output_path: Path where the PDF will be saved
    """
    # Create PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=1 * inch,
        leftMargin=1 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Get default styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    name_style = ParagraphStyle(
        'CustomName',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    contact_style = ParagraphStyle(
        'ContactStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=24,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    date_style = ParagraphStyle(
        'CustomDate',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=24,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1E293B'),
        leading=16,
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    signature_style = ParagraphStyle(
        'CustomSignature',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    # Add candidate name
    name_para = Paragraph(candidate_name, name_style)
    elements.append(name_para)
    
    # Add contact info
    contact_info = "Email: contact@email.com | Phone: (555) 123-4567"
    contact_para = Paragraph(contact_info, contact_style)
    elements.append(contact_para)
    
    # Add current date
    current_date = datetime.now().strftime("%B %d, %Y")
    date_para = Paragraph(current_date, date_style)
    elements.append(date_para)
    
    # Split cover letter text into paragraphs
    paragraphs = text.split('\n\n')
    
    for para_text in paragraphs:
        if para_text.strip():
            # Clean up the text
            clean_text = para_text.strip().replace('\n', ' ')
            para = Paragraph(clean_text, body_style)
            elements.append(para)
    
    # Add signature section
    elements.append(Spacer(1, 0.3 * inch))
    
    signature_text = "Sincerely,"
    signature_para = Paragraph(signature_text, signature_style)
    elements.append(signature_para)
    
    elements.append(Spacer(1, 0.5 * inch))
    
    # Add signature line
    name_para_bottom = Paragraph(candidate_name, signature_style)
    elements.append(name_para_bottom)
    
    # Build PDF
    doc.build(elements)


# Test function to generate sample PDF
def test_generate_sample_resume():
    """Test function to generate a sample resume PDF with placeholder data."""
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
    
    generate_resume_pdf(sample_data, output_path, candidate_name)
    print(f"Sample resume PDF generated: {output_path}")


if __name__ == "__main__":
    # Run test when script is executed directly
    test_generate_sample_resume()
