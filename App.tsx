import React, { useState, useRef, useCallback, useEffect } from 'react';
import { OuijaBoard } from './components/OuijaBoard';
import { Controls } from './components/Controls';
import Jumpscare from './components/Jumpscare';
import PersonaSelector from './components/PersonaSelector';
import { askSpirit } from './services/geminiService';
import { soundService } from './services/soundService';
import * as dbService from './services/dbService';
import { generateAndStoreInitialPersonas } from './services/personaService';
import type { CharPosition, Persona, ConversationHistory } from './types';
import { BOARD_CHARS, BOARD_CHARS_MOBILE, ANIMATION_DELAY, CHAR_MOVE_DURATION } from './constants';

type AppState = 'idle' | 'thinking' | 'spelling' | 'error';
type JumpscareType = 'random' | 'triggered';
type LayoutMode = 'desktop' | 'mobile';

const App: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [displayedAnswer, setDisplayedAnswer] = useState<string>('');
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [planchettePosition, setPlanchettePosition] = useState<CharPosition>({ top: '50%', left: '50%' });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [jumpscareType, setJumpscareType] = useState<JumpscareType | null>(null);
  const [is67Flashing, setIs67Flashing] = useState<boolean>(false);
  
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory>([]);
  
  const [showPersonaSelector, setShowPersonaSelector] = useState<boolean>(false);
  
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Waking the spirits...");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('desktop');
  
  const charPositions = useRef<Map<string, CharPosition>>(new Map());
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundInitialized = useRef<boolean>(false);
  const flashCooldownRef = useRef<boolean>(false);
  const prevQuestionRef = useRef(question);

  useEffect(() => {
    // Set initial layout based on screen width, but allow user to override
    if (window.innerWidth < 768) {
      setLayoutMode('mobile');
    }
  }, []);

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
    const initializeApp = async () => {
        try {
            setLoadingMessage("Checking the spirit realm...");
            
            let personas = await dbService.getPersonas();
            if (!personas || personas.length < 67) {
                setLoadingMessage("The spirits are gathering... This may take a moment.");
                personas = await generateAndStoreInitialPersonas(67, setLoadingProgress);
            } else {
                setLoadingProgress(100);
            }
            setAllPersonas(personas);

            setLoadingMessage("Finding a willing spirit...");
            let activeId = await dbService.getActivePersonaId();
            let currentPersona = personas.find(p => p.id === activeId);

            if (!currentPersona) {
                currentPersona = personas[Math.floor(Math.random() * personas.length)];
                if (currentPersona) await dbService.setActivePersonaId(currentPersona.id);
            }

            if (!currentPersona && personas.length > 0) {
              currentPersona = personas[0];
            } else if (!currentPersona) {
               throw new Error("No personas available.");
            }
            
            setSelectedPersona(currentPersona);

            setLoadingMessage("Recalling past conversations...");
            const history = await dbService.getConversation(currentPersona.id);
            setConversationHistory(history);

        } catch(e) {
            console.error("Initialization failed:", e);
            setError("Could not connect to the spirit world. Please refresh.");
            setLoadingMessage("Connection to the ether has failed.");
        } finally {
            setTimeout(() => setIsLoadingApp(false), 500);
        }
    };

    initializeApp();
}, []);

  useEffect(() => {
     if (selectedPersona) { 
        setTimeout(() => setPlanchettePosition(getRestingPosition()), 100);
     }
  }, [selectedPersona, getRestingPosition, layoutMode]);

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
    } else if (questionLower === 'goodbye' && allPersonas.length > 0) {
        setQuestion('');

        const changePersona = async () => {
            setDisplayedAnswer("A spirit departs...");
            soundService.play('emphasis');
            
            resetState();
            setError(null);
            
            let newPersona;
            do {
              newPersona = allPersonas[Math.floor(Math.random() * allPersonas.length)];
            } while (allPersonas.length > 1 && newPersona.id === selectedPersona?.id);
            
            await dbService.setActivePersonaId(newPersona.id);
            const newHistory = await dbService.getConversation(newPersona.id);
            
            setSelectedPersona(newPersona);
            setConversationHistory(newHistory);
            
            setDisplayedAnswer("A new spirit has arrived.");
            
            setTimeout(() => {
                if (!error) setDisplayedAnswer('');
            }, 2000);
        };
        changePersona();
    }
  }, [question, resetState, error, allPersonas, selectedPersona]);
  
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

         setTimeout(() => setIs67Flashing(false), 350);
         setTimeout(() => { flashCooldownRef.current = false; }, 850);
    }
    prevQuestionRef.current = question;
  }, [question]);
  
  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    soundService.setMuted(newMutedState);
    if (soundInitialized.current) {
        if (!newMutedState) soundService.play('startAmbient');
        else soundService.play('stopAmbient');
    }
  };

  const processQuestion = useCallback(async () => {
    if (!question.trim() || appState !== 'idle' || !selectedPersona) return;
    
    setAppState('thinking');
    setError(null);
    setDisplayedAnswer('');

    try {
      const { responseText, updatedHistory } = await askSpirit(question, selectedPersona.systemInstruction, conversationHistory);
      setConversationHistory(updatedHistory);
      await dbService.saveConversation(selectedPersona.id, updatedHistory);

      setAppState('spelling');
      soundService.play('crypticFlash');
      setDisplayedAnswer('67');
      
      const flashTimeout = setTimeout(() => animatePlanchette(responseText), 350);
      animationTimeout.current = flashTimeout;

    } catch (err) {
      console.error(err);
      setError('The spirits are silent. Please try again later.');
      setAppState('error');
    }
  }, [question, appState, selectedPersona, conversationHistory]);


  const handleAsk = async () => {
    if (!question.trim() || appState !== 'idle') return;
    soundService.play('uiclick');
    if (Math.random() < 0.05) setJumpscareType('random');
    else await processQuestion();
  };

  const animatePlanchette = (answer: string) => {
    setDisplayedAnswer('');

    type AnimationStep = 
      | { type: 'move'; key: string } | { type: 'spell'; key: string }
      | { type: 'glow'; key: string } | { type: 'pause'; duration: number };
    const sequence: AnimationStep[] = [];
    
    const isSingleLetter = answer.length === 1 && /[A-Z]/.test(answer);
    const boardChars = layoutMode === 'mobile' ? BOARD_CHARS_MOBILE : BOARD_CHARS;
    const isDirectAnswer = answer === 'YES' || answer === 'NO' || answer === 'GOOD BYE' || (boardChars.numbers && boardChars.numbers.includes(answer)) || isSingleLetter;

    if (isDirectAnswer) {
        sequence.push({ type: 'move', key: 'SUN' }, { type: 'pause', duration: 200 });
        sequence.push({ type: 'move', key: answer }, { type: 'glow', key: answer }, { type: 'pause', duration: 1500 });
        if (answer !== 'GOOD BYE') {
            sequence.push({ type: 'move', key: 'MOON' }, { type: 'pause', duration: 200 }, { type: 'move', key: 'GOOD BYE' });
        }
    } else {
        sequence.push({ type: 'move', key: 'SUN' }, { type: 'pause', duration: 200 });
        sequence.push({ type: 'move', key: 'MOON' }, { type: 'pause', duration: 500 });

        for (const char of answer.toUpperCase()) {
            if (charPositions.current.has(char === ' ' ? ' ' : char)) sequence.push({ type: 'spell', key: char });
        }
        sequence.push({ type: 'pause', duration: 500 }, { type: 'move', key: 'STAR-BL' }, { type: 'pause', duration: 200 }, { type: 'move', key: 'GOOD BYE' });
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
                if (pos) { soundService.play('move'); setPlanchettePosition(pos); }
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
                    delay = CHAR_MOVE_DURATION + (ANIMATION_DELAY / 2) * (0.5 + Math.random());
                }
                break;
            }
            case 'glow': {
                setDisplayedAnswer(step.key);
                const element = document.querySelector(`[data-char="${step.key}"]`);
                if (element) {
                    soundService.play('emphasis');
                    element.classList.add('animate-pulse-glow');
                    setTimeout(() => element.classList.remove('animate-pulse-glow'), 1500);
                }
                delay = 1500;
                break;
            }
            case 'pause': delay = step.duration * (0.7 + Math.random() * 0.6); break;
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
  };
  
  const handleJumpscareComplete = useCallback(() => {
    if (jumpscareType === 'random') processQuestion();
    else if (jumpscareType === 'triggered') handleReset();
    setJumpscareType(null);
  }, [jumpscareType, processQuestion, handleReset]);

  const handleSelectPersona = async (persona: Persona) => {
    setSelectedPersona(persona);
    await dbService.setActivePersonaId(persona.id);
    const newHistory = await dbService.getConversation(persona.id);
    setConversationHistory(newHistory);
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

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-300 my-4 text-center tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
            Mystifying Oracle
          </h1>
          <p className="text-2xl font-ouija text-amber-300 animate-pulse">{loadingMessage}</p>
          {loadingProgress < 100 &&
            <div className="w-full max-w-sm bg-stone-800 rounded-full h-2.5 mt-4">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{width: `${loadingProgress}%`}}></div>
            </div>
          }
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden">
      {showPersonaSelector && (
        <PersonaSelector 
          personas={allPersonas}
          onSelect={handleSelectPersona}
          onClose={handleCloseSelector}
          isLoading={false}
        />
      )}
      {jumpscareType && <Jumpscare onComplete={handleJumpscareComplete} variant={jumpscareType} />}
      <div className={`w-full max-w-5xl mx-auto flex flex-col items-center transition-opacity duration-500 ${jumpscareType || showPersonaSelector ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-300 my-4 text-center tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
          Mystifying Oracle
        </h1>
        <div className="text-center text-sm text-stone-500 mb-2">
            Communicating with: <span className="font-bold text-stone-400">{selectedPersona?.name || '...'}</span>
        </div>
        <OuijaBoard
          layoutMode={layoutMode}
          planchettePosition={planchettePosition}
          charPositionsRef={charPositions}
          boardChars={layoutMode === 'mobile' ? BOARD_CHARS_MOBILE : BOARD_CHARS}
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
            <p>Disclaimer: For entertainment purposes only.</p>
            <div className="mt-2">
                <button onClick={() => setLayoutMode('desktop')} className={`px-2 py-1 text-xs transition-colors ${layoutMode === 'desktop' ? 'text-amber-300 font-bold' : 'text-stone-500 hover:text-stone-300'}`}>Desktop Layout</button>
                <span className="text-stone-600 mx-1">|</span>
                <button onClick={() => setLayoutMode('mobile')} className={`px-2 py-1 text-xs transition-colors ${layoutMode === 'mobile' ? 'text-amber-300 font-bold' : 'text-stone-500 hover:text-stone-300'}`}>Mobile Layout</button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;