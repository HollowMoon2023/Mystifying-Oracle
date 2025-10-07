import React from 'react';
import type { CharPosition } from '../types';

interface PlanchetteProps {
  position: CharPosition;
  moveDuration: number;
  isThinking: boolean;
}

export const Planchette: React.FC<PlanchetteProps> = ({ position, moveDuration, isThinking }) => {
  return (
    <div
      className={`absolute w-[100px] h-[90px] transition-all ease-in-out will-change-transform ${isThinking ? 'animate-thinking' : ''}`}
      style={{ 
        top: position.top, 
        left: position.left,
        transitionDuration: `${moveDuration}ms`,
        filter: 'drop-shadow(0 8px 10px rgba(0, 0, 0, 0.6))'
      }}
    >
      <svg viewBox="0 0 100 95" className="w-full h-full">
        <defs>
            <filter id="woodGrain">
                <feTurbulence type="fractalNoise" baseFrequency="0.1 0.02" numOctaves="2" result="noise" />
                <feDiffuseLighting in="noise" lightingColor="#e6b84c" surfaceScale="2">
                    <feDistantLight azimuth="45" elevation="60" />
                </feDiffuseLighting>
                <feComposite operator="in" in2="SourceGraphic" result="textured"/>
                 <feGaussianBlur in="textured" stdDeviation="0.5" />
            </filter>
        </defs>

        <path
            fillRule="evenodd"
            d="M50 0 C 10 25, 0 50, 20 95 Q 50 100, 80 95 C 100 50, 90 25, 50 0 Z M 50 58 A 17 17 0 1 0 50 24 A 17 17 0 1 0 50 58 Z"
            fill="#c7a461"
            stroke="black"
            strokeWidth="3"
        />
        <path
            d="M50 0 C 10 25, 0 50, 20 95 Q 50 100, 80 95 C 100 50, 90 25, 50 0 Z"
            fill="black"
            opacity="0.3"
            filter="url(#woodGrain)"
        />

        {/* Text */}
        <text x="50" y="68" textAnchor="middle" className="font-ouija" fontSize="12" fill="black">OUIJA</text>
        <text x="50" y="75" textAnchor="middle" fontFamily="Cinzel" fontSize="4" fill="black" letterSpacing="0.5">MYSTIFYING ORACLE</text>

        {/* Decorations */}
        <g fill="black">
            {/* Moon & Stars */}
            <path d="M 80 15 A 8 8 0 1 0 80 31 A 6 6 0 1 1 80 15 Z" />
            <path d="M72 15 L73.2 18.5 L77 18.5 L74.4 20.6 L75.6 24.1 L72 22 L68.4 24.1 L69.6 20.6 L67 18.5 L70.8 18.5 Z" transform="scale(0.5) translate(148, 2)"/>
            
            {/* Stars Left */}
            <path d="M25 10 L26.2 13.5 L30 13.5 L27.4 15.6 L28.6 19.1 L25 17 L21.4 19.1 L22.6 15.6 L20 13.5 L23.8 13.5 Z" transform="scale(0.6) translate(10, -5)" />
            <path d="M35 25 L36.2 28.5 L40 28.5 L37.4 30.6 L38.6 34.1 L35 32 L31.4 34.1 L32.6 30.6 L30 28.5 L33.8 28.5 Z" transform="scale(0.4) translate(-30, -25)" />
             <path d="M28 35 L29.2 38.5 L33 38.5 L30.4 40.6 L31.6 44.1 L28 42 L24.4 44.1 L25.6 40.6 L23 38.5 L26.8 38.5 Z" transform="scale(0.5) translate(-32, -50)"/>
             <path d="M20 25 L21.2 28.5 L25 28.5 L22.4 30.6 L23.6 34.1 L20 32 L16.4 34.1 L17.6 30.6 L15 28.5 L18.8 28.5 Z" transform="scale(0.3) translate(20, 10)"/>

        </g>
      </svg>
    </div>
  );
};
