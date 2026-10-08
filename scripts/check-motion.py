#!/usr/bin/env python3
"""
量一条成片有没有「画面静止」的段落。

  python3 scripts/check-motion.py out/my-film/landscape.mp4

做法：ffmpeg 逐帧算跟上一帧的平均差异（YAVG）。像素风是 10fps 逐格动画，
30fps 的成片里每 3 帧有 2 帧完全相同，所以按「每 3 帧取最大值」当一格来看，
一格 0.1 秒。连续 5 格（0.5 秒）以上几乎不动就报出来。

只靠标准库，不用装东西。
"""
import re
import statistics
import subprocess
import sys
import tempfile

if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(1)

video = sys.argv[1]
fps = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
step = max(1, round(fps / 10))

with tempfile.NamedTemporaryFile(suffix='.txt') as tmp:
    subprocess.run(
        [
            'ffmpeg', '-v', 'error', '-i', video, '-vf',
            f'tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file={tmp.name}',
            '-f', 'null', '-',
        ],
        check=True,
    )
    values = [float(x) for x in re.findall(r'YAVG=([\d.]+)', open(tmp.name).read())]

steps = [max(values[i:i + step]) for i in range(0, len(values), step)]
print(f'帧数 {len(values)}，每格中位差异 {statistics.median(steps):.3f}')

static = []
run = 0
for i, v in enumerate(steps + [99]):
    if v < 0.1:
        run += 1
    else:
        if run >= 5:
            static.append((run / 10, i / 10))
        run = 0

if static:
    for length, end in static:
        print(f'⚠️ 静止 {length:.1f} 秒，到 {end:.1f} 秒为止')
    sys.exit(2)
print('✓ 没有超过 0.5 秒的静止段')
