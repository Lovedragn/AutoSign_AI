import os
import fitz  # PyMuPDF
from services.placement_engine import calculate_signature_placement


def generate_preview_coordinates(pdf_path: str, candidate: dict = None, layout_info: dict = None) -> dict:
    print(f"[PREVIEW GENERATOR] Generating virtual overlay coordinates for PDF: '{pdf_path}'")
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    first_page = doc[0] if total_pages > 0 else None
    page_width = float(first_page.rect.width) if first_page else 595.0
    page_height = float(first_page.rect.height) if first_page else 842.0
    doc.close()

    layout = {
        "page_width": page_width,
        "page_height": page_height,
        **(layout_info or {})
    }

    c = candidate or {
        "page": 1,
        "text": "Signature",
        "bbox": [100.0, page_height - 200.0, 300.0, page_height - 180.0]
    }

    placement = calculate_signature_placement(c, layout)

    virtual_field = {
        "id": "field_preview_1",
        "type": "SIGNATURE",
        "confidence": "94%",
        "page": placement.get("page", 1),
        "x": placement.get("x", 260.0),
        "y": placement.get("y", 520.0),
        "width": placement.get("width", 220.0),
        "height": placement.get("height", 80.0),
        "status": "VIRTUAL_OVERLAY",
        "rule_applied": placement.get("rule_applied", "KEYWORD_BELOW")
    }

    print(f"[PREVIEW GENERATOR SUCCESS] Virtual overlay coordinates generated | Rule: {placement.get('rule_applied')} | PDF remained 100% UNCHANGED")
    return {
        "pdf_path": pdf_path,
        "is_modified": False,
        "total_pages": total_pages,
        "page_dimensions": {"width": page_width, "height": page_height},
        "fields": [virtual_field]
    }


def update_preview_field(preview_data: dict, field_id: str, x: float = None, y: float = None, width: float = None, height: float = None) -> dict:
    print(f"[PREVIEW GENERATOR] Updating field overlay ID '{field_id}' -> Move/Resize (x={x}, y={y}, w={width}, h={height})")
    fields = preview_data.get("fields", [])
    updated_fields = []

    for f in fields:
        if f.get("id") == field_id:
            updated_f = {**f}
            if x is not None:
                updated_f["x"] = round(float(x), 1)
            if y is not None:
                updated_f["y"] = round(float(y), 1)
            if width is not None:
                updated_f["width"] = round(float(width), 1)
            if height is not None:
                updated_f["height"] = round(float(height), 1)
            updated_fields.append(updated_f)
        else:
            updated_fields.append(f)

    return {
        **preview_data,
        "is_modified": False,
        "fields": updated_fields
    }


def delete_preview_field(preview_data: dict, field_id: str) -> dict:
    print(f"[PREVIEW GENERATOR] Deleting virtual field ID '{field_id}'")
    fields = preview_data.get("fields", [])
    filtered_fields = [f for f in fields if f.get("id") != field_id]

    return {
        **preview_data,
        "is_modified": False,
        "fields": filtered_fields
    }


def confirm_preview_fields(preview_data: dict) -> dict:
    print(f"[PREVIEW GENERATOR] Confirming virtual fields for final signature stamping...")
    fields = preview_data.get("fields", [])
    return {
        "status": "CONFIRMED",
        "is_modified": False,
        "confirmed_fields": fields
    }
