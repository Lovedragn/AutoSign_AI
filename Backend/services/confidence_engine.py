import math

DEFAULT_CONFIDENCE_CONFIG = {
    "keywords": {
        "authorized signature": 50,
        "signature": 50,
        "sign here": 45,
        "sign": 40,
        "signed by": 45,
        "x:": 40,
        "date": 10,
        "name": 10,
        "title": 10
    },
    "nearby_horizontal_line": 30,
    "nearby_rectangle": 20,
    "nearby_date": 10,
    "blank_area": 10,
    "ocr_confidence_factor": 0.2,
    "proximity_threshold": 40.0,
    "max_score": 100.0,
    "min_score": 0.0
}


def _calculate_distance(bbox1, bbox2):
    x1_1, y1_1, x2_1, y2_1 = bbox1
    x1_2, y1_2, x2_2, y2_2 = bbox2

    if not (x2_1 < x1_2 or x2_2 < x1_1 or y2_1 < y1_2 or y2_2 < y1_1):
        return 0.0

    dx = max(0.0, x1_1 - x2_2, x1_2 - x2_1)
    dy = max(0.0, y1_1 - y2_2, y1_2 - y2_1)
    return math.sqrt(dx * dx + dy * dy)


def evaluate_confidence(ocr_candidates: list, layout_objects: list = None, config: dict = None):
    print(f"[CONFIDENCE ENGINE] Evaluating confidence for {len(ocr_candidates)} text candidates and {len(layout_objects or [])} layout objects...")
    score_config = {**DEFAULT_CONFIDENCE_CONFIG, **(config or {})}
    keywords_config = score_config.get("keywords", {})
    nearby_line_score = score_config.get("nearby_horizontal_line", 30)
    nearby_rect_score = score_config.get("nearby_rectangle", 20)
    nearby_date_score = score_config.get("nearby_date", 10)
    blank_area_score = score_config.get("blank_area", 10)
    ocr_factor = score_config.get("ocr_confidence_factor", 0.2)
    proximity_threshold = float(score_config.get("proximity_threshold", 40.0))
    max_score = float(score_config.get("max_score", 100.0))
    min_score = float(score_config.get("min_score", 0.0))

    layout_objs = layout_objects or []
    evaluated_candidates = []

    for candidate in ocr_candidates:
        text = str(candidate.get("text", "")).strip()
        text_lower = text.lower()
        bbox = candidate.get("bbox", [0, 0, 0, 0])
        page = candidate.get("page", 1)
        ocr_conf = float(candidate.get("confidence", 80))

        score = 0.0
        features = []

        # 1. Keyword Score Matching
        matched_keyword = False
        for kw, kw_score in sorted(keywords_config.items(), key=lambda x: len(x[0]), reverse=True):
            if kw in text_lower:
                score += kw_score
                features.append(f"Keyword '{kw}' (+{kw_score})")
                matched_keyword = True
                break

        # 2. Variable OCR Confidence Contribution
        ocr_contribution = ocr_conf * ocr_factor
        if ocr_contribution > 0:
            score += ocr_contribution
            features.append(f"OCR Confidence ({ocr_conf}% * {ocr_factor} = +{round(ocr_contribution, 1)})")

        # 3. Nearby Horizontal Line
        has_nearby_line = False
        for obj in layout_objs:
            if obj.get("page", 1) == page and obj.get("type") in ["line", "horizontal_line"]:
                obj_bbox = obj.get("bbox", [0, 0, 0, 0])
                if _calculate_distance(bbox, obj_bbox) <= proximity_threshold:
                    has_nearby_line = True
                    break
        if has_nearby_line:
            score += nearby_line_score
            features.append(f"Nearby Horizontal Line (+{nearby_line_score})")

        # 4. Nearby Rectangle
        has_nearby_rect = False
        for obj in layout_objs:
            if obj.get("page", 1) == page and obj.get("type") in ["rect", "rectangle", "box"]:
                obj_bbox = obj.get("bbox", [0, 0, 0, 0])
                if _calculate_distance(bbox, obj_bbox) <= proximity_threshold:
                    has_nearby_rect = True
                    break
        if has_nearby_rect:
            score += nearby_rect_score
            features.append(f"Nearby Rectangle (+{nearby_rect_score})")

        # 5. Nearby Date Label
        has_nearby_date = False
        for other in ocr_candidates:
            if other != candidate and other.get("page", 1) == page:
                other_text = str(other.get("text", "")).lower()
                if "date" in other_text or "mm/dd" in other_text:
                    if _calculate_distance(bbox, other.get("bbox", [0, 0, 0, 0])) <= (proximity_threshold * 3):
                        has_nearby_date = True
                        break
        if has_nearby_date:
            score += nearby_date_score
            features.append(f"Nearby Date (+{nearby_date_score})")

        # 6. Blank Area Above/Beside Keyword
        if matched_keyword:
            x1, y1, x2, y2 = bbox
            above_box = [x1, max(0, y1 - 60), x2, y1]
            has_conflict = False
            for other in ocr_candidates:
                if other != candidate and other.get("page", 1) == page:
                    if _calculate_distance(above_box, other.get("bbox", [0, 0, 0, 0])) == 0:
                        has_conflict = True
                        break
            if not has_conflict:
                score += blank_area_score
                features.append(f"Blank Area (+{blank_area_score})")

        final_score = max(min_score, min(max_score, round(score, 1)))

        evaluated_candidates.append({
            "candidate": candidate,
            "page": page,
            "text": text,
            "bbox": bbox,
            "confidence_score": final_score,
            "confidence_formatted": f"{final_score}%",
            "matched_features": features
        })

    evaluated_candidates.sort(key=lambda x: x["confidence_score"], reverse=True)
    if evaluated_candidates:
        top_cand = evaluated_candidates[0]
        print(f"[CONFIDENCE ENGINE SUCCESS] Top Candidate: '{top_cand['text']}' | Score: {top_cand['confidence_score']}% | Features: {top_cand['matched_features']}")
    else:
        print(f"[CONFIDENCE ENGINE WARNING] No candidates evaluated.")

    return evaluated_candidates
