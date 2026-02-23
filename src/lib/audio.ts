/**
 * Audio generation utilities for Sonic Guardian
 */

export function generateAudio(audioContext: AudioContext, type: 'success' | 'error' | 'lock' | 'reset' = 'success') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const now = audioContext.currentTime;
  
  switch (type) {
    case 'success':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      break;
      
    case 'error':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, now);
      oscillator.frequency.setValueAtTime(110, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      break;
      
    case 'lock':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.setValueAtTime(220, now + 0.3);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;
      
    case 'reset':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(554.37, now);
      oscillator.frequency.setValueAtTime(1108.73, now + 0.15);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      break;
  }
}