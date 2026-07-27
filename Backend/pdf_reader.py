from services.pdf_reader import read_pdf, extract_pdf_elements, detect_and_extract_pdf if "detect_and_extract_pdf" in locals() else read_pdf

__all__ = ["read_pdf", "extract_pdf_elements"]
