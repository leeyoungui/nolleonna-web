#!/usr/bin/env python3
"""온나에듀랩 수업 갤러리 목록 생성기.

images/ 아래 카테고리 폴더에 사진을 넣고 이 스크립트를 실행하면
gallery.json 이 다시 만들어집니다. (사이트는 이 파일을 읽어 갤러리를 그립니다.)

  images/classroom/  디지털 교실 (온나 라이브 교실, 자체 개발 도구 화면)
  images/teaching/   기관 출강 현장 (수업 사진, 연수 사진)
  images/outcomes/   학생 결과물 (굿즈·작품 사진)

파일 이름 규칙(선택): 2026-11-19_봉명중_수업.jpg 처럼 앞에 날짜를 붙이면
최신순 정렬과 연도 필터에 그대로 쓰입니다.

사진에 제목·설명을 붙이려면 images/captions.json 에 파일 이름을 키로 적습니다.
  { "2026-11_온나라이브_실시간_수업톡_및_퀴즈.png": {"title": "...", "desc": "..."} }
"""
from pathlib import Path
from urllib.parse import quote
import json
import re

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
OUT = ROOT / "gallery.json"

LABELS = {
    "classroom": "디지털 교실",
    "teaching": "기관 출강 현장",
    "outcomes": "학생 결과물",
}
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
SKIP_DIRS = {"profile", "brand"}


def load_captions():
    path = IMAGES / "captions.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        print(f"! {path} 를 읽지 못했습니다. 파일 이름으로만 목록을 만듭니다.")
        return {}


def clean_title(stem):
    # 날짜 접두어(2026-11-19_ / 2026.11.19_ / 2026-11_)를 떼고 읽기 좋게 바꿉니다.
    s = re.sub(r"^\d{4}[-_.]?\d{0,2}[-_.]?\d{0,2}[_\-\s]+", "", stem)
    s = re.sub(r"[_]+", " ", s).strip()
    return s or stem


def main():
    captions = load_captions()
    rows = []
    if IMAGES.exists():
        for p in sorted(IMAGES.rglob("*")):
            if not p.is_file() or p.suffix.lower() not in EXTS:
                continue
            rel = p.relative_to(IMAGES)
            parts = rel.parts
            if any(x.startswith(".") for x in parts):
                continue
            if parts[0] in SKIP_DIRS:
                continue
            key = parts[0] if len(parts) > 1 else "etc"
            cat = key
            meta = captions.get(rel.name) or captions.get(rel.as_posix()) or {}
            m = re.search(r"(?<!\d)(20\d{2})[-_.]?(\d{2})?[-_.]?(\d{2})?(?!\d)", p.stem)
            year = m.group(1) if m else ""
            month = (m.group(2) or "00") if m else "00"
            day = (m.group(3) or "00") if m else "00"
            rows.append({
                "path": quote(p.relative_to(ROOT).as_posix(), safe="/"),
                "title": meta.get("title") or clean_title(p.stem),
                "desc": meta.get("desc", ""),
                "category": cat,
                "categoryLabel": LABELS.get(cat, meta.get("categoryLabel", cat)),
                "date": f"{year}.{month}" if year else "",
                "year": year,
                "sort": f"{year}{month}{day}" if year else "00000000",
                "_order": int(meta.get("order", 999)),
            })

    # 최신 날짜 먼저, 같은 날짜 안에서는 captions.json 의 order 값(작을수록 앞) 순서로.
    rows.sort(key=lambda r: (r["sort"], -r["_order"]), reverse=True)
    for r in rows:
        r.pop("_order", None)
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"gallery.json · 사진 {len(rows)}장")


if __name__ == "__main__":
    main()
