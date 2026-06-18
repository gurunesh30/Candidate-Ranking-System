import os
import json
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

def extract_text_from_docx(docx_path: str) -> str:
    """
    Extracts text paragraph-by-paragraph from a .docx file without external dependencies.
    """
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"Job description file not found at: {docx_path}")
        
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for p in root.findall('.//w:p', ns):
                p_text = []
                for t in p.findall('.//w:t', ns):
                    if t.text:
                        p_text.append(t.text)
                if p_text:
                    paragraphs.append("".join(p_text))
            return "\n".join(paragraphs)
    except Exception as e:
        raise RuntimeError(f"Error parsing .docx file: {e}")

def load_sample_candidates(json_path: str, count: int = 2) -> List[Dict[str, Any]]:
    """
    Loads candidates from sample_candidates.json and returns the specified count.
    """
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Sample candidates file not found at: {json_path}")
        
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("Candidates JSON data must be a list of candidate objects.")
        return data[:count]
    except Exception as e:
        raise RuntimeError(f"Error loading candidates JSON: {e}")
