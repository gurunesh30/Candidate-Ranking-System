from .extractor import JDExtractor
from .schemas import JobDescriptionSchema

def run_pipeline(docx_path: str) -> str:
    """
    Orchestrates the entire ingestion cycle:
    Docx Input Stream -> Extractor Core -> Pydantic Mapping -> JSON Output String.
    """
    # 1. Initialize and execute extraction logic
    extractor = JDExtractor(docx_path)
    parsed_data = extractor.parse()
    
    # 2. Map and validate using Pydantic schema
    validated_schema = JobDescriptionSchema(**parsed_data)
    
    # 3. Serialize to standard JSON string output
    return validated_schema.model_dump_json(indent=2)
