/**
 * Audio generation utilities for Sonic Guardian
 */

export function generateAudio(audioContext: AudioContext, type: 'success' | 'error' | 'lock' | 'reset' = 'success') {
  try {
    // Validate inputs
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('Invalid AudioContext provided');
    }

    if (!['success', 'error', 'lock', 'reset'].includes(type)) {
      throw new Error('Invalid audio type');
    }

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
  } catch (error) {
    console.error('Failed to generate audio:', error);
    throw error;
  }
}

/**
 * Create audio context with proper error handling
 */
export function createAudioContext(): AudioContext {
  try {
    // Check for AudioContext support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    const audioContext = new AudioContextClass();
    
    // Resume context if suspended (common in modern browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    return audioContext;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    throw error;
  }
}

/**
 * Safely stop audio context and clean up resources
 */
export function stopAudioContext(audioContext: AudioContext): void {
  try {
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
  } catch (error) {
    console.error('Failed to stop AudioContext:', error);
  }
}

/**
 * Validate audio permissions
 */
export async function checkAudioPermissions(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Audio permissions check failed:', error);
    return false;
  }
}
