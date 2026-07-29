import os
import fitz  # PyMuPDF


def read_pdf(pdf_path: str):
    if not os.path.exists(pdf_path):
        print(f"[PDF READER] File not found: '{pdf_path}'")
        return {"is_scanned": True, "total_pages": 1, "items": []}
    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        extracted_items = []
        total_text_length = 0

        for page_index in range(total_pages):
            page = doc[page_index]
            page_num = page_index + 1

            text_page = page.get_text("dict")
            blocks = text_page.get("blocks", [])

            for block in blocks:
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
                                "size": round(span.get("size", 0), 2),
                                "confidence": 100
                            })

        doc.close()
        is_scanned = (total_text_length == 0) or (len(extracted_items) == 0)

        print(f"[PDF READER] Read '{pdf_path}' ({total_pages} page(s), Scanned: {is_scanned})")

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
    except Exception as e:
        print(f"[PDF READER] Error reading '{pdf_path}': {e}")
        return {"is_scanned": True, "total_pages": 1, "items": []}


def extract_pdf_elements(pdf_path: str):
    return read_pdf(pdf_path)
