import React, { useLayoutEffect, useRef, useState } from 'react';
import type { CharPosition, BoardLayout } from '../types';
import { Planchette } from './Planchette';
import { CHAR_MOVE_DURATION } from '../constants';

interface OuijaBoardProps {
  planchettePosition: CharPosition;
  charPositionsRef: React.MutableRefObject<Map<string, CharPosition>>;
  boardChars: BoardLayout;
  isThinking: boolean;
}

const SunIcon = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 text-black">
    <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M50,20 Q65,30 70,50 Q65,70 50,80 Q35,70 30,50 Q35,30 50,20 M50,20 Q45,35 35,40 M50,20 Q55,35 65,40 M70,50 Q60,55 60,65 M70,50 Q60,45 60,35 M30,50 Q40,55 40,65 M30,50 Q40,45 40,35 M50,80 Q45,65 35,60 M50,80 Q55,65 65,60" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12 text-black">
        <path d="M 60 10 A 40 40 0 1 0 60 90 A 30 30 0 1 1 60 10 Z" fill="currentColor" />
    </svg>
);

const StarIcon = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10 text-black">
        <path d="M50 0 L61.2 34.5 L97.5 34.5 L70.6 55.9 L81.9 90.4 L50 69 L18.1 90.4 L29.4 55.9 L2.5 34.5 L38.8 34.5 Z" fill="currentColor" />
    </svg>
);

const CornerFlourish = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 5 95 C 30 70, 70 30, 95 5" />
        <path d="M 5 95 Q 5 75, 25 80" />
        <path d="M 95 5 Q 75 5, 80 25" />
    </svg>
);

const DecoStar = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M50 0 L61.2 34.5 L97.5 34.5 L70.6 55.9 L81.9 90.4 L50 69 L18.1 90.4 L29.4 55.9 L2.5 34.5 L38.8 34.5 Z" />
    </svg>
);

const BoardCharacter: React.FC<{ char: string; style?: React.CSSProperties }> = ({ char, style }) => (
  <div
    data-char={char}
    className="font-ouija text-3xl md:text-4xl text-black flex items-center justify-center transition-colors duration-300"
    style={style}
  >
    {char}
  </div>
);

const ArcText: React.FC<{ chars: string[], radius: number, arc: number, startAngle: number }> = ({ chars, radius, arc, startAngle }) => {
    const angleStep = arc / (chars.length - 1);
    return (
        <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
            {chars.map((char, i) => {
                const angle = startAngle + (i * angleStep);
                const style = {
                    position: 'absolute' as 'absolute',
                    transform: `rotate(${angle}deg) translate(0, -${radius}px) rotate(${-angle}deg)`
                };
                return <BoardCharacter key={char} char={char} style={style} />;
            })}
        </div>
    );
};


export const OuijaBoard: React.FC<OuijaBoardProps> = ({ planchettePosition, charPositionsRef, boardChars, isThinking }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [arcRadii, setArcRadii] = useState({ radius1: 180, radius2: 260 });

  useLayoutEffect(() => {
    if (!boardRef.current) return;
    const board = boardRef.current;

    const calculateLayout = () => {
      const boardRect = board.getBoundingClientRect();
      if (boardRect.width === 0 || boardRect.height === 0) return;

      // 1. Update radii based on current board height for responsiveness
      setArcRadii({
        radius1: boardRect.height * 0.30,
        radius2: boardRect.height * 0.43,
      });

      // 2. Defer position calculation until after the next render cycle,
      // ensuring the DOM has updated with the new radii.
      setTimeout(() => {
        const positions = new Map<string, CharPosition>();
        const allElements = board.querySelectorAll('[data-char]');
        const currentBoardRect = board.getBoundingClientRect(); // Re-measure after render

        allElements.forEach(element => {
          const char = element.getAttribute('data-char');
          if (char) {
            const rect = element.getBoundingClientRect();
            // Center the 100x90 planchette over the character
            const top = `${rect.top - currentBoardRect.top + rect.height / 2 - 45}px`;
            const left = `${rect.left - currentBoardRect.left + rect.width / 2 - 50}px`;
            positions.set(char, { top, left });
          }
        });
        
        // Add a position for the space character (resting position)
        positions.set(' ', { 
          top: `${currentBoardRect.height * 0.45}px`, 
          left: `${currentBoardRect.width / 2 - 50}px` 
        });

        charPositionsRef.current = positions;
      }, 0);
    };

    const resizeObserver = new ResizeObserver(calculateLayout);
    resizeObserver.observe(board);

    calculateLayout(); // Initial calculation

    return () => resizeObserver.disconnect();
  }, [charPositionsRef]);

  return (
    <div
      id="ouija-board"
      ref={boardRef}
      className="relative w-full max-w-5xl aspect-[1.5/1] rounded-lg shadow-2xl shadow-black/70 p-4 md:p-6 mt-4 select-none"
      style={{
          background: 'radial-gradient(ellipse at center, #f5d37b 0%, #d4a94a 70%, #c7953c 100%)',
          boxShadow: 'inset 0 0 0 8px #000, inset 0 0 0 12px #c7a461, inset 0 0 30px rgba(0,0,0,0.5)'
      }}
    >
        {/* Decorative Elements */}
        <CornerFlourish className="absolute top-1 left-1 w-20 h-20 text-black/60" />
        <CornerFlourish className="absolute top-1 right-1 w-20 h-20 text-black/60 transform scale-x-[-1]" />
        <CornerFlourish className="absolute bottom-1 left-1 w-20 h-20 text-black/60 transform scale-y-[-1]" />
        <CornerFlourish className="absolute bottom-1 right-1 w-20 h-20 text-black/60 transform scale-x-[-1] scale-y-[-1]" />
        
        <DecoStar className="absolute top-[20%] left-[10%] w-4 h-4 text-black/20" />
        <DecoStar className="absolute top-[35%] left-[25%] w-3 h-3 text-black/20" />
        <DecoStar className="absolute top-[22%] right-[12%] w-5 h-5 text-black/20" />
        <DecoStar className="absolute top-[40%] right-[20%] w-3 h-3 text-black/20" />
        <DecoStar className="absolute bottom-[18%] left-[30%] w-3 h-3 text-black/20" />
        <DecoStar className="absolute bottom-[15%] right-[33%] w-4 h-4 text-black/20" />

        <div data-char="SUN" className={`absolute top-2 left-4 md:top-4 md:left-8 z-10 transition-all duration-500 ${isThinking ? 'animate-pulse-glow-icon' : ''}`}><SunIcon /></div>
        <div data-char="MOON" className={`absolute top-6 right-4 md:top-8 md:right-8 z-10 transition-all duration-500 ${isThinking ? 'animate-pulse-glow-icon' : ''}`}><MoonIcon /></div>
        <div data-char="STAR-BL" className={`absolute bottom-4 left-4 md:bottom-6 md:left-10 z-10 transition-all duration-500 ${isThinking ? 'animate-pulse-glow-icon' : ''}`}><StarIcon /></div>
        <div data-char="STAR-BR" className={`absolute bottom-4 right-4 md:bottom-6 md:right-10 z-10 transition-all duration-500 ${isThinking ? 'animate-pulse-glow-icon' : ''}`}><StarIcon /></div>

        <div className="w-full h-full relative flex flex-col justify-between items-center">
            <div className="w-full flex justify-between items-start px-16 md:px-24 pt-2">
                <BoardCharacter char="YES" />
                <BoardCharacter char="NO" />
            </div>

            <div className="w-full h-full absolute top-0 left-0 pointer-events-none">
              <ArcText chars={boardChars.alphabetArc1} radius={arcRadii.radius1} arc={140} startAngle={-70} />
              <ArcText chars={boardChars.alphabetArc2} radius={arcRadii.radius2} arc={150} startAngle={-75} />
            </div>
            
            <div className="w-full flex justify-center gap-x-3 md:gap-x-5 mt-auto mb-10 md:mb-16">
                 {boardChars.numbers.map(char => <BoardCharacter key={char} char={char} />)}
            </div>

            <div className="w-full flex justify-center pb-2">
                <BoardCharacter char="GOOD BYE" />
            </div>
        </div>
      
      <Planchette position={planchettePosition} moveDuration={CHAR_MOVE_DURATION} isThinking={isThinking} />
    </div>
  );
};