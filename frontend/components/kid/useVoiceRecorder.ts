'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_RECORDING_MS = 15_000;
const FALLBACK_AUDIO_TYPE = 'audio/webm';

export type RecorderStatus = 'idle' | 'starting' | 'recording';
export type RecorderProblem = 'unsupported' | 'denied' | null;

export type VoiceRecorder = {
  status: RecorderStatus;
  problem: RecorderProblem;
  start: (onDone: (audio: Blob) => void) => Promise<void>;
  stop: () => void;
};

function canRecord(): boolean {
  const hasRecorder = typeof window.MediaRecorder !== 'undefined';
  const hasMedia = typeof navigator.mediaDevices?.getUserMedia === 'function';
  return hasRecorder && hasMedia;
}

async function requestMicrophone(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch {
    return null;
  }
}

function stopTracks(stream: MediaStream | null): void {
  if (stream === null) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function useVoiceRecorder(): VoiceRecorder {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [problem, setProblem] = useState<RecorderProblem>(null);
  const statusRef = useRef<RecorderStatus>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const changeStatus = useCallback((next: RecorderStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    const recorder = recorderRef.current;

    if (recorder === null || recorder.state === 'inactive') {
      return;
    }

    recorder.stop();
  }, [clearTimer]);

  const start = useCallback(
    async (onDone: (audio: Blob) => void) => {
      if (statusRef.current !== 'idle') {
        return;
      }

      if (!canRecord()) {
        setProblem('unsupported');
        return;
      }

      setProblem(null);
      changeStatus('starting');
      const stream = await requestMicrophone();

      if (stream === null) {
        setProblem('denied');
        changeStatus('idle');
        return;
      }

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        const type = recorder.mimeType === '' ? FALLBACK_AUDIO_TYPE : recorder.mimeType;
        const audio = new Blob(chunks, { type });

        stopTracks(streamRef.current);
        streamRef.current = null;
        recorderRef.current = null;
        if (!mountedRef.current) {
          return;
        }

        changeStatus('idle');
        onDone(audio);
      });

      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      changeStatus('recording');
      timerRef.current = window.setTimeout(stop, MAX_RECORDING_MS);
    },
    [changeStatus, stop],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimer();
      stopTracks(streamRef.current);
    };
  }, [clearTimer]);

  return { status, problem, start, stop };
}
