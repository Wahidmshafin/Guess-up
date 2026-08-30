import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_DECKS as FALLBACK_DECKS } from './decks'
import type { Deck } from './decks'

export type { Deck }

type Phase = 'home' | 'ready' | 'countdown' | 'play' | 'results' | 'editor' | 'settings'
type Result = { word: string; got: boolean }
type Settings = { seconds: number; sound: boolean; tilt: boolean }
type TiltPermission = 'unknown' | 'unsupported' | 'granted' | 'denied'

/* ------------------------------------------------------------------ *
 * Constants + storage
 * ------------------------------------------------------------------ */

const KEY_DECKS = 'guessup:decks:v1'
const KEY_SETTINGS = 'guessup:settings:v1'
const KEY_BEST = 'guessup:best:v1'

const DEFAULT_SETTINGS: Settings = { seconds: 60, sound: true, tilt: true }

const SWATCHES = [
  '#E8453C', '#F0803C', '#F2B705', '#1E9E6A',
  '#0E9BA6', '#2563EB', '#8B5CF6', '#D6336C',
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked - the game still works for this session */
  }
}

/* ------------------------------------------------------------------ *
 * Sound (Web Audio, no assets)
 * ------------------------------------------------------------------ */

let audioCtx: AudioContext | null = null

function tone(freq: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.22) {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.03)
  } catch {
    /* audio is a nicety, never a blocker */
  }
}

const SFX = {
  correct: () => {
    tone(680, 0.09, 'triangle')
    window.setTimeout(() => tone(1020, 0.14, 'triangle'), 85)
  },
  pass: () => tone(190, 0.2, 'sawtooth', 0.16),
  tick: () => tone(900, 0.05, 'square', 0.1),
  go: () => tone(560, 0.16, 'triangle'),
  end: () => {
    tone(320, 0.22, 'sawtooth', 0.2)
    window.setTimeout(() => tone(190, 0.4, 'sawtooth', 0.2), 190)
  },
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

/* ------------------------------------------------------------------ *
 * Tilt
 *
 * z = cos(beta) * cos(gamma) is the vertical component of the screen
 * normal in world space:  +1 screen faces the sky, -1 screen faces the
 * floor, 0 screen is vertical (the forehead position). It is derived
 * from the full rotation matrix, so it behaves the same in portrait and
 * landscape and ignores compass heading.
 * ------------------------------------------------------------------ */

const TRIGGER = 0.62
const NEUTRAL = 0.34

async function askTiltPermission(): Promise<TiltPermission> {
  const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent
  if (!DOE) return 'unsupported'
  if (typeof DOE.requestPermission === 'function') {
    try {
      const result = await DOE.requestPermission()
      return result === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }
  return 'granted'
}

function useOrientation(active: boolean, onZ: (z: number) => void) {
  const cb = useRef(onZ)
  cb.current = onZ

  useEffect(() => {
    if (!active) return
    const handler = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return
      const beta = (event.beta * Math.PI) / 180
      const gamma = (event.gamma * Math.PI) / 180
      cb.current(Math.cos(beta) * Math.cos(gamma))
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [active])
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function wordSize(word: string) {
  const n = word.length
  if (n <= 9) return 'clamp(3.2rem, 17vw, 13rem)'
  if (n <= 15) return 'clamp(2.6rem, 12vw, 9rem)'
  if (n <= 24) return 'clamp(2.1rem, 8.5vw, 6rem)'
  return 'clamp(1.7rem, 6.5vw, 4.2rem)'
}

/** Picks black or white text for a background colour, using WCAG luminance. */
function readable(hex: string) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(value)) return '#ffffff'
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const s = channel / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? '#0f1320' : '#ffffff'
}

/** Background + matching text colour, for anything painted in a deck colour. */
const skin = (hex: string) => ({ background: hex, color: readable(hex) })

function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'deck'
  )
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function enterImmersive() {
  try {
    await document.documentElement.requestFullscreen?.()
  } catch {
    /* denied or unsupported */
  }
  try {
    await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.('landscape')
  } catch {
    /* orientation lock needs fullscreen on some browsers */
  }
}

function exitImmersive() {
  try {
    ;(screen.orientation as unknown as { unlock?: () => void })?.unlock?.()
  } catch {
    /* ignore */
  }
  try {
    if (document.fullscreenElement) void document.exitFullscreen()
  } catch {
    /* ignore */
  }
}

let wakeLock: { release: () => Promise<void> } | null = null

async function keepScreenAwake(on: boolean) {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    if (on) {
      if (!wakeLock && wl) wakeLock = await wl.request('screen')
    } else if (wakeLock) {
      await wakeLock.release()
      wakeLock = null
    }
  } catch {
    /* not supported */
  }
}

function normaliseDecks(raw: unknown): Deck[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { decks?: unknown[] })?.decks)
      ? (raw as { decks: unknown[] }).decks
      : []
  return list
    .map((item, index) => {
      const d = item as Partial<Deck>
      return {
        id: String(d.id ?? `deck-${index}`),
        name: String(d.name ?? 'Untitled deck'),
        emoji: String(d.emoji ?? '🃏'),
        color: String(d.color ?? SWATCHES[index % SWATCHES.length]),
        description: d.description ? String(d.description) : '',
        words: Array.isArray(d.words) ? d.words.map(String).filter((w) => w.trim().length > 0) : [],
      }
    })
    .filter((d) => d.words.length > 0)
}

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */

export default function App() {
  const [builtIn, setBuiltIn] = useState<Deck[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [custom, setCustom] = useState<Deck[]>(() => load<Deck[]>(KEY_DECKS, []))
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(KEY_SETTINGS, {}) }))
  const [best, setBest] = useState<Record<string, number>>(() => load<Record<string, number>>(KEY_BEST, {}))

  const [phase, setPhase] = useState<Phase>('home')
  const [deck, setDeck] = useState<Deck | null>(null)
  const [editing, setEditing] = useState<Deck | null>(null)

  const [queue, setQueue] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [timeLeft, setTimeLeft] = useState(settings.seconds)
  const [countdown, setCountdown] = useState(3)
  const [flash, setFlash] = useState<'correct' | 'pass' | null>(null)

  const [tiltPermission, setTiltPermission] = useState<TiltPermission>('unknown')
  const [tiltZ, setTiltZ] = useState<number | null>(null)

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const flashRef = useRef(flash)
  flashRef.current = flash
  const armedRef = useRef(false)
  const lastSampleRef = useRef(0)
  const soundRef = useRef(settings.sound)
  soundRef.current = settings.sound
  const queueRef = useRef(queue)
  queueRef.current = queue
  const indexRef = useRef(index)
  indexRef.current = index

  const decks = useMemo(() => [...builtIn, ...custom], [builtIn, custom])
  const word = queue[index] ?? ''

  const play = useCallback((name: keyof typeof SFX) => {
    if (soundRef.current) SFX[name]()
  }, [])

  /* ---- work out whether motion access needs an explicit prompt ---- */
  useEffect(() => {
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
      .DeviceOrientationEvent
    if (!DOE) setTiltPermission('unsupported')
    else if (typeof DOE.requestPermission !== 'function') setTiltPermission('granted')
  }, [])

  /* ---- load decks.json ---- */
  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}decks.json`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const parsed = normaliseDecks(data)
        setBuiltIn(parsed.length ? parsed : FALLBACK_DECKS)
      })
      .catch(() => {
        if (cancelled) return
        setBuiltIn(FALLBACK_DECKS)
        setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /* ---- persist ---- */
  useEffect(() => store(KEY_DECKS, custom), [custom])
  useEffect(() => store(KEY_SETTINGS, settings), [settings])
  useEffect(() => store(KEY_BEST, best), [best])

  /* ---- round flow ---- */

  const finish = useCallback(() => {
    play('end')
    buzz([120, 60, 120])
    setFlash(null)
    setPhase('results')
    void keepScreenAwake(false)
    exitImmersive()
  }, [play])

  const finishRef = useRef(finish)
  finishRef.current = finish

  const nextWord = useCallback(() => {
    const next = indexRef.current + 1
    if (next < queueRef.current.length) {
      setIndex(next)
    } else {
      setQueue(shuffle(queueRef.current))
      setIndex(0)
    }
  }, [])

  const nextWordRef = useRef(nextWord)
  nextWordRef.current = nextWord

  const answer = useCallback(
    (got: boolean) => {
      if (phaseRef.current !== 'play' || flashRef.current) return
      const current = queue[index]
      if (!current) return
      setResults((r) => [...r, { word: current, got }])
      play(got ? 'correct' : 'pass')
      buzz(got ? 45 : [20, 50, 20])
      setFlash(got ? 'correct' : 'pass')
      flashRef.current = got ? 'correct' : 'pass'
      window.setTimeout(() => {
        setFlash(null)
        flashRef.current = null
        nextWordRef.current()
      }, 700)
    },
    [index, queue, play],
  )

  const answerRef = useRef(answer)
  answerRef.current = answer

  /* ---- one orientation listener for the whole app ---- */
  useOrientation(settings.tilt && tiltPermission === 'granted', (z) => {
    const stage = phaseRef.current
    if (stage === 'ready') {
      const now = Date.now()
      if (now - lastSampleRef.current > 80) {
        lastSampleRef.current = now
        setTiltZ(z)
      }
      return
    }
    if (stage !== 'play') return
    if (armedRef.current) {
      if (z < -TRIGGER) {
        armedRef.current = false
        answerRef.current(true)
      } else if (z > TRIGGER) {
        armedRef.current = false
        answerRef.current(false)
      }
    } else if (Math.abs(z) < NEUTRAL) {
      armedRef.current = true
    }
  })

  /* ---- keyboard ---- */
  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        answerRef.current(true)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        answerRef.current(false)
      } else if (event.key === 'Escape') {
        finishRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  /* ---- countdown ---- */
  useEffect(() => {
    if (phase !== 'countdown') return
    setCountdown(3)
    play('tick')
    let value = 3
    const id = window.setInterval(() => {
      value -= 1
      setCountdown(value)
      if (value > 0) play('tick')
      if (value <= 0) {
        window.clearInterval(id)
        play('go')
        armedRef.current = false
        setPhase('play')
      }
    }, 900)
    return () => window.clearInterval(id)
  }, [phase, play])

  /* ---- round timer ---- */
  useEffect(() => {
    if (phase !== 'play') return
    const deadline = Date.now() + settings.seconds * 1000
    let shown = settings.seconds
    setTimeLeft(settings.seconds)
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      if (left !== shown) {
        shown = left
        setTimeLeft(left)
        if (left > 0 && left <= 5) play('tick')
      }
      if (left <= 0) {
        window.clearInterval(id)
        finishRef.current()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, settings.seconds, play])

  /* ---- record best score ---- */
  useEffect(() => {
    if (phase !== 'results' || !deck) return
    const score = results.filter((r) => r.got).length
    setBest((prev) => (score > (prev[deck.id] ?? 0) ? { ...prev, [deck.id]: score } : prev))
  }, [phase, deck, results])

  /* ---- actions ---- */

  const openDeck = (chosen: Deck) => {
    setDeck(chosen)
    setTiltZ(null)
    setPhase('ready')
  }

  const startRound = async () => {
    if (!deck) return
    void enterImmersive()
    if (settings.tilt && tiltPermission === 'unknown') {
      const result = await askTiltPermission()
      setTiltPermission(result)
    }
    setQueue(shuffle(deck.words))
    setIndex(0)
    setResults([])
    setFlash(null)
    flashRef.current = null
    armedRef.current = false
    void keepScreenAwake(true)
    setPhase('countdown')
  }

  const enableTilt = async () => {
    const result = await askTiltPermission()
    setTiltPermission(result)
    if (result !== 'granted') setSettings((s) => ({ ...s, tilt: result !== 'unsupported' ? s.tilt : false }))
  }

  const backHome = () => {
    void keepScreenAwake(false)
    exitImmersive()
    setPhase('home')
    setDeck(null)
  }

  const saveDeck = (next: Deck) => {
    setCustom((list) => {
      const exists = list.some((d) => d.id === next.id)
      return exists ? list.map((d) => (d.id === next.id ? next : d)) : [...list, next]
    })
    setEditing(null)
    setPhase('home')
  }

  const deleteDeck = (id: string) => {
    setCustom((list) => list.filter((d) => d.id !== id))
    setEditing(null)
    setPhase('home')
  }

  const tapAnswer = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientY - box.top) / box.height
    if (ratio < 0.42) answerRef.current(false)
    else if (ratio > 0.58) answerRef.current(true)
  }

  /* ---- render ---- */

  const score = results.filter((r) => r.got).length

  if (phase === 'countdown') {
    return (
      <main className="stage" style={deck ? skin(deck.color) : undefined}>
        <div className="count" key={countdown}>
          {countdown > 0 ? countdown : 'GO'}
        </div>
      </main>
    )
  }

  if (phase === 'play') {
    return (
      <main
        className={`stage play${flash ? ` flash-${flash}` : ''}`}
        style={flash || !deck ? undefined : skin(deck.color)}
        onPointerDown={tapAnswer}
      >
        {flash ? (
          <div className="verdict">
            <span className="verdict-arrow">{flash === 'correct' ? '▼' : '▲'}</span>
            <span className="verdict-text">{flash === 'correct' ? 'Got it' : 'Pass'}</span>
          </div>
        ) : (
          <>
            <div className="zone zone-top">▲ Pass</div>
            <div className="word" style={{ fontSize: wordSize(word) }}>
              {word}
            </div>
            <div className="zone zone-bottom">▼ Got it</div>
            <div className={`clock${timeLeft <= 5 ? ' urgent' : ''}`}>{timeLeft}</div>
            <div className="tally">{score}</div>
          </>
        )}
      </main>
    )
  }

  if (phase === 'ready' && deck) {
    return (
      <ReadyScreen
        deck={deck}
        settings={settings}
        tiltPermission={tiltPermission}
        tiltZ={tiltZ}
        onEnableTilt={enableTilt}
        onStart={startRound}
        onBack={backHome}
      />
    )
  }

  if (phase === 'results' && deck) {
    return (
      <ResultsScreen
        deck={deck}
        results={results}
        best={best[deck.id] ?? 0}
        onToggle={(i) => setResults((r) => r.map((item, idx) => (idx === i ? { ...item, got: !item.got } : item)))}
        onAgain={() => setPhase('ready')}
        onHome={backHome}
      />
    )
  }

  if (phase === 'editor') {
    return (
      <EditorScreen
        deck={editing}
        onSave={saveDeck}
        onDelete={editing ? () => deleteDeck(editing.id) : undefined}
        onCancel={() => {
          setEditing(null)
          setPhase('home')
        }}
      />
    )
  }

  if (phase === 'settings') {
    return (
      <SettingsScreen
        settings={settings}
        tiltPermission={tiltPermission}
        decks={decks}
        custom={custom}
        onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        onEnableTilt={enableTilt}
        onImport={(imported) => setCustom((list) => [...list, ...imported])}
        onClearBest={() => setBest({})}
        onBack={() => setPhase('home')}
      />
    )
  }

  return (
    <main className="shell">
      <header className="masthead">
        <div className="masthead-row">
          <h1 className="logo">
            Guess<span>Up</span>
          </h1>
          <button className="link-btn" onClick={() => setPhase('settings')}>
            Settings
          </button>
        </div>
        <p className="tagline">Phone on your forehead. Tilt down when they guess it.</p>
      </header>

      {loadFailed && <p className="notice">Could not load decks.json, so only the built-in starter deck is available.</p>}

      <section className="grid">
        {decks.map((d) => (
          <button key={d.id} className="tile" style={skin(d.color)} onClick={() => openDeck(d)}>
            <span className="tile-emoji">{d.emoji}</span>
            <span className="tile-name">{d.name}</span>
            <span className="tile-meta">
              {d.words.length} cards
              {best[d.id] ? ` · best ${best[d.id]}` : ''}
            </span>
            {d.custom && (
              <span
                className="tile-edit"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  setEditing(d)
                  setPhase('editor')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.stopPropagation()
                    setEditing(d)
                    setPhase('editor')
                  }
                }}
              >
                Edit
              </span>
            )}
          </button>
        ))}

        <button
          className="tile tile-new"
          onClick={() => {
            setEditing(null)
            setPhase('editor')
          }}
        >
          <span className="tile-emoji">＋</span>
          <span className="tile-name">New deck</span>
          <span className="tile-meta">Write your own cards</span>
        </button>
      </section>

      <footer className="footnote">
        Works best on a phone, held in landscape. {decks.length} decks loaded.
      </footer>
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * Ready
 * ------------------------------------------------------------------ */

function ReadyScreen(props: {
  deck: Deck
  settings: Settings
  tiltPermission: TiltPermission
  tiltZ: number | null
  onEnableTilt: () => void
  onStart: () => void
  onBack: () => void
}) {
  const { deck, settings, tiltPermission, tiltZ, onEnableTilt, onStart, onBack } = props
  const tiltLive = settings.tilt && tiltPermission === 'granted' && tiltZ !== null
  const canAsk = settings.tilt && tiltPermission === 'unknown'
  const marker = Math.max(-1, Math.min(1, tiltZ ?? 0))

  return (
    <main className="shell">
      <button className="link-btn back" onClick={onBack}>
        ← All decks
      </button>

      <div className="ready-head" style={skin(deck.color)}>
        <span className="ready-emoji">{deck.emoji}</span>
        <h2 className="ready-name">{deck.name}</h2>
        <p className="ready-desc">{deck.description || `${deck.words.length} cards`}</p>
      </div>

      <ol className="rules">
        <li>Hold the phone flat against your forehead, screen facing your friends.</li>
        <li>They shout clues. They must not say the word itself.</li>
        <li>
          Tilt the phone <strong>down</strong> when you guess right, <strong>up</strong> to skip.
        </li>
      </ol>

      {tiltLive ? (
        <div className="tiltmeter">
          <div className="tiltmeter-track">
            <span className="tiltmeter-band" />
            <span className="tiltmeter-dot" style={{ left: `${((marker + 1) / 2) * 100}%` }} />
          </div>
          <div className="tiltmeter-labels">
            <span>Tilt down · got it</span>
            <span>Hold flat</span>
            <span>Tilt up · pass</span>
          </div>
        </div>
      ) : (
        <div className="tiltmeter">
          <p className="tilt-note">
            {canAsk
              ? 'Turn on motion access to play with tilt. Otherwise, tap the bottom of the screen for a hit and the top to pass.'
              : 'No tilt on this device. Tap the bottom of the screen for a hit, the top to pass. Arrow keys work too.'}
          </p>
          {canAsk && (
            <button className="btn btn-quiet" onClick={onEnableTilt}>
              Allow motion access
            </button>
          )}
        </div>
      )}

      <button className="btn btn-big" style={skin(deck.color)} onClick={onStart}>
        Start {settings.seconds}s round
      </button>
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * Results
 * ------------------------------------------------------------------ */

function ResultsScreen(props: {
  deck: Deck
  results: Result[]
  best: number
  onToggle: (index: number) => void
  onAgain: () => void
  onHome: () => void
}) {
  const { deck, results, best, onToggle, onAgain, onHome } = props
  const score = results.filter((r) => r.got).length

  return (
    <main className="shell">
      <div className="score-head" style={skin(deck.color)}>
        <span className="score-value">{score}</span>
        <span className="score-label">{score === 1 ? 'card' : 'cards'} guessed</span>
        {best > score && <span className="score-best">Your best on {deck.name} is {best}</span>}
      </div>

      {results.length === 0 ? (
        <p className="notice">No cards played. Tilt a little further next time - the phone needs to swing about 40° past vertical.</p>
      ) : (
        <ul className="review">
          {results.map((item, i) => (
            <li key={`${item.word}-${i}`}>
              <button className={`review-row${item.got ? ' hit' : ''}`} onClick={() => onToggle(i)}>
                <span className="review-mark">{item.got ? '✓' : '✕'}</span>
                <span className="review-word">{item.word}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length > 0 && <p className="hint">Tap any card to change the call.</p>}

      <div className="row">
        <button className="btn btn-big" style={skin(deck.color)} onClick={onAgain}>
          Play again
        </button>
        <button className="btn btn-quiet" onClick={onHome}>
          All decks
        </button>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * Editor
 * ------------------------------------------------------------------ */

function EditorScreen(props: {
  deck: Deck | null
  onSave: (deck: Deck) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const { deck, onSave, onDelete, onCancel } = props
  const [name, setName] = useState(deck?.name ?? '')
  const [emoji, setEmoji] = useState(deck?.emoji ?? '🃏')
  const [color, setColor] = useState(deck?.color ?? SWATCHES[6])
  const [description, setDescription] = useState(deck?.description ?? '')
  const [text, setText] = useState((deck?.words ?? []).join('\n'))
  const [error, setError] = useState('')

  const words = text
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean)

  const submit = () => {
    if (!name.trim()) {
      setError('Give the deck a name.')
      return
    }
    if (words.length < 4) {
      setError('Add at least four cards, one per line.')
      return
    }
    onSave({
      id: deck?.id ?? `${slug(name)}-${Date.now().toString(36)}`,
      name: name.trim(),
      emoji: emoji.trim() || '🃏',
      color,
      description: description.trim(),
      words,
      custom: true,
    })
  }

  const exportOne = () =>
    downloadJSON(`${slug(name || 'deck')}.json`, {
      decks: [{ id: deck?.id ?? slug(name), name, emoji, color, description, words }],
    })

  return (
    <main className="shell">
      <button className="link-btn back" onClick={onCancel}>
        ← Cancel
      </button>
      <h2 className="section-title">{deck ? 'Edit deck' : 'New deck'}</h2>

      <label className="field">
        <span>Deck name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Office in-jokes" maxLength={28} />
      </label>

      <div className="field-row">
        <label className="field field-narrow">
          <span>Emoji</span>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
        </label>
        <label className="field">
          <span>One-line description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" maxLength={48} />
        </label>
      </div>

      <div className="field">
        <span>Colour</span>
        <div className="swatches">
          {SWATCHES.map((hex) => (
            <button
              key={hex}
              className={`swatch${hex === color ? ' on' : ''}`}
              style={{ background: hex }}
              onClick={() => setColor(hex)}
              aria-label={`Use colour ${hex}`}
            />
          ))}
        </div>
      </div>

      <label className="field">
        <span>Cards · one per line · {words.length} so far</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={'Monday standup\nThe broken coffee machine\nDeploy on a Friday'}
        />
      </label>

      {error && <p className="notice error">{error}</p>}

      <div className="row">
        <button className="btn btn-big" style={skin(color)} onClick={submit}>
          Save deck
        </button>
        {words.length > 0 && (
          <button className="btn btn-quiet" onClick={exportOne}>
            Download as JSON
          </button>
        )}
        {onDelete && (
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
      <p className="hint">
        Saved decks live in this browser. Download the JSON and paste it into <code>public/decks.json</code> to ship it to
        everyone.
      </p>
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

function SettingsScreen(props: {
  settings: Settings
  tiltPermission: TiltPermission
  decks: Deck[]
  custom: Deck[]
  onChange: (patch: Partial<Settings>) => void
  onEnableTilt: () => void
  onImport: (decks: Deck[]) => void
  onClearBest: () => void
  onBack: () => void
}) {
  const { settings, tiltPermission, decks, custom, onChange, onEnableTilt, onImport, onClearBest, onBack } = props
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const handleFile = async (file: File) => {
    try {
      const parsed = normaliseDecks(JSON.parse(await file.text())).map((d) => ({ ...d, custom: true }))
      if (!parsed.length) {
        setMessage('That file has no usable decks.')
        return
      }
      onImport(parsed)
      setMessage(`Added ${parsed.length} deck${parsed.length === 1 ? '' : 's'}.`)
    } catch {
      setMessage('That file is not valid deck JSON.')
    }
  }

  return (
    <main className="shell">
      <button className="link-btn back" onClick={onBack}>
        ← All decks
      </button>
      <h2 className="section-title">Settings</h2>

      <div className="field">
        <span>Round length</span>
        <div className="choices">
          {[30, 60, 90, 120].map((value) => (
            <button
              key={value}
              className={`choice${settings.seconds === value ? ' on' : ''}`}
              onClick={() => onChange({ seconds: value })}
            >
              {value}s
            </button>
          ))}
        </div>
      </div>

      <button className="toggle" onClick={() => onChange({ sound: !settings.sound })}>
        <span>Sound</span>
        <span className={`pill${settings.sound ? ' on' : ''}`}>{settings.sound ? 'On' : 'Off'}</span>
      </button>

      <button className="toggle" onClick={() => onChange({ tilt: !settings.tilt })}>
        <span>Tilt controls</span>
        <span className={`pill${settings.tilt ? ' on' : ''}`}>{settings.tilt ? 'On' : 'Off'}</span>
      </button>

      {settings.tilt && tiltPermission === 'unknown' && (
        <button className="btn btn-quiet" onClick={onEnableTilt}>
          Allow motion access
        </button>
      )}
      {tiltPermission === 'unsupported' && <p className="hint">This device has no motion sensor, so tap controls are used.</p>}

      <h2 className="section-title">Decks</h2>
      <div className="row">
        <button
          className="btn btn-quiet"
          onClick={() => downloadJSON('decks.json', { decks: decks.map(({ custom: _c, ...rest }) => rest) })}
        >
          Export all decks
        </button>
        <button className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
          Import deck file
        </button>
        <button className="btn btn-quiet" onClick={onClearBest}>
          Reset best scores
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {message && <p className="notice">{message}</p>}
      <p className="hint">
        {custom.length} deck{custom.length === 1 ? '' : 's'} saved in this browser. Export them, drop the file into{' '}
        <code>public/decks.json</code>, and push to make them permanent for everyone.
      </p>
    </main>
  )
}
