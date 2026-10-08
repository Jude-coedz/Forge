import { ArrowUp, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  compact = false,
}: {
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const f = useForge();
  const reducedMotion = useReducedMotion();
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

    const initialText = f.composer.trim();

    // Results may contain all earlier final segments on every callback. Rebuild
    // from the initial input instead of appending finals twice.
    recognition.onresult = (event) => {
      const segments: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript;
        if (transcript) segments.push(transcript.trim());
      }
      f.setComposer([initialText, ...segments].filter(Boolean).join(" "));
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try { recognition.start(); } catch { setListening(false); }
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div className={"forge-composer-shell group p-3.5 " + (listening ? "shadow-[var(--shadow-listening)]" : "")}>
        <textarea
          autoFocus={autoFocus}
          rows={compact ? 2 : 3}
          value={f.composer}
          onChange={(event) => f.setComposer(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={
            "w-full max-h-[260px] resize-y bg-transparent px-3 py-2 text-ink outline-none placeholder:text-ink-4 focus-visible:outline-none " +
            (compact ? "min-h-[84px] text-[16px] leading-7" : "min-h-[108px] text-[17px] leading-8")
          }
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

            <AnimatePresence>
            {listening && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={reducedMotion ? undefined : { opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 overflow-hidden"
                aria-label="Listening"
              >
                <span className="forge-wave h-2 w-0.5 rounded-full bg-spark [animation-delay:0ms]" />
                <span className="forge-wave h-3.5 w-0.5 rounded-full bg-spark [animation-delay:90ms]" />
                <span className="forge-wave h-2.5 w-0.5 rounded-full bg-spark [animation-delay:180ms]" />
                <span className="forge-wave h-4 w-0.5 rounded-full bg-spark [animation-delay:270ms]" />
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={reducedMotion ? undefined : { scale: 0.92 }}
            transition={{ type: "spring", stiffness: 440, damping: 30 }}
            type="submit"
            disabled={!f.composer.trim() || f.generating}
            className={
              "grid shrink-0 place-items-center rounded-2xl bg-white text-black transition-[background-color,opacity] duration-150 enabled:hover:bg-[#ebecf1] disabled:opacity-25 " +
              (compact ? "size-9" : "size-10")
            }
            aria-label="Send to Forge"
          >
            <ArrowUp className="size-4.5" />
          </motion.button>
        </div>
      </div>
    </form>
  );
}
