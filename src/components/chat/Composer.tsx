import { ArrowUp, Mic, MicOff } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useForge } from "../../store/ForgeContext";

type SpeechResultEvent = {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition() {
  const browser = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null;
}

export function Composer({
  autoFocus,
  placeholder = "Describe the idea, paste notes, customer feedback, or context from another AI conversation…",
  helper = "Enter to send · Shift + Enter for a new line",
}: {
  autoFocus?: boolean;
  placeholder?: string;
  helper?: string;
}) {
  const f = useForge();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setSpeechAvailable(Boolean(getSpeechRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    f.sendChat();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      f.sendChat();
    }
  };

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let committed = f.composer.trim();
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) committed = (committed + " " + result[0].transcript).trim();
        else interim += result[0].transcript;
      }
      f.setComposer((committed + " " + interim).trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className="group rounded-[20px] border border-line-strong bg-raised p-2.5 shadow-[var(--shadow-soft)] transition focus-within:border-spark/30 focus-within:shadow-[var(--shadow-focus)]">
        <textarea
          autoFocus={autoFocus}
          rows={5}
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-h-[138px] w-full resize-none bg-transparent px-2.5 py-2 text-[16px] leading-7 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            {speechAvailable && (
              <button
                type="button"
                onClick={toggleDictation}
                className={
                  "grid size-8 shrink-0 place-items-center rounded-lg transition " +
                  (listening ? "bg-scorch-soft text-scorch" : "text-ink-4 hover:bg-inset hover:text-ink")
                }
                aria-label={listening ? "Stop dictation" : "Dictate your idea"}
                title={listening ? "Stop dictation" : "Dictate instead of typing"}
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            )}
            <span className="truncate text-[11px] text-ink-4">
              {listening ? "Listening… speak naturally" : helper}
            </span>
          </div>

          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-canvas transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-sm disabled:opacity-30"
            aria-label="Send to Forge"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
