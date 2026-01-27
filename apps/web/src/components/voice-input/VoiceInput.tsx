import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/button/Button";
import { MicrophoneIcon, MicrophoneSlashIcon } from "@phosphor-icons/react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.warn("Browser does not support Speech Recognition");
      return;
    }

    // @ts-ignore
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.stop();
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  if (!recognitionRef.current) {
    return null; // Don't render if not supported
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
