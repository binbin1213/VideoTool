#!/usr/bin/env python3
import argparse
import json
import math
from typing import Dict, Any, Tuple, Optional


def parse_args():
    p = argparse.ArgumentParser(description="HandBrake UI contrast checker")
    p.add_argument("--tokens", required=True, help="path to tokens json")
    p.add_argument("--light", required=True, help="path to components (light) json")
    p.add_argument("--dark", required=True, help="path to components (dark) json")
    return p.parse_args()


def hex_to_rgb(hex_color: str) -> Tuple[float, float, float]:
    h = hex_color.lstrip('#')
    if len(h) == 3:
        h = ''.join([c*2 for c in h])
    r = int(h[0:2], 16) / 255.0
    g = int(h[2:4], 16) / 255.0
    b = int(h[4:6], 16) / 255.0
    return r, g, b


def relative_luminance(rgb: Tuple[float, float, float]) -> float:
    def f(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = map(f, rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(fg_hex: str, bg_hex: str) -> float:
    L1 = relative_luminance(hex_to_rgb(fg_hex))
    L2 = relative_luminance(hex_to_rgb(bg_hex))
    L1, L2 = max(L1, L2), min(L1, L2)
    return (L1 + 0.05) / (L2 + 0.05)


def get_value_by_path(d: Dict[str, Any], path: str) -> Optional[Any]:
    cur = d
    for part in path.split('.'):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def resolve_color(token_root: Dict[str, Any], key: str) -> Optional[str]:
    if isinstance(key, str) and key.startswith('#'):
        return key
    if isinstance(key, str) and key:
        val = get_value_by_path(token_root, key)
        if isinstance(val, str) and val.startswith('#'):
            return val
    return None


def check_component_set(name: str, comp: Dict[str, Any], tokens: Dict[str, Any], theme: str) -> Dict[str, Any]:
    report = {"name": name, "theme": theme, "fails": [], "missing": []}
    def ensure_pair(state_name: str, fg_key: Optional[str], bg_key: Optional[str], min_ratio: float):
        if not fg_key or not bg_key:
            return
        fg_hex = resolve_color(tokens, fg_key)
        bg_hex = resolve_color(tokens, bg_key)
        if fg_hex is None:
            report["missing"].append({"state": state_name, "key": fg_key})
            return
        if bg_hex is None:
            report["missing"].append({"state": state_name, "key": bg_key})
            return
        cr = contrast_ratio(fg_hex, bg_hex)
        if cr < min_ratio:
            report["fails"].append({"state": state_name, "pair": [fg_key, bg_key], "ratio": round(cr, 2), "min": min_ratio})

    default_bg = f"color.theme.{theme}.surface"
    text_default = f"color.theme.{theme}.text-primary"

    for state_name, state in comp.items():
        if not isinstance(state, dict):
            continue
        text_key = state.get("text", text_default)
        icon_key = state.get("icon", text_key)
        bg_key = state.get("bg", default_bg)
        border_key = state.get("border")
        ensure_pair(state_name, text_key, bg_key, 3.0)
        if border_key:
            ensure_pair(state_name + ":border", border_key, bg_key, 3.0)
        if icon_key and icon_key != text_key:
            ensure_pair(state_name + ":icon", icon_key, bg_key, 3.0)

    return report


def main():
    args = parse_args()
    with open(args.tokens, 'r', encoding='utf-8') as f:
        tokens = json.load(f)
    with open(args.light, 'r', encoding='utf-8') as f:
        light = json.load(f)
    with open(args.dark, 'r', encoding='utf-8') as f:
        dark = json.load(f)

    results = []
    for theme_name, comp_map in (('light', light), ('dark', dark)):
        for comp_name, states in comp_map.items():
            results.append(check_component_set(comp_name, states, tokens, theme_name))

    total_fails = sum(len(r['fails']) for r in results)
    total_missing = sum(len(r['missing']) for r in results)

    print("HandBrake UI Contrast Report")
    print("================================")
    for r in results:
        if r['fails'] or r['missing']:
            print(f"\n[{r['theme'].upper()}] {r['name']}")
            for m in r['missing']:
                print(f"  MISSING: {m['state']} -> {m['key']}")
            for fitem in r['fails']:
                print(f"  FAIL: {fitem['state']} {fitem['pair']} ratio={fitem['ratio']} < {fitem['min']}")

    print("\nSummary: fails=", total_fails, "missing=", total_missing)
    exit(1 if total_fails or total_missing else 0)


if __name__ == "__main__":
    main()


