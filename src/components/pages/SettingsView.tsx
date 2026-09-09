import { Moon, Sun } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";

export function SettingsView() {
  const f = useForge();

  return (
    <div className="mx-auto w-full max-w-xl overflow-y-auto px-4 py-10 scrollbar-thin">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-ink-3">This is a local demo. Nothing here talks to a model API.</p>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium">Appearance</h2>
        <div className="mt-2 flex gap-2">
          <Button variant={f.theme === "dark" ? "primary" : "secondary"} onClick={() => f.theme !== "dark" && f.toggleTheme()}>
            <Moon className="size-3.5" />
            Dark
          </Button>
          <Button variant={f.theme === "light" ? "primary" : "secondary"} onClick={() => f.theme !== "light" && f.toggleTheme()}>
            <Sun className="size-3.5" />
            Light
          </Button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-raised p-4">
        <h2 className="text-[13px] font-medium">What this demo does</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-ink-2">
          <li>Extract a brief from pasted notes, transcripts, or threads</li>
          <li>Force a product-category lock before any spec</li>
          <li>Write a spec that includes failure modes</li>
          <li>Build a clickable prototype from that spec (Lovable-shaped preview)</li>
          <li>Copy spec markdown or prototype HTML</li>
          <li>Keep projects in this browser</li>
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-line-strong bg-surface p-4">
        <h2 className="text-[13px] font-medium">Later — not faked</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-ink-3">
          <li>Live language model</li>
          <li>Voice transcription</li>
          <li>Web research into evidence</li>
          <li>Eval against a real build</li>
          <li>Accounts, sharing, and publishing to Lovable / v0 / Cursor as a hosted app</li>
        </ul>
      </section>
    </div>
  );
}
