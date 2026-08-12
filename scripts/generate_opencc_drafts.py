import json
from pathlib import Path

from opencc import OpenCC


_CONVERTER = OpenCC("s2twp")


def build_drafts(todo: dict) -> dict:
    drafts = {}
    for key in sorted(todo):
        item = todo[key]
        simplified = item.get("simplified")
        drafts[key] = {
            "english": item.get("english", ""),
            "simplified": simplified,
            "draft": _CONVERTER.convert(simplified) if isinstance(simplified, str) else "",
            "reason": item.get("reason", "missing"),
            "reviewStatus": "unreviewed",
        }
    return drafts


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    todo_path = root / "work" / "zh-TW.todo.json"
    output_path = root / "work" / "zh-TW.drafts.json"
    todo = json.loads(todo_path.read_text(encoding="utf-8"))
    drafts = build_drafts(todo)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(drafts, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(drafts)} unreviewed drafts at {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
