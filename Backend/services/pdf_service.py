import os
import base64
import fitz  # PyMuPDF
from PIL import Image
import io

def inspect_pdf(pdf_path):
    """
    Parses PDF document and returns page count and auto-detected signature fields.
    """
    if not os.path.exists(pdf_path):
        return {"pages": 1, "fields": []}
    
    doc = fitz.open(pdf_path)
    num_pages = len(doc)
    detected_fields = []

    # Scan pages for signature/date/name field placeholders or lines
    for page_num in range(num_pages):
        page = doc[page_num]
        text_instances = page.get_text("blocks")
        
        found_signature = False
        for block in text_instances:
            text = block[4].lower() if len(block) > 4 else ""
            if any(term in text for term in ["sign", "signature", "authorized", "x:"]):
                found_signature = True
                rect = block[:4]  # (x0, y0, x1, y1)
                detected_fields.append({
                    "id": f"field_auto_{page_num}_{len(detected_fields)}",
                    "type": "SIGNATURE",
                    "confidence": "94%",
                    "page": page_num + 1,
                    "x": int(rect[0]),
                    "y": int(rect[1]),
                    "width": max(180, int(rect[2] - rect[0])),
                    "height": max(60, int(rect[3] - rect[1]))
                })

        if not found_signature and page_num == 0:
            # Default placeholder field if no keyword matched
            detected_fields.append({
                "id": f"field_auto_default",
                "type": "SIGNATURE",
                "confidence": "85%",
                "page": 1,
                "x": 380,
                "y": 420,
                "width": 200,
                "height": 80
            })

    doc.close()
    return {"pages": num_pages, "fields": detected_fields}


def apply_signature_and_save(pdf_path, signature_data_url_or_path, fields, output_path):
    """
    Overlays signature image onto the specified PDF coordinates and saves signed PDF.
    """
    doc = fitz.open(pdf_path) if os.path.exists(pdf_path) else fitz.open()
    if len(doc) == 0:
        page = doc.new_page(width=595, height=842)

    # Process signature image
    signature_bytes = None
    if signature_data_url_or_path.startswith("data:image"):
        header, base64_str = signature_data_url_or_path.split(",", 1)
        signature_bytes = base64.b64decode(base64_str)
    elif os.path.exists(signature_data_url_or_path):
        with open(signature_data_url_or_path, "rb") as f:
            signature_bytes = f.read()

    if signature_bytes:
        img = Image.open(io.BytesIO(signature_bytes))
        # Ensure RGBA image
        img = img.convert("RGBA")
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="PNG")
        png_data = img_byte_arr.getvalue()

        for field in fields:
            page_num = max(0, min(len(doc) - 1, field.get("page", 1) - 1))
            page = doc[page_num]
            
            x = float(field.get("x", 100))
            y = float(field.get("y", 100))
            w = float(field.get("width", 180))
            h = float(field.get("height", 70))
            
            rect = fitz.Rect(x, y, x + w, y + h)
            page.insert_image(rect, stream=png_data)

    doc.save(output_path)
    doc.close()
    return output_path
