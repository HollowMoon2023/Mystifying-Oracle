
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { OuijaBoard } from './components/OuijaBoard';
import { Controls } from './components/Controls';
import Jumpscare from './components/Jumpscare';
import PersonaSelector from './components/PersonaSelector';
import { askSpirit, resetSpiritConversation } from './services/geminiService';
import { soundService } from './services/soundService';
import { generatePersona } from './services/personaService';
import type { CharPosition, Persona } from './types';
import { BOARD_CHARS, ANIMATION_DELAY, CHAR_MOVE_DURATION } from './constants';

type AppState = 'idle' | 'thinking' | 'spelling' | 'error';
type JumpscareType = 'random' | 'triggered';

const App: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [displayedAnswer, setDisplayedAnswer] = useState<string>('');
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [planchettePosition, setPlanchettePosition] = useState<CharPosition>({ top: '50%', left: '50%' });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [jumpscareType, setJumpscareType] = useState<JumpscareType | null>(null);
  const [is67Flashing, setIs67Flashing] = useState<boolean>(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showPersonaSelector, setShowPersonaSelector] = useState<boolean>(false);
  const [personaOptions, setPersonaOptions] = useState<Persona[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(false);
  
  const charPositions = useRef<Map<string, CharPosition>>(new Map());
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundInitialized = useRef<boolean>(false);
  const flashCooldownRef = useRef<boolean>(false);
  const prevQuestionRef = useRef(question);

  const getRestingPosition = useCallback(() => {
    const board = document.getElementById('ouija-board');
    if (board) {
      return {
        top: `${board.clientHeight * 0.45}px`,
        left: `${board.clientWidth / 2 - 50}px`
      };
    }
    return { top: '50%', left: '50%' };
  }, []);

  const resetState = useCallback(() => {
    setAppState('idle');
    setQuestion('');
    if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
    }
    setTimeout(() => {
      setPlanchettePosition(getRestingPosition());
    }, 500);
  }, [getRestingPosition]);

  useEffect(() => {
    // Initial persona generation
    const fetchInitialPersona = async () => {
        const persona = await generatePersona();
        setSelectedPersona(persona);
    };
    fetchInitialPersona();
  }, []);

  useEffect(() => {
     if (selectedPersona) { // Only position planchette after a spirit has been summoned
        setTimeout(() => setPlanchettePosition(getRestingPosition()), 100);
     }
  }, [selectedPersona, getRestingPosition]);

  useEffect(() => {
    const initializeAudio = () => {
      if (!soundInitialized.current) {
        const success = soundService.init();
        if (success) {
          soundInitialized.current = true;
          if (!isMuted) {
            soundService.play('startAmbient');
          }
        }
      }
      window.removeEventListener('click', initializeAudio);
      window.removeEventListener('keydown', initializeAudio);
    };

    window.addEventListener('click', initializeAudio);
    window.addEventListener('keydown', initializeAudio);

    return () => {
      window.removeEventListener('click', initializeAudio);
      window.removeEventListener('keydown', initializeAudio);
    };
  }, [isMuted]);


  useEffect(() => {
    const questionLower = question.toLowerCase().trim();
    if (questionLower.includes('jumpscare')) {
      setJumpscareType('triggered');
      setQuestion('');
    } else if (questionLower === '67 mangos') {
      setShowPersonaSelector(true);
      setQuestion('');
      soundService.play('emphasis');
    } else if (questionLower === 'goodbye') {
        setQuestion(''); // Clear input immediately

        const changePersona = async () => {
            setDisplayedAnswer("A spirit departs...");
            soundService.play('emphasis');
            
            resetState();
            resetSpiritConversation();
            setError(null);
            
            const newPersona = await generatePersona();
            setSelectedPersona(newPersona);
            setDisplayedAnswer("A new spirit has arrived.");
            
            setTimeout(() => {
                if (!error) setDisplayedAnswer('');
            }, 2000);
        };
        changePersona();
    }
  }, [question, resetState, error]);
  
  useEffect(() => {
    if (showPersonaSelector && personaOptions.length === 0) {
      const fetchOptions = async () => {
        setIsLoadingOptions(true);
        try {
          const promises = [generatePersona(), generatePersona(), generatePersona()];
          const newPersonas = await Promise.all(promises);
          setPersonaOptions(newPersonas);
        } catch (e) {
          console.error("Failed to generate persona options", e);
          setShowPersonaSelector(false);
          setError("The spirits are not gathering now.");
        } finally {
          setIsLoadingOptions(false);
        }
      };
      fetchOptions();
    } else if (!showPersonaSelector) {
      setPersonaOptions([]);
    }
  }, [showPersonaSelector]);


  useEffect(() => {
    if (flashCooldownRef.current) {
        prevQuestionRef.current = question;
        return;
    }

    const count = (str: string, char: string) => (str.match(new RegExp(char, "g")) || []).length;
    
    const sixCount = count(question, '6');
    const sevenCount = count(question, '7');
    const prevSixCount = count(prevQuestionRef.current, '6');
    const prevSevenCount = count(prevQuestionRef.current, '7');

    if (sixCount > prevSixCount || sevenCount > prevSevenCount) {
         flashCooldownRef.current = true;
         setIs67Flashing(true);
         soundService.play('crypticFlash');

         setTimeout(() => {
             setIs67Flashing(false);
         }, 350);

         setTimeout(() => {
             flashCooldownRef.current = false;
         }, 850);
    }

    prevQuestionRef.current = question;
  }, [question]);
  
  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    soundService.setMuted(newMutedState);
    
    if (soundInitialized.current) {
        if (!newMutedState) {
            soundService.play('startAmbient');
        } else {
            soundService.play('stopAmbient');
        }
    }
  };

  const processQuestion = useCallback(async () => {
    if (!question.trim() || appState === 'spelling' || appState === 'thinking' || !selectedPersona) return;
    
    setAppState('thinking');
    setError(null);
    setDisplayedAnswer('');

    try {
      const spiritResponse = await askSpirit(question, selectedPersona.systemInstruction);
      setAppState('spelling');
      
      soundService.play('crypticFlash');
      setDisplayedAnswer('67');
      
      const flashTimeout = setTimeout(() => {
        animatePlanchette(spiritResponse);
      }, 350);

      animationTimeout.current = flashTimeout;

    } catch (err) {
      console.error(err);
      setError('The spirits are silent. Please try again later.');
      setAppState('error');
    }
  }, [question, appState, selectedPersona]);


  const handleAsk = async () => {
    const isBusy = appState === 'thinking' || appState === 'spelling';
    if (!question.trim() || isBusy) return;
    
    soundService.play('uiclick');

    if (Math.random() < 0.05) {
      setJumpscareType('random');
    } else {
      await processQuestion();
    }
  };

  const animatePlanchette = (answer: string) => {
    setDisplayedAnswer('');

    type AnimationStep = 
      | { type: 'move'; key: string }
      | { type: 'spell'; key: string }
      | { type: 'glow'; key: string }
      | { type: 'pause'; duration: number };

    const sequence: AnimationStep[] = [];
    
    const isSingleLetter = answer.length === 1 && /[A-Z]/.test(answer);

    const isDirectAnswer = 
      answer === 'YES' || 
      answer === 'NO' || 
      answer === 'GOOD BYE' ||
      BOARD_CHARS.numbers.includes(answer) ||
      isSingleLetter;


    if (isDirectAnswer) {
        sequence.push({ type: 'move', key: 'SUN' });
        sequence.push({ type: 'pause', duration: 200 });
        sequence.push({ type: 'move', key: answer });
        sequence.push({ type: 'glow', key: answer });
        sequence.push({ type: 'pause', duration: 1500 });
        
        if (answer !== 'GOOD BYE') {
            sequence.push({ type: 'move', key: 'MOON' });
            sequence.push({ type: 'pause', duration: 200 });
            sequence.push({ type: 'move', key: 'GOOD BYE' });
        }
    } else {
        sequence.push({ type: 'move', key: 'SUN' });
        sequence.push({ type: 'pause', duration: 200 });
        sequence.push({ type: 'move', key: 'MOON' });
        sequence.push({ type: 'pause', duration: 500 });

        for (const char of answer.toUpperCase()) {
            const key = char === ' ' ? ' ' : char;
            if (charPositions.current.has(key)) {
                sequence.push({ type: 'spell', key });
            }
        }

        sequence.push({ type: 'pause', duration: 500 });
        sequence.push({ type: 'move', key: 'STAR-BL' });
        sequence.push({ type: 'pause', duration: 200 });
        sequence.push({ type: 'move', key: 'GOOD BYE' });
    }

    let i = 0;
    const executeNextStep = () => {
        if (i >= sequence.length) {
            animationTimeout.current = setTimeout(resetState, 2000);
            return;
        }

        const step = sequence[i];
        let delay = 0;

        switch(step.type) {
            case 'move': {
                const pos = charPositions.current.get(step.key);
                if (pos) {
                    soundService.play('move');
                    setPlanchettePosition(pos);
                }
                delay = CHAR_MOVE_DURATION;
                break;
            }
            case 'spell': {
                if (step.key === ' ') {
                    setDisplayedAnswer(prev => prev + ' ');
                    delay = ANIMATION_DELAY / 2 * (0.5 + Math.random());
                } else {
                    const pos = charPositions.current.get(step.key);
                    if (pos) {
                        soundService.play('move');
                        setPlanchettePosition(pos);
                        setTimeout(() => {
                            setDisplayedAnswer(prev => prev + (step.key as string));
                            soundService.play('select');
                        }, CHAR_MOVE_DURATION);
                    }
                    const randomPause = (ANIMATION_DELAY / 2) * (0.5 + Math.random());
                    delay = CHAR_MOVE_DURATION + randomPause;
                }
                break;
            }
            case 'glow': {
                setDisplayedAnswer(step.key);
                const element = document.querySelector(`[data-char="${step.key}"]`);
                if (element) {
                    soundService.play('emphasis');
                    element.classList.add('animate-pulse-glow');
                    setTimeout(() => {
                        element.classList.remove('animate-pulse-glow');
                    }, 1500);
                }
                delay = 1500;
                break;
            }
            case 'pause': {
                const randomFactor = 0.7 + Math.random() * 0.6;
                delay = step.duration * randomFactor;
                break;
            }
        }
        i++;
        animationTimeout.current = setTimeout(executeNextStep, delay);
    };

    executeNextStep();
  };
  
  const handleReset = () => {
    soundService.play('uiclick');
    setError(null);
    setDisplayedAnswer('');
    resetState();
    resetSpiritConversation();
  };
  
  const handleJumpscareComplete = useCallback(() => {
    if (jumpscareType === 'random') {
      processQuestion();
    } else if (jumpscareType === 'triggered') {
      handleReset();
    }
    setJumpscareType(null);
  }, [jumpscareType, processQuestion, handleReset]);

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setShowPersonaSelector(false);
    handleReset();
    soundService.play('uiclick');
  };

  const handleCloseSelector = () => {
    setShowPersonaSelector(false);
    soundService.play('uiclick');
  };

  const isAnswering = appState === 'thinking' || appState === 'spelling';
  const isThinking = appState === 'thinking';

  if (!selectedPersona) {
    return (
      <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-300 my-4 text-center tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
            Mystifying Oracle
          </h1>
          <p className="text-2xl font-ouija text-amber-300 animate-pulse">Summoning a spirit...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden">
      {showPersonaSelector && (
        <PersonaSelector 
          personas={personaOptions}
          onSelect={handleSelectPersona}
          onClose={handleCloseSelector}
          isLoading={isLoadingOptions}
        />
      )}
      {jumpscareType && <Jumpscare onComplete={handleJumpscareComplete} variant={jumpscareType} />}
      <div className={`w-full max-w-5xl mx-auto flex flex-col items-center transition-opacity duration-500 ${jumpscareType || showPersonaSelector ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-300 my-4 text-center tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
          Mystifying Oracle
        </h1>
        <div className="text-center text-sm text-stone-500 mb-2">
            Communicating with: <span className="font-bold text-stone-400">{selectedPersona.name}</span>
        </div>
        <OuijaBoard
          planchettePosition={planchettePosition}
          charPositionsRef={charPositions}
          boardChars={BOARD_CHARS}
          isThinking={isThinking}
        />
        <Controls
          question={question}
          setQuestion={setQuestion}
          onAsk={handleAsk}
          onReset={handleReset}
          isAnswering={isAnswering}
          displayedAnswer={displayedAnswer}
          error={error}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          is67Flashing={is67Flashing}
        />
         <footer className="text-center text-xs text-stone-600 mt-4 pb-2">
            Disclaimer: For entertainment purposes only.
        </footer>
      </div>
    </div>
  );
};

export default App;
