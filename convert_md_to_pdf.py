
from fpdf import FPDF
import os

# Paths
MD_FILE = r'C:\Users\sagar\.gemini\antigravity\brain\5da649c6-9439-4c6d-a1dd-559631edb0b0\project_documentation.md'
OUTPUT_FILE = r'C:\Users\sagar\Downloads\newown - Copy\Enterprise_Finance_Portal_Documentation.pdf'

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'SequelString Enterprise Documentation', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

def create_pdf(md_file, output_file):
    if not os.path.exists(md_file):
        print(f"Error: File {md_file} not found.")
        return

    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font("Arial", size=11)

    with open(md_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                pdf.ln(5)
                continue
            
            # Simple Markdown Parsing
            if line.startswith('# '): # H1
                pdf.set_font("Arial", 'B', 16)
                pdf.cell(0, 10, line[2:], 0, 1)
                pdf.set_font("Arial", size=11)
            elif line.startswith('## '): # H2
                pdf.ln(5)
                pdf.set_font("Arial", 'B', 14)
                pdf.cell(0, 10, line[3:], 0, 1)
                pdf.set_font("Arial", size=11)
            elif line.startswith('### '): # H3
                pdf.ln(2)
                pdf.set_font("Arial", 'B', 12)
                pdf.cell(0, 10, line[4:], 0, 1)
                pdf.set_font("Arial", size=11)
            elif line.startswith('* ') or line.startswith('- '): # Bullet
                pdf.set_x(15)
                # Handle simple bolding with **
                clean_line = line[2:]
                pdf.multi_cell(0, 7, chr(149) + " " + clean_line)
            else:
                pdf.multi_cell(0, 7, line)

    pdf.output(output_file)
    print(f"PDF successfully created at: {output_file}")

if __name__ == "__main__":
    create_pdf(MD_FILE, OUTPUT_FILE)
