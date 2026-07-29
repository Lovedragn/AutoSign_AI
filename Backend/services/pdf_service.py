import os
import base64
import fitz  # PyMuPDF
from PIL import Image
import io

from services.pdf_reader import extract_pdf_elements
from services.confidence_engine import evaluate_confidence
from services.placement_engine import calculate_signature_placement


def inspect_pdf(pdf_path):
    """
    Parses PDF document and returns page count and auto-detected signature fields.
    """
    if not os.path.exists(pdf_path):
        print(f"[PDF SERVICE] File not found: '{pdf_path}'")
        return {"pages": 1, "fields": []}

    pdf_res = extract_pdf_elements(pdf_path)
    items = pdf_res.get("items", [])
    num_pages = pdf_res.get("total_pages", 1)

    lines = []
    rectangles = []
    page_width = 595.0
    page_height = 842.0

    try:
        doc = fitz.open(pdf_path)
        if len(doc) > 0:
            page_width = float(doc[0].rect.width)
            page_height = float(doc[0].rect.height)
            for p_idx, page_obj in enumerate(doc):
                p_num = p_idx + 1
                drawings = page_obj.get_drawings()
                for draw in drawings:
                    for item in draw.get("items", []):
                        if item[0] == "l":  # line
                            p1, p2 = item[1], item[2]
                            lines.append({
                                "page": p_num,
                                "type": "horizontal_line",
                                "bbox": [p1.x, p1.y, p2.x, p2.y]
                            })
                        elif item[0] == "re":  # rectangle
                            r = item[1]
                            r_w = abs(r.x1 - r.x0)
                            r_h = abs(r.y1 - r.y0)
                            # Ignore full-page paper background rectangles
                            if r_w < (page_width * 0.85) and r_h < (page_height * 0.85):
                                rectangles.append({
                                    "page": p_num,
                                    "type": "rectangle",
                                    "bbox": [r.x0, r.y0, r.x1, r.y1]
                                })
        doc.close()
    except Exception:
        pass

    layout_info = {
        "page_width": page_width,
        "page_height": page_height,
        "lines": lines,
        "rectangles": rectangles
    }

    candidates = evaluate_confidence(items, layout_objects=lines + rectangles)

    detected_fields = []
    seen_pages = set()

    # Scan and map signature coordinates for all pages with confidence >= 80%
    for cand in candidates:
        score = int(cand.get("confidence_score", 0))
        cand_data = cand.get("candidate", cand)
        cand_page = cand_data.get("page", 1)

        if score >= 80 and cand_page not in seen_pages:
            seen_pages.add(cand_page)
            placement = calculate_signature_placement(cand_data, layout_info)
            detected_fields.append({
                "id": f"field_auto_{len(detected_fields) + 1}",
                "type": "SIGNATURE",
                "confidence": f"{score}%",
                "page": cand_page,
                "x": placement["x"],
                "y": placement["y"],
                "width": placement["width"],
                "height": placement["height"],
                "matched_features": cand.get("matched_features", [])
            })

    # Fallback to top candidate if no fields >= 80% were mapped
    if not detected_fields and candidates:
        top_cand = candidates[0]
        score = int(top_cand.get("confidence_score", 85))
        placement = calculate_signature_placement(top_cand.get("candidate", top_cand), layout_info)
        detected_fields.append({
            "id": "field_auto_1",
            "type": "SIGNATURE",
            "confidence": f"{score}%",
            "page": placement.get("page", 1),
            "x": placement["x"],
            "y": placement["y"],
            "width": placement["width"],
            "height": placement["height"],
            "matched_features": top_cand.get("matched_features", [])
        })

    if not detected_fields:
        detected_fields.append({
            "id": "field_auto_1",
            "type": "SIGNATURE",
            "confidence": "75%",
            "page": 1,
            "x": round(page_width * 0.45, 1),
            "y": round(page_height * 0.6, 1),
            "width": 180.0,
            "height": 60.0
        })

    print(f"[PDF SERVICE] Inspected '{pdf_path}' ({num_pages} page(s), {len(detected_fields)} field(s) mapped)")
    return {
        "pages": num_pages,
        "fields": detected_fields,
        "page_width": page_width,
        "page_height": page_height
    }


def apply_signature_and_save(pdf_path, signature_data_url_or_path, fields, output_path):
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
    print(f"[PDF SERVICE] Stamped signature: '{pdf_path}' -> '{output_path}'")
    return output_path
