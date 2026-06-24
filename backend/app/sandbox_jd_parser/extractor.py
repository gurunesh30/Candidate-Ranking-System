# pyrefly: ignore [missing-import]
import docx

import re
import os
import json
import requests
from typing import Dict, Any, List

class JDExtractor:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.doc = docx.Document(file_path)

    def parse(self) -> Dict[str, Any]:
        """
        Parses the docx file by extracting all text (paragraphs and tables)
        and using a local Ollama LLM instance to structure it.
        """
        # 1. Extract all text from docx
        text_lines = []
        for p in self.doc.paragraphs:
            if p.text.strip():
                text_lines.append(p.text.strip())
        
        for table in self.doc.tables:
            for row in table.rows:
                # Deduplicate cell text to avoid repeating text in merged cells
                seen_cells = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text and cell_text not in seen_cells:
                        seen_cells.append(cell_text)
                if seen_cells:
                    text_lines.append(" | ".join(seen_cells))
                    
        raw_text = "\n".join(text_lines)

        # 2. Formulate the LLM prompt to structure the JD
        prompt = f"""
        You are an expert HR assistant and data extractor. Your task is to analyze the following Job Description (JD) text and extract the required structured information.
        
        Job Description Text:
        ---
        {raw_text}
        ---
        
        You must output exactly a single, valid JSON object matching the schema below. Do not include any explanation, conversational text, or markdown formatting (e.g. do NOT use ```json).
        
        Target Schema:
        {{
            "job_title": "The official title of the job position (e.g., 'Lead Systems Engineer')",
            "department": "The department or team (e.g., 'DevOps Infrastructure')",
            "experience_required": "The experience requirements (e.g., '8+ years')",
            "core_technical_skills": ["List", "of", "required", "technical", "skills", "and", "tools"],
            "behavioral_competencies": ["List", "of", "required", "soft", "skills", "and", "behavioral", "traits"],
            "detailed_responsibilities": "A detailed explanation of the day-to-day responsibilities and tasks"
        }}
        """

        url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

        payload = {
            "model": model,
            "prompt": prompt,
            "format": "json",
            "stream": False
        }

        # Baseline fallback using the original regex/table heuristics
        fallback = self._fallback_parse_heuristic()

        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                result_text = response.json().get("response", "").strip()
                parsed = json.loads(result_text)
                
                # Verify that all required fields are present; if not, fill from fallback
                for field in ["job_title", "department", "experience_required", "core_technical_skills", "behavioral_competencies", "detailed_responsibilities"]:
                    if field not in parsed or parsed[field] in ["Unknown", None, [], ""]:
                        parsed[field] = fallback[field]
                return parsed
            return fallback
        except Exception as e:
            print(f"Ollama JD parsing fallback applied due to error: {e}")
            return fallback

    def _fallback_parse_heuristic(self) -> Dict[str, Any]:
        """
        Original zero-dependency regex and table extraction heuristic to serve as a robust fallback.
        """
        extracted = {
            "job_title": "Unknown",
            "department": "Unknown",
            "experience_required": "Unknown",
            "core_technical_skills": [],
            "behavioral_competencies": [],
            "detailed_responsibilities": "Unknown"
        }

        # 1. Parse tables for key-value structural data
        for table in self.doc.tables:
            for row in table.rows:
                if len(row.cells) >= 2:
                    key = row.cells[0].text.strip().lower()
                    val = row.cells[1].text.strip()
                    if not val:
                        continue
                    if "job title" in key or "title" == key:
                        extracted["job_title"] = val
                    elif "department" in key:
                        extracted["department"] = val
                    elif "experience" in key:
                        extracted["experience_required"] = val
                    elif "technical skills" in key or "core skills" in key or "technical requirements" in key:
                        items = [s.strip() for s in re.split(r'[,;\n•*-]', val) if s.strip()]
                        extracted["core_technical_skills"] = items
                    elif "behavioral" in key or "competencies" in key or "soft skills" in key:
                        items = [s.strip() for s in re.split(r'[,;\n•*-]', val) if s.strip()]
                        extracted["behavioral_competencies"] = items
                    elif "responsibilities" in key or "detailed responsibilities" in key:
                        extracted["detailed_responsibilities"] = val

        # 2. Parse paragraphs for keyword/regex patterns
        paragraphs = [p.text.strip() for p in self.doc.paragraphs if p.text.strip()]
        
        current_section = None
        resp_paragraphs = []
        skills_paragraphs = []
        pref_skills_paragraphs = []
        vibe_paragraphs = []
        not_want_paragraphs = []

        for p in paragraphs:
            p_lower = p.lower()
            
            # Job Title Match
            m_title = re.match(r'(?i)^(job\s+title|job\s+description|title)\s*:\s*(.*)', p)
            if m_title:
                if extracted["job_title"] == "Unknown":
                    extracted["job_title"] = m_title.group(2).strip()
                continue
                
            # Department Match
            m_dept = re.match(r'(?i)^(department|dept)\s*:\s*(.*)', p)
            if m_dept:
                if extracted["department"] == "Unknown":
                    extracted["department"] = m_dept.group(2).strip()
                continue
                
            # Experience Match
            m_exp = re.match(r'(?i)^(experience\s+required|experience\s+level|experience)\s*:\s*(.*)', p)
            if m_exp:
                if extracted["experience_required"] == "Unknown":
                    extracted["experience_required"] = m_exp.group(2).strip()
                continue
                
            # Check transitions
            if "what you'd actually be doing" in p_lower or "detailed responsibilities" in p_lower or "key responsibilities" in p_lower:
                current_section = "responsibilities"
                continue
            elif "what we mean by" in p_lower:
                current_section = "experience_explanation"
                continue
            elif "things you absolutely need" in p_lower or "core technical skills" in p_lower or "technical skills" in p_lower or "skills inventory" in p_lower:
                current_section = "skills_needed"
                continue
            elif "things we'd like you to have" in p_lower:
                current_section = "skills_preferred"
                continue
            elif "things we explicitly do not want" in p_lower:
                current_section = "not_want"
                continue
            elif "the vibe check" in p_lower or "behavioral competencies" in p_lower or "behavioral skills" in p_lower or "soft skills" in p_lower:
                current_section = "vibe_check"
                continue
            elif p_lower.startswith("on location") or "how to read between the lines" in p_lower or "final note" in p_lower:
                current_section = "other"
                continue
                
            # Process lines within sections
            if current_section == "responsibilities":
                resp_paragraphs.append(p)
            elif current_section == "skills_needed":
                skills_paragraphs.append(p)
            elif current_section == "skills_preferred":
                pref_skills_paragraphs.append(p)
            elif current_section == "vibe_check":
                vibe_paragraphs.append(p)
            elif current_section == "not_want":
                not_want_paragraphs.append(p)

        # Resolve Job Title fallback if still unknown
        if extracted["job_title"] == "Unknown" and paragraphs:
            first_line = paragraphs[0]
            if ":" in first_line:
                parts = first_line.split(":", 1)
                extracted["job_title"] = parts[1].strip()
            else:
                extracted["job_title"] = first_line

        # Resolve Department fallback
        if extracted["department"] == "Unknown":
            full_text = "\n".join(paragraphs)
            m_org = re.search(r'(?i)building\s+a\s+new\s+([\w\s]+?)\s+org', full_text)
            if m_org:
                extracted["department"] = m_org.group(1).strip()
            elif "ai engineer" in extracted["job_title"].lower():
                extracted["department"] = "AI Engineering"
            elif "systems engineer" in extracted["job_title"].lower() or "devops" in extracted["job_title"].lower():
                extracted["department"] = "DevOps Infrastructure"
                
        # Resolve Detailed Responsibilities
        if resp_paragraphs:
            extracted["detailed_responsibilities"] = "\n".join(resp_paragraphs)
        elif extracted["detailed_responsibilities"] == "Unknown":
            extracted["detailed_responsibilities"] = "Unknown"

        # Resolve Core Technical Skills
        skills_list = []
        for s_p in (skills_paragraphs + pref_skills_paragraphs):
            cleaned = re.sub(r'^[-*•\d\.\s]+', '', s_p).strip()
            if cleaned:
                skills_list.append(cleaned)
        if skills_list:
            extracted["core_technical_skills"] = skills_list

        # Resolve Behavioral Competencies
        vibe_list = []
        for v_p in (vibe_paragraphs + not_want_paragraphs):
            cleaned = re.sub(r'^[-*•\d\.\s]+', '', v_p).strip()
            if cleaned:
                vibe_list.append(cleaned)
        if vibe_list:
            extracted["behavioral_competencies"] = vibe_list

        return extracted
