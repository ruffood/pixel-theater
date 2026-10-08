#!/usr/bin/env python3
"""
edge-tts 合成，带**词级**时间戳。被 scripts/tts.mjs 调用，不单独用。

用法：读 stdin 的 JSON {"lines": {"<场景id>": "<文案>"}, "voice": "...", "rate": "+0%"}，
每条写一个 <outDir>/<id>.raw.mp3，最后把词级时间戳打到 stdout（JSON）。

为什么是 WordBoundary 而不是默认的 SentenceBoundary：
句级边界只够做「一句一换」的字幕，而且实测会重叠（前一句的结束晚于后一句的开始），
那期间旁白已经走了、字幕还没走。词级时间戳是语音合成本身吐出来的，是精确的 ——
拿 Whisper 去转写我们自己合成的音频，只是在已有数据上再叠一层猜测。

edge-tts 7.x 的默认值是 SentenceBoundary,必须显式传 boundary="WordBoundary"。
"""

import asyncio
import json
import os
import re
import sys

import edge_tts

# 词尾要带走的标点。WordBoundary 吐的是光秃秃的词,没有标点 ——
# 字幕里「breathless box breathing」跟「breathless. Box breathing」读起来不是一回事,
# 而且断句也全靠它。
TRAILING = ".,!?;:\u2026"


def attach_punctuation(words: list[dict], text: str) -> list[dict]:
    """把原文里的标点贴回每个词的尾巴上。

    按顺序在原文里找每个词,找到就把紧跟其后的标点带上。找不到就原样留着 ——
    合成器偶尔会把连字符词拆开,这种情况下没有标点可贴,不该因此报错。
    """
    cursor = 0
    for w in words:
        m = re.compile(re.escape(w["word"]), re.IGNORECASE).search(text, cursor)
        if not m:
            continue
        cursor = m.end()
        tail = ""
        while cursor < len(text) and text[cursor] in TRAILING:
            tail += text[cursor]
            cursor += 1
        w["word"] += tail
    return words


async def synth(text: str, voice: str, rate: str, path: str) -> list[dict]:
    """合成一条，返回词级时间戳（毫秒，相对本条音频起点）。"""
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words: list[dict] = []
    with open(path, "wb") as fh:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                fh.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # edge-tts 给的是 100 纳秒单位,换成毫秒
                start = chunk["offset"] // 10_000
                words.append({
                    "word": chunk["text"],
                    "startMs": start,
                    "endMs": start + chunk["duration"] // 10_000,
                })
    if not words:
        raise SystemExit(f"没拿到词级时间戳:{path}")
    return attach_punctuation(words, text)


async def main() -> None:
    req = json.load(sys.stdin)
    out_dir = req["outDir"]
    voice = req.get("voice", "zh-CN-YunxiNeural")
    rate = req.get("rate", "+0%")
    os.makedirs(out_dir, exist_ok=True)

    result = {}
    for scene_id, text in req["lines"].items():
        path = os.path.join(out_dir, f"{scene_id}.raw.mp3")
        result[scene_id] = await synth(text, voice, rate, path)
    json.dump(result, sys.stdout)


asyncio.run(main())
