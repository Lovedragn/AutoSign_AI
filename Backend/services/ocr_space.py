import os
import time
import fitz  # PyMuPDF for PDF page-to-image rendering
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import config

OCR_SPACE_URL = "https://api.ocr.space/parse/image"


def _create_session(retries=3, backoff_factor=1):
    sess = requests.Session()
    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["POST"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    sess.mount("https://", adapter)
    sess.mount("http://", adapter)
    return sess


session = _create_session()


def convert_pdf_page_to_image_bytes(pdf_path_or_doc, page_num: int, dpi: int = 200) -> bytes:
    close_doc = False
    if isinstance(pdf_path_or_doc, str):
        if not os.path.exists(pdf_path_or_doc):
            raise FileNotFoundError(f"PDF file not found: {pdf_path_or_doc}")
        doc = fitz.open(pdf_path_or_doc)
        close_doc = True
    else:
        doc = pdf_path_or_doc

    page = doc[page_num]
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes("png")

    if close_doc:
        doc.close()

    return img_bytes


def process_ocr_image(img_bytes: bytes, page_num: int = 1, api_key: str = None, timeout: int = 30, max_retries: int = 3):
    key = api_key or os.getenv("OCR_SPACE_API_KEY") or getattr(config, "OCR_SPACE_API_KEY", "123445686780qwertyuuipi") or "123445686780qwertyuuipi"

    payload = {
        "apikey": key,
        "isOverlayRequired": "True",
        "scale": "True",
        "OCREngine": "2",
        "detectOrientation": "True"
    }

    files = {
        "file": ("page.png", img_bytes, "image/png")
    }

    extracted_items = []
    response_json = None

    for attempt in range(1, max_retries + 1):
        try:
            response = session.post(OCR_SPACE_URL, data=payload, files=files, timeout=timeout)
            response.raise_for_status()
            response_json = response.json()
            break
        except (requests.RequestException, ValueError):
            if attempt == max_retries:
                return []
            time.sleep(1 * attempt)

    if not response_json or response_json.get("IsErroredOnHTTP") or response_json.get("OCRExitCode") != 1:
        return []

    parsed_results = response_json.get("ParsedResults", [])
    for result in parsed_results:
        text_overlay = result.get("TextOverlay", {})
        lines = text_overlay.get("Lines", [])

        for line in lines:
            line_text = line.get("LineText", "").strip()
            words = line.get("Words", [])

            if words:
                min_left = min((w.get("Left", 0) for w in words), default=0)
                min_top = min((w.get("Top", 0) for w in words), default=0)
                max_right = max((w.get("Left", 0) + w.get("Width", 0) for w in words), default=0)
                max_bottom = max((w.get("Top", 0) + w.get("Height", 0) for w in words), default=0)

                extracted_items.append({
                    "page": page_num,
                    "text": line_text or " ".join([w.get("WordText", "") for w in words]),
                    "bbox": [
                        round(float(min_left), 2),
                        round(float(min_top), 2),
                        round(float(max_right), 2),
                        round(float(max_bottom), 2)
                    ],
                    "confidence": 96
                })

    return extracted_items


def process_scanned_pdf(pdf_path: str, api_key: str = None, timeout: int = 30):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    all_extracted_items = []

    for page_idx in range(total_pages):
        page_num = page_idx + 1
        img_bytes = convert_pdf_page_to_image_bytes(doc, page_idx)
        items = process_ocr_image(img_bytes, page_num=page_num, api_key=api_key, timeout=timeout)
        all_extracted_items.extend(items)

    doc.close()

    print(f"[OCR] Processed scanned PDF '{pdf_path}' ({total_pages} page(s), {len(all_extracted_items)} items)")
    return {
        "is_scanned": True,
        "total_pages": total_pages,
        "total_items": len(all_extracted_items),
        "items": all_extracted_items
    }
