
import React from 'react';
import type { Persona } from '../types';

interface PersonaSelectorProps {
  personas: Persona[];
  onSelect: (persona: Persona) => void;
  onClose: () => void;
  isLoading: boolean;
}

const PersonaCard: React.FC<{ persona: Persona, onSelect: () => void }> = ({ persona, onSelect }) => (
  <div className="border border-stone-700/50 p-4 rounded-lg bg-black/40 flex flex-col group hover:border-amber-600/70 hover:bg-black/20 transition-all duration-300">
    <h3 className="text-xl font-ouija text-stone-200 group-hover:text-amber-300 transition-colors">{persona.name}</h3>
    <p className="text-stone-400 text-sm mt-2 flex-grow">{persona.backstory}</p>
    <button 
      onClick={onSelect} 
      className="mt-4 w-full px-4 py-2 bg-stone-800 text-stone-300 font-bold rounded-md hover:bg-amber-800 border border-stone-600 hover:border-amber-700 transition-all duration-300 disabled:bg-stone-900 disabled:text-stone-500 shadow-md"
    >
      Summon
    </button>
  </div>
);

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ personas, onSelect, onClose, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" style={{ animation: 'fade-in 0.5s ease-out' }}>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="bg-stone-900/80 border border-amber-900/40 p-6 md:p-8 rounded-xl max-w-5xl w-full shadow-2xl shadow-black/50 flex flex-col max-h-[90vh]">
        <h2 className="text-3xl md:text-4xl font-ouija text-amber-300 text-center mb-6 tracking-wider">Choose a Spirit to Summon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[200px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="col-span-full text-center text-stone-400 font-ouija text-xl p-8 animate-pulse">
              Reaching into the ether...
            </div>
          ) : (
            personas.map(persona => (
              <PersonaCard key={persona.id} persona={persona} onSelect={() => onSelect(persona)} />
            ))
          )}
        </div>
        <div className="text-center mt-8 flex-shrink-0">
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-stone-800/50 text-stone-400 font-bold rounded-md hover:bg-stone-700/50 border border-stone-700/50 transition-all duration-300"
            >
                Remain with the current spirit
            </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaSelector;
