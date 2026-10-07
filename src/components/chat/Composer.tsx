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
  placeholder = "Describe the idea, problem, or paste context…",
}: {
  autoFocus?: boolean;
  placeholder?: string;
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
    recognitionRef.current?.stop();
    f.sendChat();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      recognitionRef.current?.stop();
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
        if (result.isFinal) {
          committed = (committed + " " + result[0].transcript).trim();
        } else {
          interim += result[0].transcript;
        }
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
      <div
        className={
          "group rounded-[24px] border bg-raised p-3 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-200 " +
          (listening
            ? "border-line-strong shadow-[var(--shadow-listening)]"
            : "border-line focus-within:border-line-strong focus-within:shadow-[var(--shadow-focus)]")
        }
      >
        <textarea
          autoFocus={autoFocus}
          rows={6}
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-h-[168px] w-full resize-none bg-transparent px-3 py-2 text-[18px] leading-8 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none"
        />

        <div className="flex items-center justify-between px-1 pt-1.5">
          <div className="flex items-center gap-2">
            {speechAvailable && (
              <button
                type="button"
                onClick={toggleDictation}
                className={
                  "relative grid size-9 place-items-center rounded-full transition " +
                  (listening
                    ? "bg-spark-soft text-spark"
                    : "text-ink-4 hover:bg-inset hover:text-ink")
                }
                aria-label={listening ? "Stop dictation" : "Dictate your idea"}
                title={listening ? "Stop dictation" : "Dictate instead of typing"}
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                {listening && <span className="forge-listening-ring absolute inset-0 rounded-full border border-spark/35" />}
              </button>
            )}

            {listening && (
              <div className="flex items-center gap-1" aria-label="Listening">
                <span className="forge-wave h-2 w-0.5 rounded-full bg-spark [animation-delay:0ms]" />
                <span className="forge-wave h-3.5 w-0.5 rounded-full bg-spark [animation-delay:90ms]" />
                <span className="forge-wave h-2.5 w-0.5 rounded-full bg-spark [animation-delay:180ms]" />
                <span className="forge-wave h-4 w-0.5 rounded-full bg-spark [animation-delay:270ms]" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-canvas transition-transform duration-150 enabled:hover:scale-[1.04] enabled:active:scale-[0.97] disabled:opacity-25"
            aria-label="Send to Forge"
          >
            <ArrowUp className="size-4.5" />
          </button>
        </div>
      </div>
    </form>
  );
}
