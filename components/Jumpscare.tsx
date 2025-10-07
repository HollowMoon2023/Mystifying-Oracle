
import React, { useEffect } from 'react';
import { soundService } from '../services/soundService';

interface JumpscareProps {
  onComplete: () => void;
  variant: 'random' | 'triggered';
}

const Jumpscare: React.FC<JumpscareProps> = ({ onComplete, variant }) => {
  useEffect(() => {
    const isTriggered = variant === 'triggered';
    const duration = isTriggered ? 10000 : 1000;
    
    soundService.play(isTriggered ? 'jumpscare' : 'jumpscare_short');

    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let speechInterval: ReturnType<typeof setInterval> | null = null;
    
    if (isTriggered) {
      soundService.play('startHeartbeat');
      
      // Text-to-speech for "6 7 mangos"
      const utterance = new SpeechSynthesisUtterance("six seven mangos");
      utterance.rate = 2.5; // Faster speech rate
      utterance.pitch = 0.9;
      
      const startSpeech = () => {
          // Cancel previous to prevent overlap if interval is shorter than speech
          window.speechSynthesis.cancel(); 
          window.speechSynthesis.speak(utterance);
      };

      // 3 words / (5 words/sec) = 0.6 seconds per phrase => 600ms interval
      speechInterval = setInterval(startSpeech, 600);
      startSpeech(); // Speak immediately once
    }

    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(timer);
      if (speechInterval) {
        clearInterval(speechInterval);
      }
      if (isTriggered) {
        soundService.play('stopHeartbeat');
        window.speechSynthesis.cancel(); // Stop any queued or ongoing speech
      }
    };
  }, [onComplete, variant]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-repeat animate-tv-static opacity-25 pointer-events-none"></div>
        <div className="animate-jumpscare-shake-glitch">
            <img 
              src="https://media1.tenor.com/m/wXfbbjRyyWcAAAAC/scp-067-67.gif" 
              alt="A frightening, distorted face lunges forward." 
              className="max-w-xl w-full"
            />
        </div>
    </div>
  );
};

export default Jumpscare;
