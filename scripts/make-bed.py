#!/usr/bin/env python3
"""
合成一段无版权纠纷的环境音床。手上没有正经音乐库时用它先把片子配齐，
有 Artlist / Epidemic 之类的订阅就把 mp3 换掉、改 script.ts 的 music 字段即可。

  python3 scripts/make-bed.py --style chiptune --bpm 100 --seconds 64.67 --out public/audio/my-film/bed.mp3

设计：四个和弦各 8 秒循环（Am7 / Fmaj7 / Cmaj7 / G6），每个音用三条轻微失谐的正弦
叠出宽度；每 2 秒一个衰减很长的钟声音符；底下垫一层极低的粉噪当空气。
全程低通，进 2 秒淡入、出 4 秒淡出。刻意做得很平，它的任务是垫底不是抢戏。
"""
import argparse, math, subprocess, wave, tempfile, os
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--seconds', type=float, default=72.0)
ap.add_argument('--out', default='public/audio/bed.mp3')
ap.add_argument('--sr', type=int, default=44100)
ap.add_argument('--lufs', type=float, default=-14.0)
ap.add_argument('--style', choices=['ambient', 'upbeat', 'pulse', 'bright', 'steady', 'warm', 'tech', 'glide', 'chiptune'], default='ambient')
ap.add_argument('--bpm', type=float, default=120.0)
a = ap.parse_args()

SR = a.sr
N = int(a.seconds * SR)
t = np.arange(N) / SR

def note(f, start, dur, amp, detune=0.004, partials=(1.0, 0.5, 0.28)):
    """一个带缓入缓出的持续音，三条轻微失谐叠出宽度。"""
    out = np.zeros(N)
    i0, i1 = int(start * SR), min(N, int((start + dur) * SR))
    if i1 <= i0:
        return out
    n = i1 - i0
    local = np.arange(n) / SR
    # 缓入缓出各占 35%，接缝处不会有硬边
    env = np.ones(n)
    ramp = max(1, int(n * 0.35))
    env[:ramp] = np.linspace(0, 1, ramp) ** 2
    env[-ramp:] = np.linspace(1, 0, ramp) ** 2
    sig = np.zeros(n)
    for k, w in enumerate(partials):
        for d in (-detune, 0.0, detune):
            sig += w * np.sin(2 * np.pi * f * (k + 1) * (1 + d) * local)
    out[i0:i1] = sig * env * amp / sum(partials) / 3
    return out

def bell(f, start, amp, decay=1.8):
    """钟声般的点缀，指数衰减。"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(N - i0, int(decay * 3 * SR))
    if n <= 0:
        return out
    local = np.arange(n) / SR
    env = np.exp(-local / decay)
    sig = (np.sin(2 * np.pi * f * local)
           + 0.4 * np.sin(2 * np.pi * f * 2.01 * local)
           + 0.18 * np.sin(2 * np.pi * f * 3.02 * local))
    out[i0:i0 + n] = sig * env * amp / 1.58
    return out

def pluck(f, start, amp, decay=0.45):
    """短促的拨弦，upbeat 用。"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(N - i0, int(decay * 4 * SR))
    if n <= 0:
        return out
    local = np.arange(n) / SR
    env = np.exp(-local / decay)
    sig = np.sin(2 * np.pi * f * local) + 0.35 * np.sin(2 * np.pi * f * 2 * local)
    out[i0:i0 + n] = sig * env * amp / 1.35
    return out

def thump(start, amp=0.5):
    """低频落点。不是鼓，是一个下滑的正弦，够撑住拍子又不抢戏。"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(N - i0, int(0.22 * SR))
    if n <= 0:
        return out
    local = np.arange(n) / SR
    freq = 110 * np.exp(-local / 0.045) + 46
    phase = 2 * np.pi * np.cumsum(freq) / SR
    out[i0:i0 + n] = np.sin(phase) * np.exp(-local / 0.09) * amp
    return out

def tick(start, amp=0.05):
    """反拍上的一点噪声，提速度感。"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(N - i0, int(0.05 * SR))
    if n <= 0:
        return out
    local = np.arange(n) / SR
    rr = np.random.default_rng(int(start * 1000) % 9973)
    out[i0:i0 + n] = rr.normal(0, 1, n) * np.exp(-local / 0.012) * amp
    return out

# 和弦：根音低八度 + 三个上方音
CHORDS = [
    [110.00, 261.63, 329.63, 392.00],   # Am7
    [ 87.31, 220.00, 261.63, 329.63],   # Fmaj7
    [130.81, 164.81, 196.00, 246.94],   # Cmaj7
    [ 98.00, 246.94, 293.66, 329.63],   # G6
]
BAR = 8.0

# 明亮的大调走向，给 upbeat 用
UPBEAT = [
    [130.81, 261.63, 329.63, 392.00],   # C
    [ 98.00, 246.94, 293.66, 392.00],   # G
    [110.00, 261.63, 329.63, 440.00],   # Am
    [ 87.31, 261.63, 349.23, 440.00],   # F
]

# ── 五种节拍型变体（同一条片子的系列版本用，形式一样、声音各不同）────────────
#   pulse   小调，十六分锯齿琶音 + 四拍底鼓 + 十六分踩镲，偏暗、推进感强
#   bright  大调，反拍和弦（电钢琴）+ 一三拍底鼓 + 二四拍拍手，明亮
#   steady  木琴八分琶音 + 沙锤 + 每拍轻底鼓，稳、不抢
#   warm    电钢琴和弦，摇摆八分，底鼓落在 1 和 2 的后半拍，暖
#   tech    极简：八分低频脉冲 + 十六分细碎点击 + 玻璃质感琶音
def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def env_at(start, n_sec):
    i0 = int(start * SR)
    n = min(N - i0, int(n_sec * SR))
    return i0, max(0, n)

def hat(start, amp=0.06, decay=0.025):
    out = np.zeros(N)
    i0, n = env_at(start, decay * 5)
    if n <= 0:
        return out
    rr = np.random.default_rng(int(start * 7919) % 100003)
    w = rr.normal(0, 1, n + 1)
    w = np.diff(w)                      # 一阶差分 = 粗糙高通，去掉闷的部分
    out[i0:i0 + n] = w * np.exp(-np.arange(n) / SR / decay) * amp
    return out

def clap(start, amp=0.16):
    out = np.zeros(N)
    for k, d in enumerate((0.0, 0.011, 0.022)):
        out += hat(start + d, amp * (0.6 if k < 2 else 1.0), 0.03 if k == 2 else 0.008)
    return out

def saw(f, start, amp, decay=0.18, harm=7):
    out = np.zeros(N)
    i0, n = env_at(start, decay * 5)
    if n <= 0:
        return out
    t_ = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f * k * t_) / k for k in range(1, harm + 1))
    out[i0:i0 + n] = sig * np.exp(-t_ / decay) * amp / 1.8
    return out

def ep(f, start, amp, dur=0.9, index=1.6):
    """电钢琴：FM，调制指数随时间衰减，起音亮、尾巴圆"""
    out = np.zeros(N)
    i0, n = env_at(start, dur * 2.5)
    if n <= 0:
        return out
    t_ = np.arange(n) / SR
    mod = index * np.exp(-t_ / 0.25) * np.sin(2 * np.pi * f * t_)
    sig = np.sin(2 * np.pi * f * t_ + mod)
    out[i0:i0 + n] = sig * np.exp(-t_ / dur) * amp
    return out

def marimba(f, start, amp):
    out = np.zeros(N)
    i0, n = env_at(start, 1.2)
    if n <= 0:
        return out
    t_ = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t_) * np.exp(-t_ / 0.32) + 0.3 * np.sin(2 * np.pi * f * 3.93 * t_) * np.exp(-t_ / 0.05)
    out[i0:i0 + n] = sig * amp
    return out

def glass(f, start, amp):
    out = np.zeros(N)
    i0, n = env_at(start, 2.4)
    if n <= 0:
        return out
    t_ = np.arange(n) / SR
    sig = np.sin(2 * np.pi * f * t_) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t_) * np.exp(-t_ / 0.2)
    out[i0:i0 + n] = sig * np.exp(-t_ / 0.7) * amp
    return out

def sub(f, start, dur, amp):
    out = np.zeros(N)
    i0, n = env_at(start, dur)
    if n <= 0:
        return out
    t_ = np.arange(n) / SR
    e = np.minimum(1, t_ / 0.008) * np.exp(-t_ / (dur * 0.6))
    out[i0:i0 + n] = np.sin(2 * np.pi * f * t_) * e * amp
    return out

# 和弦用 MIDI 号：每组第一个是根音（低八度那个），后面是和弦音
PROG = {
    'pulse':  [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]],   # Am F C G
    'bright': [[50, 62, 66, 69], [45, 61, 64, 69], [47, 62, 66, 71], [43, 62, 67, 71]],   # D A Bm G
    'steady': [[41, 65, 69, 72], [48, 64, 67, 72], [50, 65, 69, 74], [46, 65, 70, 74]],   # F C Dm Bb
    'warm':   [[39, 63, 67, 70, 74], [36, 63, 67, 70, 72], [44, 63, 67, 72, 68], [46, 62, 65, 68, 70]],  # Ebmaj7 Cm7 Abmaj7 Bb7
    'tech':   [[40, 64, 67, 71], [36, 64, 67, 72], [43, 62, 67, 71], [38, 62, 66, 69]],   # Em C G D
    'glide':  [[43, 62, 66, 71], [47, 62, 66, 69], [40, 62, 67, 71], [36, 64, 67, 71]],   # Gmaj7 Bm7 Em7 Cmaj7
}

def groove(style):
    m = np.zeros(N)
    beat = 60.0 / a.bpm
    n_beats = int(a.seconds / beat) + 1
    for b in range(n_beats):
        t0 = b * beat
        if t0 >= a.seconds:
            break
        ch = PROG[style][(b // 8) % 4]          # 两小节换一个和弦
        root, tones = hz(ch[0]), [hz(x) for x in ch[1:]]
        pos = b % 4
        if style == 'pulse':
            m += thump(t0, 0.6)
            for k in range(4):
                m += hat(t0 + k * beat / 4, 0.05 if k % 2 else 0.025)
                m += saw(tones[(b * 4 + k) % len(tones)] * 2, t0 + k * beat / 4, 0.09)
            m += sub(root, t0 + beat / 2, beat / 2, 0.32)          # 反拍低音，和底鼓错开有泵感
        elif style == 'bright':
            if pos in (0, 2):
                m += thump(t0, 0.55)
            else:
                m += clap(t0, 0.14)
            for k in range(2):
                m += hat(t0 + k * beat / 2, 0.035)
            for tt in tones:
                m += ep(tt, t0 + beat / 2, 0.06, dur=0.22, index=1.2)   # 反拍和弦
            m += sub(root * 2, t0, beat * 0.9, 0.22)
        elif style == 'steady':
            m += thump(t0, 0.32)
            for k in range(2):
                m += hat(t0 + k * beat / 2, 0.04 if k else 0.02, decay=0.05)
                seq = [0, 1, 2, 1]
                m += marimba(tones[seq[(b * 2 + k) % 4]] * 2, t0 + k * beat / 2, 0.16)
            if pos == 0:
                m += note(root, t0, beat * 4, 0.2)
        elif style == 'warm':
            swing = beat * (2 / 3)                # 摇摆：后半拍推迟到三连音位置
            if pos == 0:
                m += thump(t0, 0.5)
                for tt in tones:
                    m += ep(tt, t0, 0.05, dur=1.3)
            if pos == 1:
                m += thump(t0 + swing, 0.35)
                for tt in tones[:3]:
                    m += ep(tt, t0 + swing, 0.04, dur=0.8)
            if pos == 2:
                m += hat(t0, 0.09, decay=0.012)   # 军鼓边击
            m += hat(t0, 0.025, decay=0.04)
            m += hat(t0 + swing, 0.04, decay=0.04)
            if pos == 0:
                m += sub(root * 2, t0, beat * 1.8, 0.24)
        elif style == 'tech':
            if pos in (0, 2):
                m += thump(t0, 0.5)
            for k in range(2):
                m += sub(root, t0 + k * beat / 2, beat / 2 * 0.9, 0.22)
            for k in range(4):
                if (b * 4 + k) % 3 != 1:
                    m += hat(t0 + k * beat / 4, 0.03, decay=0.006)
            m += glass(tones[b % len(tones)] * 2, t0, 0.07)
        elif style == 'glide':
            # 四拍底鼓 + 二四拍拍手 + 反拍踩镲；八分八度低音；
            # 钟声旋律走 3+3+2 的切分（每小节第 0、3、6 个八分），和其他几种的均匀琶音区分开
            m += thump(t0, 0.48 if pos in (0, 2) else 0.34)
            if pos in (1, 3):
                m += clap(t0, 0.12)
            m += hat(t0 + beat / 2, 0.045, decay=0.04)
            for k in range(2):
                m += pluck(root * (2 if k else 1), t0 + k * beat / 2, 0.15, decay=0.18)
            for k in range(2):
                e = pos * 2 + k                    # 本小节第几个八分
                if e in (0, 3, 6):
                    m += bell(tones[[2, 1, 0][(0, 3, 6).index(e)]] * 2, t0 + k * beat / 2, 0.05, decay=0.6)
            if b % 8 == 0:
                for tt in tones:
                    m += note(tt, t0, beat * 8, 0.07)
    return m

# —— chiptune：红白机那套声部。方波旋律 + 方波琶音 + 三角波低音 + 噪声鼓 ——

def sq(f, start, dur, amp, duty=0.25):
    """脉冲波。duty 0.25 是最典型的「红白机」音色，0.5 更空。"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(int(dur * SR), N - i0)
    if i0 >= N or n <= 0:
        return out
    t_ = np.arange(n) / SR
    w = np.where((f * t_) % 1 < duty, 1.0, -1.0)
    e = np.minimum(1, t_ / 0.003) * np.clip((dur * 0.92 - t_) / 0.01, 0, 1)   # 硬起硬收，只去掉爆音
    out[i0:i0 + n] = w * e * amp
    return out

def tri(f, start, dur, amp):
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(int(dur * SR), N - i0)
    if i0 >= N or n <= 0:
        return out
    t_ = np.arange(n) / SR
    w = 2 * np.abs(2 * ((f * t_) % 1) - 1) - 1
    e = np.minimum(1, t_ / 0.003) * np.clip((dur * 0.95 - t_) / 0.01, 0, 1)
    out[i0:i0 + n] = w * e * amp
    return out

_chip_rng = np.random.default_rng(8)

def nz(start, amp, decay):
    """噪声鼓：一段指数衰减的白噪声，衰减短是踩镲，长一点是军鼓。"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(int(decay * 6 * SR), N - i0)
    if i0 >= N or n <= 0:
        return out
    t_ = np.arange(n) / SR
    # 采样保持降采样，噪声才有那种颗粒感
    raw = np.repeat(_chip_rng.uniform(-1, 1, n // 4 + 1), 4)[:n]
    out[i0:i0 + n] = raw * np.exp(-t_ / decay) * amp
    return out

def chip_kick(start, amp):
    """三角波往下扫频当底鼓"""
    out = np.zeros(N)
    i0 = int(start * SR)
    n = min(int(0.12 * SR), N - i0)
    if i0 >= N or n <= 0:
        return out
    t_ = np.arange(n) / SR
    f = 170 * np.exp(-t_ / 0.03) + 45
    ph = np.cumsum(f) / SR
    out[i0:i0 + n] = (2 * np.abs(2 * (ph % 1) - 1) - 1) * np.exp(-t_ / 0.05) * amp
    return out

CHIP = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]]   # C Am F G

def chiptune():
    """
    分三段，跟参考片的起伏一样：前 15% 只有琶音和低音，中段加鼓和方波旋律，
    最后 10% 再收回只剩琶音。整片一个劲儿地满，旁白反而被挤得没地方。
    """
    m = np.zeros(N)
    beat = 60.0 / a.bpm
    six = beat / 4
    n_beats = int(a.seconds / beat) + 1
    # 旋律：每小节 8 个八分，-1 是休止。数字是和弦音的序号，3 是根音高八度
    MEL = [[2, -1, 1, 2, 3, -1, 2, -1], [1, -1, 2, 1, 0, -1, -1, -1]]
    for b in range(n_beats):
        t0 = b * beat
        if t0 >= a.seconds:
            break
        p = t0 / a.seconds
        full = 0.15 <= p < 0.9
        ch = CHIP[(b // 4) % 4]                 # 一小节一个和弦
        root, tones = hz(ch[0]), [hz(x) for x in ch[1:]]
        pos = b % 4
        # 十六分琶音，八度往上翻
        for k in range(4):
            i = (b * 4 + k) % 6
            f = tones[[0, 1, 2, 1, 2, 0][i]] * (2 if i in (2, 4) else 1)
            m += sq(f, t0 + k * six, six, 0.05, duty=0.125)
        # 低音：根音和五度交替的八分
        for k in range(2):
            m += tri(root * (1.5 if (pos * 2 + k) % 4 == 3 else 1), t0 + k * beat / 2, beat / 2, 0.32)
        if full:
            m += chip_kick(t0, 0.5 if pos in (0, 2) else 0.0)
            if pos in (1, 3):
                m += nz(t0, 0.16, 0.03)
            m += nz(t0 + beat / 2, 0.05, 0.006)
            bar = (b // 4) % 2
            for k in range(2):
                idx = MEL[bar][pos * 2 + k]
                if idx >= 0:
                    m += sq(tones[idx % 3] * (4 if idx >= 3 else 2), t0 + k * beat / 2, beat / 2, 0.07, duty=0.25)
    return m

mix = np.zeros(N)

if a.style == 'chiptune':
    mix += chiptune()
elif a.style in PROG:
    mix += groove(a.style)
elif a.style == 'upbeat':
    beat = 60.0 / a.bpm
    bar = beat * 4
    n_beats = int(a.seconds / beat) + 1
    for b in range(n_beats):
        t0 = b * beat
        if t0 >= a.seconds:
            break
        ch = UPBEAT[int(t0 // (bar * 2)) % len(UPBEAT)]
        # 每拍一个落点，第 1、3 拍重
        mix += thump(t0, 0.55 if b % 4 in (0, 2) else 0.3)
        mix += tick(t0 + beat / 2)
        # 八分音符琶音在和弦音里来回走
        for k in range(2):
            step = (b * 2 + k) % 6
            idx = [1, 2, 3, 2, 3, 1][step]
            mix += pluck(ch[idx] * (2 if step in (2, 4) else 1), t0 + k * beat / 2, 0.16)
        # 根音垫底，一小节一次
        if b % 4 == 0:
            mix += note(ch[0], t0, bar, 0.26)
else:
  bar = 0
  while bar * BAR < a.seconds:
    ch = CHORDS[bar % len(CHORDS)]
    start = bar * BAR
    for j, f in enumerate(ch):
        # 根音厚一点，上方音轻一点
        mix += note(f, start, BAR + 1.2, 0.30 if j == 0 else 0.17)
    # 每 2 秒一个钟声，在和弦音里往上走
    for k in range(4):
        mix += bell(ch[1 + (k % 3)] * 2, start + k * 2.0 + 0.25, 0.055)
    bar += 1

# 空气层：粉噪 + 强低通
rng = np.random.default_rng(20260902)
noise = rng.normal(0, 1, N)
b = 0.0
air = np.empty(N)
for i in range(N):                      # 一阶低通，慢但只跑一次
    b += 0.0009 * (noise[i] - b)
    air[i] = b
air /= (np.max(np.abs(air)) + 1e-9)
mix += air * 0.05

# 整体低通，把高频毛刺压掉
y = np.empty(N)
acc = 0.0
alpha = 1 - math.exp(-2 * math.pi * (2200 if a.style == 'ambient' else 6500) / SR)
for i in range(N):
    acc += alpha * (mix[i] - acc)
    y[i] = acc

# 首尾淡入淡出
fi, fo = (int(2.0 * SR), int(4.0 * SR)) if a.style == 'ambient' else (int(0.15 * SR), int(1.2 * SR))
y[:fi] *= np.linspace(0, 1, fi) ** 2
y[-fo:] *= np.linspace(1, 0, fo) ** 2

y = y / (np.max(np.abs(y)) + 1e-9) * 0.28
stereo = np.stack([y, np.roll(y, int(0.011 * SR))], axis=1)   # 右声道微延迟，出一点宽度
pcm = (stereo * 32767).astype(np.int16)

tmp = tempfile.mktemp(suffix='.wav')
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
# 归一化到 -14 LUFS。合成出来的东西天然很轻，不归一化的话在 script.ts 里
# 无论 musicVolume 给多少都是猜，实测会发现音乐压根听不见。
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp,
                '-af', f'loudnorm=I={a.lufs}:TP=-1.5:LRA=11',
                '-b:a', '160k', a.out], check=True)
os.remove(tmp)
print(f'✓ {a.out}  {a.seconds:.0f}s')
