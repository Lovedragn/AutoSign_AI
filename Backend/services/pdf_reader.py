import os
import fitz  # PyMuPDF


def read_pdf(pdf_path: str):
    """
    Reads a PDF using PyMuPDF and detects whether it is Digital or Scanned.
    
    If Digital:
      Extracts page number, text, bounding boxes [x1, y1, x2, y2], coordinates, and fonts.
      
    If Scanned (no selectable text):
      Returns is_scanned = True.
    """
    print(f"[PDF READER] Reading PDF document: '{pdf_path}'")
    if not os.path.exists(pdf_path):
        print(f"[PDF READER ERROR] File not found: '{pdf_path}'")
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    extracted_items = []
    total_text_length = 0

    for page_index in range(total_pages):
        page = doc[page_index]
        page_num = page_index + 1  # 1-indexed page number

        # Extract text page layout structure (blocks -> lines -> spans)
        text_page = page.get_text("dict")
        blocks = text_page.get("blocks", [])

        for block in blocks:
            # Block type 0 represents text blocks (type 1 represents images)
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if not text:
                            continue

                        total_text_length += len(text)
                        bbox = span.get("bbox", (0, 0, 0, 0))

                        extracted_items.append({
                            "page": page_num,
                            "text": text,
                            "bbox": [
                                round(bbox[0], 2),
                                round(bbox[1], 2),
                                round(bbox[2], 2),
                                round(bbox[3], 2)
                            ],
                            "font": span.get("font", "Unknown"),
                            "size": round(span.get("size", 0), 2)
                        })

    doc.close()

    is_scanned = (total_text_length == 0) or (len(extracted_items) == 0)

    print(f"[PDF READER SUCCESS] Analysis finished | Is Scanned: {is_scanned} | Total Pages: {total_pages} | Extracted Text Items: {len(extracted_items)}")

    if is_scanned:
        return {
            "is_scanned": True,
            "total_pages": total_pages,
            "items": []
        }
    else:
        return {
            "is_scanned": False,
            "total_pages": total_pages,
            "items": extracted_items
        }


def extract_pdf_elements(pdf_path: str):
    result = read_pdf(pdf_path)
    if result["is_scanned"]:
        return {"is_scanned": True, "items": []}
    return result["items"]
