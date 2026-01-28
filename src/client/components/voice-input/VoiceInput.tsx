import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/button/Button";
import { Microphone as MicrophoneIcon } from "@phosphor-icons/react/dist/ssr/Microphone";
import { MicrophoneSlash as MicrophoneSlashIcon } from "@phosphor-icons/react/dist/ssr/MicrophoneSlash";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep the transcript callback up to date without re-initializing
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const win = window as any;
    const SpeechRecognition =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.debug("[VoiceInput] Speech recognition not supported");
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscriptRef.current(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is a common error if the user stays silent
      if (event.error !== "no-speech") {
        console.error("[VoiceInput] Speech recognition error:", event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("[VoiceInput] Failed to start:", e);
        setIsListening(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      shape="circular"
      className={`h-8 w-8 transition-colors ${
        isListening
          ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
          : "text-ob-text-secondary hover:text-brand-500 hover:bg-brand-500/10"
      }`}
      onClick={toggleListening}
    >
      {isListening ? (
        <MicrophoneSlashIcon weight="fill" />
      ) : (
        <MicrophoneIcon weight="fill" />
      )}
    </Button>
  );
}
