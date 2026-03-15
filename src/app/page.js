"use client";
import React, { useState, useEffect, useRef } from 'react';

import { medicinesList } from '../lib/medicineData';

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function Home() {
    // 0: Topic Selection, 1: Time Selection, 2: Timer
    const [stage, setStage] = useState(0);
    const [selectedTopic, setSelectedTopic] = useState("");
    
    // Slot Reel Data
    const [reelTopics, setReelTopics] = useState([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const reelRef = useRef(null);

    // Timer State
    const [mainTimeRemaining, setMainTimeRemaining] = useState(0);
    const [mainTimeTotal, setMainTimeTotal] = useState(0);
    const [descTimeRemaining, setDescTimeRemaining] = useState(0);
    const [descTimeTotal, setDescTimeTotal] = useState(120);
    const [sessionPhase, setSessionPhase] = useState("focus"); // "focus" or "describe"
    const [isPaused, setIsPaused] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    
    // Timer Interval
    const timerRef = useRef(null);

    // Logic Initialization
    useEffect(() => {
        initSlotReel();
        return () => clearInterval(timerRef.current);
    }, []);

    function initSlotReel() {
        // Use the imported list and shuffle it to prepare the slot reel.
        const display = [...medicinesList, ...medicinesList, ...medicinesList].sort(() => 0.5 - Math.random());
        setReelTopics(display);
        setActiveIndex(-1);
        if (reelRef.current) {
            reelRef.current.style.transition = 'none';
            reelRef.current.style.transform = 'translateY(0)';
        }
    }

    const handleSpin = () => {
        setIsSpinning(true);
        const itemHeight = 40;
        // The slot machine is 120px tall, item is 40px. 
        // We want the item perfectly centered, so distance from top is (120-40)/2 = 40px offset.
        const paddingOffset = 40; 
        
        // Pick a random target in the middle chunk of the 3x concatenated array
        // We pick a target deep in the second block to ensure the spinner spins for a while.
        const baseLength = medicinesList.length;
        const targetIdx = baseLength + Math.floor(Math.random() * baseLength);
        const targetTopic = reelTopics[targetIdx];
        
        setSelectedTopic(targetTopic);
        
        const distance = -(targetIdx * itemHeight) + paddingOffset;
        
        if (reelRef.current) {
            reelRef.current.style.transition = 'none';
            reelRef.current.style.transform = 'translateY(0)';
            
            // Trigger reflow
            void reelRef.current.offsetWidth;
            
            reelRef.current.style.transition = 'transform 3s cubic-bezier(0.15, 0.85, 0.25, 1)';
            reelRef.current.style.transform = `translateY(${distance}px)`;
        }

        setTimeout(() => {
            setActiveIndex(targetIdx);
            
            setTimeout(() => {
                setStage(1);
                setIsSpinning(false);
                initSlotReel();
            }, 1500);
        }, 3000);
    };

    const handleRespin = () => {
        setStage(0);
    };

    const startSession = (minutes) => {
        const totalSecs = minutes * 60;
        const descSecs = Math.min(120, totalSecs);
        
        setMainTimeTotal(totalSecs);
        setMainTimeRemaining(totalSecs);
        setDescTimeTotal(descSecs);
        setDescTimeRemaining(descSecs);
        setSessionPhase("focus");
        setHasStarted(false);
        setIsPaused(true); // Technically paused until started
        setStage(2);
    };

    // Timer Tick
    useEffect(() => {
        if (stage === 2) {
            timerRef.current = setInterval(() => {
                if (!isPaused) {
                    if (sessionPhase === "focus") {
                        setMainTimeRemaining(prev => {
                            const next = prev - 1;
                            if (next <= 0) {
                                setSessionPhase("describe");
                                return 0;
                            }
                            return next;
                        });
                    } else if (sessionPhase === "describe") {
                        setDescTimeRemaining(prev => {
                            const next = prev - 1;
                            if (next <= 0) {
                                clearInterval(timerRef.current);
                                setTimeout(() => {
                                    alert("Study Session Complete! Excellent Work!");
                                    resetApp();
                                }, 100);
                                return 0;
                            }
                            return next;
                        });
                    }
                }
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [stage, sessionPhase, isPaused]);

    const resetApp = () => {
        setStage(0);
        setMainTimeRemaining(0);
        setDescTimeRemaining(0);
        setSessionPhase("focus");
        setHasStarted(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to end your study session early?")) {
            resetApp();
        }
    };

    const handleBack = () => {
        if (stage === 1) {
            setStage(0);
        } else if (stage === 2) {
            if (sessionPhase === "describe") {
                // If they are in describe phase, let them go back to time selection
                // (or they can just use the end session button)
                if (window.confirm("Go back to time selection? Your current describe session will end.")) {
                    resetApp();
                    setStage(1);
                }
            } else {
                if (window.confirm("Are you sure you want to end your focus timer and go back?")) {
                    resetApp();
                    setStage(1);
                }
            }
        }
    };

    const handleSkip = () => {
        if (sessionPhase === "focus") {
            setSessionPhase("describe");
            setMainTimeRemaining(0);
        }
    };

    // Derived states for styling
    const mainPercentDone = mainTimeTotal > 0 ? 1 - (mainTimeRemaining / mainTimeTotal) : 0;
    const mainOffset = 565.48 - (565.48 * mainPercentDone);
    
    // Don't show NaN issues if totally reset
    const displayMainOffset = isNaN(mainOffset) ? 0 : mainOffset;
    
    const descPercent = descTimeTotal > 0 ? (descTimeRemaining / descTimeTotal) * 100 : 0;

    return (
        <>
            <div className="background-elements">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="glass-panel" id="main-container">
                {/* Global Back Button */}
                {stage > 0 && (
                    <button className="back-btn" onClick={handleBack} aria-label="Go Back">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Stage 1: Topic Selection */}
                <div className={`stage ${stage === 0 ? 'active' : 'hidden'}`}>
                    <h1 style={{ marginTop: '0.5rem' }}>What are we studying today?</h1>
                    <p className="subtitle">Let fate decide your next topic.</p>
                    
                    <div className="slot-machine">
                        <div className="slot-window">
                            <ul className="slot-reel" ref={reelRef}>
                                {reelTopics.map((t, idx) => (
                                    <li key={idx} className={`slot-item ${idx === activeIndex ? 'active-item' : ''}`}>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="slot-fade top-fade"></div>
                        <div className="slot-fade bottom-fade"></div>
                    </div>
                    
                    <button 
                        className="btn primary-btn glow-effect" 
                        onClick={handleSpin}
                        disabled={isSpinning}
                    >
                        {isSpinning ? "Rolling..." : "Spin to Decide"}
                    </button>
                </div>

                {/* Stage 2: Time Selection */}
                <div className={`stage ${stage === 1 ? 'active' : 'hidden'}`}>
                    <h2 style={{ marginTop: '0.5rem' }}>You rolled: <br/><span className="highlight text-gradient">{selectedTopic}</span></h2>
                    <p className="subtitle">How long do you want to study?</p>
                    
                    <div className="time-presets">
                        <button className="btn preset-btn" onClick={() => startSession(5)}>5 Min</button>
                        <button className="btn preset-btn" onClick={() => startSession(10)}>10 Min</button>
                        <button className="btn preset-btn" onClick={() => startSession(15)}>15 Min</button>
                        <button className="btn preset-btn" onClick={() => startSession(30)}>30 Min</button>
                        <button className="btn preset-btn" onClick={() => startSession(45)}>45 Min</button>
                    </div>
                    <button className="btn link-btn" onClick={handleRespin}>Respin</button>
                </div>

                {/* Stage 3: Timer */}
                <div className={`stage ${stage === 2 ? 'active' : 'hidden'}`}>
                    <h2 className="highlight text-gradient" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{selectedTopic}</h2>
                    
                    {sessionPhase === "focus" && (
                        <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(selectedTopic + ' medicine details')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn link-btn"
                            style={{ margin: '0 auto 1.5rem auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            Wanna see the content?
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                    
                    <div className="timers-container">
                        {sessionPhase === "focus" && (
                            <div className="timer-card main-timer">
                                <h3>Focus Time</h3>
                                <svg className="progress-ring" width="200" height="200">
                                    <circle className="progress-ring__circle-bg" stroke="rgba(0,0,0,0.06)" strokeWidth="8" fill="transparent" r="90" cx="100" cy="100"/>
                                    <circle 
                                        className="progress-ring__circle" 
                                        stroke="url(#gradient-main)" 
                                        strokeWidth="8" 
                                        fill="transparent" 
                                        r="90" 
                                        cx="100" 
                                        cy="100"
                                        style={{ strokeDashoffset: displayMainOffset }}
                                    />
                                    <defs>
                                        <linearGradient id="gradient-main" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#0284c7" />
                                            <stop offset="100%" stopColor="#0ea5e9" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="time-display">{formatTime(mainTimeRemaining)}</div>
                            </div>
                        )}

                        {sessionPhase === "describe" && (
                            <div className="timer-card secondary-timer">
                                <h3>Describe It!</h3>
                                <p className="timer-hint">
                                    Briefly explain what you recall
                                </p>
                                <div className="time-display small">{formatTime(descTimeRemaining)}</div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${descPercent}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="controls" style={{ flexWrap: 'wrap' }}>
                        {!hasStarted ? (
                            <button className="btn primary-btn glow-effect" onClick={() => { setHasStarted(true); setIsPaused(false); }} style={{ fontSize: '1.2rem', padding: '1rem', width: '100%' }}>
                                ▶ Start Focus Session
                            </button>
                        ) : (
                            <>
                                <button className="btn secondary-btn" onClick={handlePause}>
                                    {isPaused ? "Resume" : "Pause"}
                                </button>
                                {sessionPhase === "focus" && (
                                    <button className="btn secondary-btn" onClick={handleSkip}>Skip to Describe</button>
                                )}
                                <button className="btn danger-btn" onClick={handleCancel}>End Session</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
