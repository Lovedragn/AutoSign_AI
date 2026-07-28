import math


def calculate_signature_placement(candidate: dict, layout_info: dict = None) -> dict:
    cand_text = candidate.get("text", "Unknown")
    layout = layout_info or {}
    page_width = float(layout.get("page_width", 595.0))
    page_height = float(layout.get("page_height", 842.0))
    page_num = candidate.get("page", 1)

    kw_bbox = candidate.get("bbox", [100.0, 100.0, 200.0, 120.0])
    kw_x1, kw_y1, kw_x2, kw_y2 = [float(v) for v in kw_bbox]
    kw_w = max(10.0, kw_x2 - kw_x1)
    kw_h = max(10.0, kw_y2 - kw_y1)

    lines = layout.get("lines", [])
    rectangles = layout.get("rectangles", [])
    arrows = layout.get("arrows", [])

    rule_applied = "KEYWORD_ONLY"
    sig_w = 0.0
    sig_h = 0.0
    sig_x = 0.0
    sig_y = 0.0

    target_rect = None
    for r in rectangles:
        r_box = r.get("bbox", [0, 0, 0, 0])
        rx1, ry1, rx2, ry2 = [float(v) for v in r_box]
        if (rx1 <= kw_x1 + 40 and rx2 >= kw_x2 - 40 and ry1 <= kw_y1 + 50 and ry2 >= kw_y2 - 10) or \
           abs(ry1 - kw_y1) <= 50.0:
            target_rect = (rx1, ry1, rx2, ry2)
            break

    target_line = None
    if not target_rect:
        for l in lines:
            l_box = l.get("bbox", [0, 0, 0, 0])
            lx1, ly1, lx2, ly2 = [float(v) for v in l_box]
            if abs(ly1 - ly2) <= 5.0 and (lx2 - lx1) >= 40.0:
                if abs(ly1 - kw_y2) <= 50.0 or abs(ly1 - kw_y1) <= 50.0:
                    target_line = (lx1, ly1, lx2, ly2)
                    break

    target_arrow = None
    if not target_rect and not target_line:
        for a in arrows:
            a_box = a.get("bbox", [0, 0, 0, 0])
            ax1, ay1, ax2, ay2 = [float(v) for v in a_box]
            if abs(ay1 - kw_y1) <= 60.0:
                target_arrow = (ax1, ay1, ax2, ay2, a.get("direction", "right"))
                break

    if target_rect:
        rx1, ry1, rx2, ry2 = target_rect
        r_w = rx2 - rx1
        r_h = ry2 - ry1

        sig_w = min(r_w * 0.85, page_width * 0.35)
        sig_h = min(r_h * 0.85, sig_w * 0.35)

        sig_x = rx1 + (r_w - sig_w) / 2.0
        sig_y = ry1 + (r_h - sig_h) / 2.0
        rule_applied = "RECTANGLE_CENTERED"

    elif target_line:
        lx1, ly1, lx2, ly2 = target_line
        l_w = lx2 - lx1

        sig_w = min(max(150.0, l_w * 0.85), page_width * 0.4)
        sig_h = round(sig_w * 0.3, 1)

        sig_x = lx1 + (l_w - sig_w) / 2.0
        sig_y = ly1 - sig_h + (sig_h * 0.15)
        rule_applied = "HORIZONTAL_LINE_CENTERED"

    elif target_arrow:
        ax1, ay1, ax2, ay2, direction = target_arrow
        sig_w = min(max(160.0, kw_w * 1.5), page_width * 0.35)
        sig_h = round(sig_w * 0.3, 1)

        if direction == "right":
            sig_x = ax2 + 10.0
            sig_y = ay1 - (sig_h / 2.0)
        elif direction == "down":
            sig_x = ax1 - (sig_w / 2.0)
            sig_y = ay2 + 10.0
        else:
            sig_x = ax2 + 10.0
            sig_y = ay2 + 10.0
        rule_applied = "ARROW_DIRECTION_FOLLOWED"

    else:
        sig_w = min(max(160.0, kw_w * 1.5), page_width * 0.35)
        sig_h = round(sig_w * 0.3, 1)

        sig_x = kw_x1
        sig_y = kw_y2 + 8.0
        rule_applied = "KEYWORD_BELOW"

    sig_w = max(60.0, min(sig_w, page_width * 0.6))
    sig_h = max(25.0, min(sig_h, page_height * 0.3))

    sig_x = max(10.0, min(sig_x, page_width - sig_w - 10.0))
    sig_y = max(10.0, min(sig_y, page_height - sig_h - 10.0))

    res = {
        "page": page_num,
        "x": round(sig_x, 1),
        "y": round(sig_y, 1),
        "width": round(sig_w, 1),
        "height": round(sig_h, 1),
        "rule_applied": rule_applied
    }

    print(f"[PLACEMENT] Placed '{cand_text}' ({rule_applied} -> x={res['x']}, y={res['y']})")
    return res
