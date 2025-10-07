
import React from 'react';

interface ControlsProps {
  question: string;
  setQuestion: (question: string) => void;
  onAsk: () => void;
  onReset: () => void;
  isAnswering: boolean;
  displayedAnswer: string;
  error: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  is67Flashing: boolean;
}

const AnswerDisplay: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full bg-black/50 p-4 rounded-md min-h-[6rem] flex items-center justify-center text-center border border-amber-800/30 shadow-inner">
        <p className="text-2xl md:text-3xl font-ouija text-amber-300 tracking-widest">
            {text || "..."}
        </p>
    </div>
);

const SoundToggle: React.FC<{ isMuted: boolean, onToggle: () => void }> = ({ isMuted, onToggle }) => (
  <button
    onClick={onToggle}
    className="absolute top-0 right-0 text-stone-500 hover:text-white transition-colors"
    aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
  >
    {isMuted ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l4-4m0 4l-4-4" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17 4v16M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    )}
  </button>
);


export const Controls: React.FC<ControlsProps> = ({
  question,
  setQuestion,
  onAsk,
  onReset,
  isAnswering,
  displayedAnswer,
  error,
  isMuted,
  onToggleMute,
  is67Flashing,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAsk();
    }
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-4 my-4 px-4 relative">
        <SoundToggle isMuted={isMuted} onToggle={onToggleMute} />
        <div className="w-full">
            <label htmlFor="question" className="sr-only">Your Question</label>
            <input
                id="question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the spirits a question..."
                disabled={isAnswering}
                className="w-full p-3 text-lg bg-black/60 border-2 border-amber-900/60 rounded-md text-stone-200 placeholder-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>

        <div className="flex gap-4">
            <button
                onClick={onAsk}
                disabled={isAnswering || !question.trim()}
                className="px-8 py-3 bg-stone-800 text-stone-200 font-bold rounded-md hover:bg-stone-700 border border-stone-600 transition-all duration-300 disabled:bg-stone-900 disabled:text-stone-500 disabled:cursor-not-allowed shadow-md"
            >
                {isAnswering ? 'Communicating...' : 'Ask'}
            </button>
            <button
                onClick={onReset}
                disabled={isAnswering}
                className="px-6 py-3 bg-stone-800/50 text-stone-400 font-bold rounded-md hover:bg-stone-700/50 border border-stone-700/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                Reset
            </button>
        </div>

        {error && <p className="text-red-400 mt-2">{error}</p>}
        
        <div className="mt-4 w-full">
            <h2 className="text-center font-ouija text-lg text-stone-400 mb-2">The Oracle Answers:</h2>
            <AnswerDisplay text={is67Flashing ? '67' : displayedAnswer} />
        </div>
    </div>
  );
};
