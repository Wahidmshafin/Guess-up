import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Deck, GamePhase, CardResult, GameSettings } from './types';
import {
  getStoredDecks,
  saveOrUpdateDeck,
  deleteDeckById,
  resetToFactoryDefaults,
  exportDecksAsJSON,
  importDecksFromJSON
} from './decks';
import { soundFx } from './audio';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import './App.css';

const DEFAULT_SETTINGS: GameSettings = {
  roundDuration: 60,
  soundEnabled: true,
  tiltSensitivity: 'medium',
  hapticsEnabled: true,
};

const COLOR_OPTIONS = [
  { name: 'Purple Sunset', value: 'from-purple-600 to-indigo-600' },
  { name: 'Amber Blaze', value: 'from-amber-500 to-rose-600' },
  { name: 'Emerald Forest', value: 'from-emerald-500 to-teal-700' },
  { name: 'Neon Pink', value: 'from-pink-500 to-rose-500' },
  { name: 'Ocean Blue', value: 'from-blue-600 to-cyan-600' },
  { name: 'Retro Disco', value: 'from-fuchsia-500 to-cyan-500' },
  { name: 'Solar Flare', value: 'from-yellow-400 to-orange-600' },
  { name: 'Midnight Violet', value: 'from-violet-800 to-fuchsia-900' },
];

const EMOJI_PRESETS = ['🎬', '🦁', '🎭', '🌟', '🍕', '🎸', '🎮', '🌍', '🎈', '⚡', '🏆', '🔥', '🚀', '🧙‍♂️', '🍔', '👻'];

export function App() {
  // --- Persistent State ---
  const [decks, setDecks] = useState<Deck[]>(() => getStoredDecks());
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('guess_up_settings_v1');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // --- Game Flow State ---
  const [phase, setPhase] = useState<GamePhase>('home');
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(settings.roundDuration);
  const [deckCards, setDeckCards] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [roundResults, setRoundResults] = useState<CardResult[]>([]);
  const [flashFeedback, setFlashFeedback] = useState<'correct' | 'pass' | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [resultsFilter, setResultsFilter] = useState<'all' | 'correct' | 'passed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Explorer & Filter State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // --- Custom Deck Creator State ---
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckFormTitle, setDeckFormTitle] = useState<string>('');
  const [deckFormDesc, setDeckFormDesc] = useState<string>('');
  const [deckFormIcon, setDeckFormIcon] = useState<string>('🎉');
  const [deckFormColor, setDeckFormColor] = useState<string>(COLOR_OPTIONS[0].value);
  const [deckFormCategory, setDeckFormCategory] = useState<string>('Custom');
  const [deckFormCardsText, setDeckFormCardsText] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // --- Raw JSON Editor State ---
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccessMsg, setJsonSuccessMsg] = useState<string | null>(null);

  // --- Sound Sync ---
  useEffect(() => {
    soundFx.enabled = settings.soundEnabled;
    try {
      localStorage.setItem('guess_up_settings_v1', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // --- Device Motion Tilt Hook ---
  const handleTiltAction = (action: 'correct' | 'pass') => {
    if (phase === 'playing' && !isPaused) {
      if (action === 'correct') {
        handleCardAnswer('correct');
      } else if (action === 'pass') {
        handleCardAnswer('pass');
      }
    }
  };

  const { isSupported: gyroSupported, hasPermission: gyroPermission, requestPermission } = useDeviceOrientation({
    enabled: phase === 'playing',
    sensitivity: settings.tiltSensitivity,
    haptics: settings.hapticsEnabled,
    onTiltAction: handleTiltAction,
  });

  // --- Filtered Decks ---
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    decks.forEach(d => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return decks.filter(d => {
      const matchCat = selectedCategory === 'All' || d.category === selectedCategory;
      const matchSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [decks, selectedCategory, searchQuery]);

  // --- Shuffling Deck Cards ---
  const shuffleCards = (cards: string[]): string[] => {
    const arr = [...cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // --- Start Game Flow ---
  const handleSelectDeck = (deck: Deck) => {
    soundFx.playTap();
    if (deck.cards.length === 0) {
      showToast('This deck has no cards! Add words to play.');
      return;
    }
    setActiveDeck(deck);
    setDeckCards(shuffleCards(deck.cards));
    setCurrentCardIndex(0);
    setRoundResults([]);
    setTimeLeft(settings.roundDuration);
    setCountdown(3);
    setPhase('countdown');
  };

  // --- 3-2-1 Countdown Timer ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'countdown') {
      soundFx.playCountdownBeep(countdown === 1);
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(prev => prev - 1);
        }, 1000);
      } else {
        // Go!
        soundFx.playCountdownBeep(true);
        setPhase('playing');
      }
    }
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // --- Active Round Game Timer ---
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'playing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            soundFx.playTimeUpSound();
            setPhase('gameover');
            return 0;
          }
          if (prev <= 10) {
            soundFx.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused]);

  // --- Card Guess Processing (Correct / Pass) ---
  const handleCardAnswer = (action: 'correct' | 'pass') => {
    if (phase !== 'playing' || isPaused) return;

    const currentCard = deckCards[currentCardIndex];
    if (!currentCard) return;

    // Play Audio & Flash FX
    if (action === 'correct') {
      soundFx.playCorrectSound();
      setFlashFeedback('correct');
    } else {
      soundFx.playPassSound();
      setFlashFeedback('pass');
    }

    setTimeout(() => setFlashFeedback(null), 400);

    // Record Result
    setRoundResults(prev => [
      ...prev,
      {
        text: currentCard,
        status: action === 'correct' ? 'correct' : 'passed',
        timestamp: Date.now(),
      },
    ]);

    // Advance Card or End Round if out of cards
    if (currentCardIndex + 1 < deckCards.length) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Shuffled through all cards in deck
      soundFx.playTimeUpSound();
      setPhase('gameover');
    }
  };

  // --- Desktop Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleCardAnswer('correct');
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault();
        handleCardAnswer('pass');
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentCardIndex, deckCards, isPaused]);

  // --- Fullscreen Toggle Helper ---
  const toggleFullScreen = () => {
    soundFx.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // --- Custom Deck Creator Handlers ---
  const handleOpenCreateDeck = (deckToEdit?: Deck) => {
    soundFx.playTap();
    if (deckToEdit) {
      setEditingDeckId(deckToEdit.id);
      setDeckFormTitle(deckToEdit.title);
      setDeckFormDesc(deckToEdit.description);
      setDeckFormIcon(deckToEdit.icon || '🎉');
      setDeckFormColor(deckToEdit.color || COLOR_OPTIONS[0].value);
      setDeckFormCategory(deckToEdit.category || 'Custom');
      setDeckFormCardsText(deckToEdit.cards.join('\n'));
    } else {
      setEditingDeckId(null);
      setDeckFormTitle('');
      setDeckFormDesc('');
      setDeckFormIcon('🎉');
      setDeckFormColor(COLOR_OPTIONS[0].value);
      setDeckFormCategory('Custom');
      setDeckFormCardsText('');
    }
    setFormError(null);
    setPhase('create-deck');
  };

  const handleSaveDeckForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckFormTitle.trim()) {
      setFormError('Please provide a title for the deck.');
      return;
    }

    // Split words by lines or commas
    const parsedCards = deckFormCardsText
      .split(/[\n,]/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (parsedCards.length === 0) {
      setFormError('Please add at least one word/card to your deck.');
      return;
    }

    // Deduplicate while preserving case
    const uniqueCards = Array.from(new Set(parsedCards));

    const newDeck: Deck = {
      id: editingDeckId || `custom-${Date.now()}`,
      title: deckFormTitle.trim(),
      description: deckFormDesc.trim() || `${uniqueCards.length} exciting cards`,
      icon: deckFormIcon.trim() || '🎉',
      color: deckFormColor,
      category: deckFormCategory.trim() || 'Custom',
      isCustom: true,
      cards: uniqueCards,
    };

    const updated = saveOrUpdateDeck(newDeck);
    setDecks(updated);
    showToast(editingDeckId ? 'Deck updated successfully!' : 'Custom deck created!');
    setPhase('home');
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playTap();
    if (confirm('Are you sure you want to delete this deck?')) {
      const updated = deleteDeckById(id);
      setDecks(updated);
      showToast('Deck deleted.');
    }
  };

  // --- JSON Data Storage & Editor Handlers ---
  const handleOpenJsonEditor = () => {
    soundFx.playTap();
    setRawJsonText(exportDecksAsJSON(decks));
    setJsonError(null);
    setJsonSuccessMsg(null);
    setPhase('json-editor');
  };

  const handleSaveRawJson = () => {
    soundFx.playTap();
    const result = importDecksFromJSON(rawJsonText);
    if (!result.success || !result.decks) {
      setJsonError(result.error || 'Failed to parse JSON.');
      setJsonSuccessMsg(null);
    } else {
      setDecks(result.decks);
      setJsonError(null);
      setJsonSuccessMsg('All decks updated successfully from JSON!');
      showToast('Decks saved from JSON!');
    }
  };

  const handleCopyJson = async () => {
    soundFx.playTap();
    try {
      await navigator.clipboard.writeText(rawJsonText);
      showToast('JSON copied to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard.');
    }
  };

  const handleDownloadJsonBackup = () => {
    soundFx.playTap();
    const blob = new Blob([rawJsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guess-up-decks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup file downloaded!');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        setRawJsonText(text);
        const result = importDecksFromJSON(text);
        if (!result.success || !result.decks) {
          setJsonError(`Invalid file format: ${result.error}`);
        } else {
          setDecks(result.decks);
          setJsonError(null);
          setJsonSuccessMsg(`Successfully imported ${result.decks.length} decks from file!`);
          showToast(`Imported ${result.decks.length} decks!`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetFactoryDefaults = () => {
    soundFx.playTap();
    if (confirm('Reset all decks to original factory defaults? Any custom decks will be removed.')) {
      const defaults = resetToFactoryDefaults();
      setDecks(defaults);
      setRawJsonText(exportDecksAsJSON(defaults));
      setJsonSuccessMsg('Decks reset to factory defaults.');
      showToast('Reset to defaults.');
    }
  };

  // --- Score Calculation ---
  const correctCount = useMemo(() => roundResults.filter(r => r.status === 'correct').length, [roundResults]);
  const passedCount = useMemo(() => roundResults.filter(r => r.status === 'passed').length, [roundResults]);

  const scoreRating = useMemo(() => {
    if (correctCount >= 18) return { label: '🔥 Godlike Guessers!', desc: 'Mind-reading levels of party teamwork!' };
    if (correctCount >= 12) return { label: '🏆 Party Legends!', desc: 'Outstanding speed and clues!' };
    if (correctCount >= 8) return { label: '🌟 Great Performance!', desc: 'Super fun round, well played!' };
    if (correctCount >= 4) return { label: '👏 Nice Effort!', desc: 'Getting warm! Warm up for another round!' };
    return { label: '😄 Good Practice!', desc: 'Shake it off and try again!' };
  }, [correctCount]);

  const handleShareScore = async () => {
    soundFx.playTap();
    const shareText = `🎭 Guess Up! Result\nDeck: ${activeDeck?.title}\nScore: ${correctCount} Correct | ${passedCount} Passed in ${settings.roundDuration}s!\nPlay at: ${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Guess Up Score!',
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('Score copied to clipboard!');
      } catch {
        showToast('Could not share score.');
      }
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && <div className="toast-banner">{toastMessage}</div>}

      {/* ======================================================== */}
      {/* 1. HOME / DECK SELECTION SCREEN                           */}
      {/* ======================================================== */}
      {phase === 'home' && (
        <div className="home-screen">
          {/* Header */}
          <header className="home-header">
            <div className="brand-group">
              <div className="brand-logo">🎉</div>
              <div>
                <h1 className="brand-title">Guess Up!</h1>
                <p className="brand-subtitle">The Ultimate Heads Up Party Game</p>
              </div>
            </div>

            <div className="header-actions">
              <button
                className="btn-pill btn-primary-gradient"
                onClick={() => handleOpenCreateDeck()}
                title="Create a new custom deck"
              >
                <span>➕</span> Custom Deck
              </button>

              <button
                className="btn-icon"
                onClick={handleOpenJsonEditor}
                title="Decks Storage & JSON Editor"
                aria-label="Decks Storage & JSON Editor"
              >
                📁
              </button>

              <button
                className="btn-icon"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('settings');
                }}
                title="Game Settings"
                aria-label="Game Settings"
              >
                ⚙️
              </button>

              <button
                className="btn-icon"
                onClick={toggleFullScreen}
                title="Toggle Fullscreen"
                aria-label="Toggle Fullscreen"
              >
                ⛶
              </button>
            </div>
          </header>

          {/* Quick Stats / Info Banner */}
          <section className="info-banner">
            <div className="info-badge">
              <span className="badge-icon">⏱️</span>
              <span>Round: <strong>{settings.roundDuration}s</strong></span>
            </div>
            <div className="info-badge">
              <span className="badge-icon">📱</span>
              <span>Tilt Down = <strong>Correct 🟢</strong></span>
            </div>
            <div className="info-badge">
              <span className="badge-icon">🔄</span>
              <span>Tilt Up = <strong>Pass 🟡</strong></span>
            </div>
          </section>

          {/* Search & Category Filter */}
          <section className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search decks & categories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="category-chips">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                    soundFx.playTap();
                    setSelectedCategory(cat);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Decks Grid */}
          <main className="decks-grid">
            {filteredDecks.map(deck => (
              <div
                key={deck.id}
                className="deck-card"
                onClick={() => handleSelectDeck(deck)}
                tabIndex={0}
                role="button"
                onKeyDown={e => e.key === 'Enter' && handleSelectDeck(deck)}
              >
                <div className={`deck-header-gradient bg-gradient-to-br ${deck.color || COLOR_OPTIONS[0].value}`}>
                  <span className="deck-icon">{deck.icon || '🎉'}</span>
                  {deck.isCustom && <span className="custom-tag">Custom</span>}
                </div>

                <div className="deck-body">
                  <h3 className="deck-title">{deck.title}</h3>
                  <p className="deck-desc">{deck.description}</p>

                  <div className="deck-footer">
                    <span className="deck-count">
                      🃏 {deck.cards.length} cards
                    </span>

                    <div className="deck-buttons">
                      {deck.isCustom && (
                        <>
                          <button
                            className="btn-card-action"
                            title="Edit Deck"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenCreateDeck(deck);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-card-action danger"
                            title="Delete Deck"
                            onClick={e => handleDeleteDeck(deck.id, e)}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      <button className="btn-play">
                        Play ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredDecks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No decks found</h3>
                <p>Try searching for something else or create your own custom deck!</p>
                <button className="btn-primary" onClick={() => handleOpenCreateDeck()}>
                  ➕ Create New Deck
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRE-ROUND COUNTDOWN / PLACE ON FOREHEAD SCREEN         */}
      {/* ======================================================== */}
      {phase === 'countdown' && activeDeck && (
        <div className="countdown-screen">
          <div className="countdown-card">
            <div className="forehead-illustration">
              <div className="phone-icon-anim">📱</div>
              <div className="pulse-waves"></div>
            </div>

            <h2 className="countdown-prompt">Place phone on your forehead!</h2>
            <p className="countdown-deck-title">Deck: <strong>{activeDeck.title}</strong></p>

            <div className="countdown-number-box">
              <span className="countdown-number">{countdown > 0 ? countdown : 'GO!'}</span>
            </div>

            <div className="countdown-hints">
              <div className="hint-pill correct">
                <span>🟢</span> Nod Down = <strong>CORRECT</strong>
              </div>
              <div className="hint-pill pass">
                <span>🟡</span> Tilt Up = <strong>PASS</strong>
              </div>
            </div>

            {!gyroPermission && gyroSupported && (
              <button
                className="btn-permission"
                onClick={async () => {
                  await requestPermission();
                }}
              >
                🔔 Enable Motion Sensor (iOS)
              </button>
            )}

            <button
              className="btn-cancel"
              onClick={() => {
                soundFx.playTap();
                setPhase('home');
              }}
            >
              Cancel Round
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ACTIVE GAMEPLAY SCREEN                                 */}
      {/* ======================================================== */}
      {phase === 'playing' && activeDeck && (
        <div className={`gameplay-screen ${flashFeedback ? `flash-${flashFeedback}` : ''}`}>
          {/* Top HUD */}
          <div className="game-hud">
            <div className="hud-left">
              <div className="timer-badge">
                <span className="timer-icon">⏱️</span>
                <span className={`timer-val ${timeLeft <= 10 ? 'urgent' : ''}`}>{timeLeft}s</span>
              </div>
              <div className="score-badge">
                <span className="score-icon">🟢</span>
                <span className="score-val">{correctCount}</span>
              </div>
            </div>

            <div className="hud-center">
              <span className="deck-badge">{activeDeck.icon} {activeDeck.title}</span>
            </div>

            <div className="hud-right">
              <button
                className="btn-hud"
                onClick={() => setIsPaused(p => !p)}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                className="btn-hud danger"
                onClick={() => {
                  soundFx.playTimeUpSound();
                  setPhase('gameover');
                }}
                title="Finish Round"
              >
                Finish ⏹
              </button>
            </div>
          </div>

          {/* Pause Overlay */}
          {isPaused && (
            <div className="pause-overlay">
              <h2>⏸ Game Paused</h2>
              <p>Press Space or tap Resume to continue.</p>
              <button className="btn-primary" onClick={() => setIsPaused(false)}>
                Resume Game
              </button>
            </div>
          )}

          {/* Word Card Display */}
          <div className="card-stage">
            <div className="word-card-container">
              <div className="word-card">
                <h1 className="target-word">
                  {deckCards[currentCardIndex] || 'All Done!'}
                </h1>
                <p className="card-progress">
                  Card {currentCardIndex + 1} of {deckCards.length}
                </p>
              </div>
            </div>
          </div>

          {/* Touch Zones / Visual Action Guides */}
          <div className="touch-zones">
            <div
              className="touch-zone pass-zone"
              onClick={() => handleCardAnswer('pass')}
            >
              <div className="zone-indicator">
                <span className="zone-icon">🟡</span>
                <span className="zone-text">PASS</span>
                <span className="zone-sub">(Tap Left / Tilt Up)</span>
              </div>
            </div>

            <div
              className="touch-zone correct-zone"
              onClick={() => handleCardAnswer('correct')}
            >
              <div className="zone-indicator">
                <span className="zone-icon">🟢</span>
                <span className="zone-text">CORRECT</span>
                <span className="zone-sub">(Tap Right / Tilt Down)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GAME OVER & ROUND SUMMARY SCREEN                       */}
      {/* ======================================================== */}
      {phase === 'gameover' && activeDeck && (
        <div className="gameover-screen">
          <div className="gameover-container">
            <div className="results-header">
              <div className="score-ring">
                <span className="score-huge">{correctCount}</span>
                <span className="score-label">POINTS</span>
              </div>

              <h2 className="rating-title">{scoreRating.label}</h2>
              <p className="rating-desc">{scoreRating.desc}</p>
              <p className="deck-played-title">Deck: <strong>{activeDeck.icon} {activeDeck.title}</strong></p>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-row">
              <div className="stat-card correct">
                <span className="stat-icon">🟢</span>
                <span className="stat-num">{correctCount}</span>
                <span className="stat-name">Correct</span>
              </div>
              <div className="stat-card passed">
                <span className="stat-icon">🟡</span>
                <span className="stat-num">{passedCount}</span>
                <span className="stat-name">Passed</span>
              </div>
              <div className="stat-card total">
                <span className="stat-icon">🃏</span>
                <span className="stat-num">{roundResults.length}</span>
                <span className="stat-name">Total Seen</span>
              </div>
            </div>

            {/* Filter Tabs for Answers */}
            <div className="results-tab-bar">
              <button
                className={`tab-btn ${resultsFilter === 'all' ? 'active' : ''}`}
                onClick={() => setResultsFilter('all')}
              >
                All Cards ({roundResults.length})
              </button>
              <button
                className={`tab-btn ${resultsFilter === 'correct' ? 'active' : ''}`}
                onClick={() => setResultsFilter('correct')}
              >
                Correct ({correctCount})
              </button>
              <button
                className={`tab-btn ${resultsFilter === 'passed' ? 'active' : ''}`}
                onClick={() => setResultsFilter('passed')}
              >
                Passed ({passedCount})
              </button>
            </div>

            {/* Cards List Breakdown */}
            <div className="results-card-list">
              {roundResults
                .filter(r => resultsFilter === 'all' || r.status === resultsFilter)
                .map((item, idx) => (
                  <div key={idx} className={`result-item ${item.status}`}>
                    <span className="result-status-icon">
                      {item.status === 'correct' ? '✅' : '⏭️'}
                    </span>
                    <span className="result-word-text">{item.text}</span>
                    <span className="result-tag">{item.status.toUpperCase()}</span>
                  </div>
                ))}
              {roundResults.length === 0 && (
                <div className="no-results-msg">No cards were answered in this round.</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="results-actions">
              <button
                className="btn-action-primary"
                onClick={() => handleSelectDeck(activeDeck)}
              >
                🔄 Play Again
              </button>

              <button
                className="btn-action-secondary"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('home');
                }}
              >
                🏠 Choose Deck
              </button>

              <button
                className="btn-action-share"
                onClick={handleShareScore}
              >
                📤 Share Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CUSTOM DECK CREATOR MODAL                             */}
      {/* ======================================================== */}
      {phase === 'create-deck' && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingDeckId ? '✏️ Edit Custom Deck' : '✨ Create Custom Deck'}</h2>
              <button
                className="btn-close"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('home');
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeckForm} className="deck-form">
              {formError && <div className="form-error-banner">{formError}</div>}

              <div className="form-group">
                <label>Deck Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 90s Disney Characters, Marvel Heroes, Inside Jokes"
                  value={deckFormTitle}
                  onChange={e => setDeckFormTitle(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emoji Icon</label>
                  <div className="emoji-picker-group">
                    <input
                      type="text"
                      className="form-input icon-input"
                      value={deckFormIcon}
                      onChange={e => setDeckFormIcon(e.target.value)}
                      maxLength={4}
                    />
                    <div className="emoji-presets">
                      {EMOJI_PRESETS.map(em => (
                        <button
                          type="button"
                          key={em}
                          className="emoji-btn"
                          onClick={() => setDeckFormIcon(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Friends, Family, Party, Anime"
                    value={deckFormCategory}
                    onChange={e => setDeckFormCategory(e.target.value)}
                    maxLength={25}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Color Theme</label>
                <div className="color-grid">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      type="button"
                      key={c.name}
                      className={`color-chip bg-gradient-to-r ${c.value} ${
                        deckFormColor === c.value ? 'selected' : ''
                      }`}
                      onClick={() => setDeckFormColor(c.value)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Short summary for your deck"
                  value={deckFormDesc}
                  onChange={e => setDeckFormDesc(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <div className="label-with-count">
                  <label>Cards / Words List *</label>
                  <span className="words-counter">
                    {deckFormCardsText.split(/[\n,]/).filter(s => s.trim().length > 0).length} cards added
                  </span>
                </div>
                <p className="form-hint">
                  Enter words or phrases separated by a new line or commas.
                </p>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder={`Woody\nBuzz Lightyear\nMr. Potato Head\nRex\nSlinky Dog`}
                  value={deckFormCardsText}
                  onChange={e => setDeckFormCardsText(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    soundFx.playTap();
                    setPhase('home');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  💾 Save Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. RAW JSON DECK STORAGE & EDITOR MODAL                  */}
      {/* ======================================================== */}
      {phase === 'json-editor' && (
        <div className="modal-backdrop">
          <div className="modal-content json-modal">
            <div className="modal-header">
              <div>
                <h2>📁 Decks Storage & JSON Editor</h2>
                <p className="modal-subtitle">
                  Edit, backup, or import all your decks directly in raw JSON format.
                </p>
              </div>
              <button
                className="btn-close"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('home');
                }}
              >
                ✕
              </button>
            </div>

            {jsonError && <div className="form-error-banner">❌ {jsonError}</div>}
            {jsonSuccessMsg && <div className="form-success-banner">✅ {jsonSuccessMsg}</div>}

            <div className="json-toolbar">
              <button className="btn-tool" onClick={handleCopyJson} title="Copy JSON">
                📋 Copy
              </button>
              <button className="btn-tool" onClick={handleDownloadJsonBackup} title="Download Backup">
                📥 Download Backup (.json)
              </button>
              <label className="btn-tool file-btn" title="Import JSON File">
                📤 Import File
                <input type="file" accept=".json" onChange={handleImportJsonFile} style={{ display: 'none' }} />
              </label>
              <button className="btn-tool danger" onClick={handleResetFactoryDefaults} title="Reset to Defaults">
                🔄 Reset Defaults
              </button>
            </div>

            <div className="json-editor-container">
              <textarea
                className="json-textarea"
                value={rawJsonText}
                onChange={e => {
                  setRawJsonText(e.target.value);
                  setJsonError(null);
                  setJsonSuccessMsg(null);
                }}
                rows={16}
                spellCheck={false}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('home');
                }}
              >
                Close
              </button>
              <button className="btn-primary" onClick={handleSaveRawJson}>
                💾 Save & Apply JSON Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SETTINGS MODAL                                        */}
      {/* ======================================================== */}
      {phase === 'settings' && (
        <div className="modal-backdrop">
          <div className="modal-content settings-modal">
            <div className="modal-header">
              <h2>⚙️ Game Settings</h2>
              <button
                className="btn-close"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('home');
                }}
              >
                ✕
              </button>
            </div>

            <div className="settings-body">
              {/* Round Duration */}
              <div className="setting-row">
                <div>
                  <label className="setting-label">Round Duration</label>
                  <p className="setting-desc">How many seconds each round lasts</p>
                </div>
                <div className="setting-options">
                  {[30, 60, 90, 120].map(dur => (
                    <button
                      key={dur}
                      className={`btn-option ${settings.roundDuration === dur ? 'active' : ''}`}
                      onClick={() => {
                        soundFx.playTap();
                        setSettings(s => ({ ...s, roundDuration: dur }));
                      }}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound FX Toggle */}
              <div className="setting-row">
                <div>
                  <label className="setting-label">Sound Effects</label>
                  <p className="setting-desc">Chimes, countdown beeps, and buzzer</p>
                </div>
                <button
                  className={`toggle-switch ${settings.soundEnabled ? 'on' : 'off'}`}
                  onClick={() => {
                    setSettings(s => {
                      const next = !s.soundEnabled;
                      soundFx.enabled = next;
                      if (next) soundFx.playCorrectSound();
                      return { ...s, soundEnabled: next };
                    });
                  }}
                >
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{settings.soundEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Haptic Vibrations */}
              <div className="setting-row">
                <div>
                  <label className="setting-label">Haptic Vibration</label>
                  <p className="setting-desc">Vibrate phone on correct / pass tilt</p>
                </div>
                <button
                  className={`toggle-switch ${settings.hapticsEnabled ? 'on' : 'off'}`}
                  onClick={() => {
                    soundFx.playTap();
                    setSettings(s => ({ ...s, hapticsEnabled: !s.hapticsEnabled }));
                  }}
                >
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{settings.hapticsEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Tilt Sensitivity */}
              <div className="setting-row">
                <div>
                  <label className="setting-label">Motion Tilt Sensitivity</label>
                  <p className="setting-desc">Adjust how far to nod for tilt detection</p>
                </div>
                <div className="setting-options">
                  {(['low', 'medium', 'high'] as const).map(sens => (
                    <button
                      key={sens}
                      className={`btn-option ${settings.tiltSensitivity === sens ? 'active' : ''}`}
                      onClick={() => {
                        soundFx.playTap();
                        setSettings(s => ({ ...s, tiltSensitivity: sens }));
                      }}
                    >
                      {sens.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gyroscope Status */}
              <div className="gyro-status-box">
                <span className="gyro-icon">{gyroSupported ? '✅' : 'ℹ️'}</span>
                <span>
                  {gyroSupported
                    ? 'Device Orientation & Gyroscope supported on your device.'
                    : 'Device Orientation not detected (use screen touch buttons or keyboard).'}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => {
                  soundFx.playTap();
                  setPhase('home');
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
