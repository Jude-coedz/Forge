import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Copy,
  Monitor,
  RefreshCw,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";
import { LoadingState, ScreenShell } from "./shared";

function securePrototypeHtml(html: string) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; media-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';">`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${policy}`);
  }

  return `<!doctype html><html><head>${policy}</head><body>${html}</body></html>`;
}

export function PrototypeScreen() {
  const f = useForge();
  const conv = f.conv!;
  const prototype = conv.prototype;
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const securedHtml = useMemo(
    () => prototype ? securePrototypeHtml(prototype.html) : "",
    [prototype],
  );

  if (f.generating && !prototype) {
    return (
      <LoadingState
        title="Forging the working prototype…"
        body="Gemini is turning the locked V1 into a small interactive product surface, not another static mockup."
        mode="prototype"
      />
    );
  }

  if (!prototype) {
    return (
      <ScreenShell
        eyebrow="5 · Prototype"
        title="Turn the decision into something you can use"
        description="Forge builds a self-contained interactive prototype from the locked Build Brief so you can test the core workflow before implementation."
      >
        <div className="max-w-3xl rounded-[24px] border border-line-strong bg-raised p-6 shadow-[var(--shadow-float)]">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-spark-soft text-spark">
            <Sparkles className="size-5" />
          </div>
          <h3 className="mt-5 text-[20px] font-semibold tracking-tight">No prototype yet</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-ink-3">
            The Build Brief is already saved. Generate the prototype again without changing the product decision.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={f.buildPrototype}>
              <Sparkles className="size-3.5" />
              Build working prototype
            </Button>
            <Button variant="ghost" onClick={() => f.setProjectStage("brief")}>
              <ArrowLeft className="size-3.5" />
              Back to brief
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      eyebrow="5 · Prototype"
      title="Use the product before you build the product"
      description="This prototype is generated from the locked V1. Use it to inspect the workflow, interaction assumptions, and product shape before handing the decision to engineering."
      wide
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-[24px] border border-line-strong bg-raised shadow-[var(--shadow-float)]">
          <div className="flex min-h-13 flex-wrap items-center gap-3 border-b border-line bg-canvas/80 px-4 py-2.5">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-scorch/70" />
              <span className="size-2.5 rounded-full bg-molten/70" />
              <span className="size-2.5 rounded-full bg-temper/70" />
            </div>

            <div className="mx-auto hidden max-w-[360px] flex-1 items-center gap-2 rounded-lg border border-line bg-inset/70 px-3 py-1.5 text-[12px] text-ink-4 sm:flex">
              <Code2 className="size-3.5" />
              forge://prototype/{conv.productName || "v1"}
            </div>

            <div className="ml-auto flex items-center rounded-lg border border-line bg-inset/60 p-0.5">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={
                  "grid size-8 place-items-center rounded-md transition " +
                  (viewport === "desktop" ? "bg-raised text-ink shadow-sm" : "text-ink-4 hover:text-ink")
                }
                aria-label="Desktop preview"
              >
                <Monitor className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={
                  "grid size-8 place-items-center rounded-md transition " +
                  (viewport === "mobile" ? "bg-raised text-ink shadow-sm" : "text-ink-4 hover:text-ink")
                }
                aria-label="Mobile preview"
              >
                <Smartphone className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="flex min-h-[640px] items-start justify-center overflow-auto bg-[#e9ebee] p-3 dark:bg-[#090b0f] sm:p-5">
            <div
              className={
                "overflow-hidden bg-white shadow-[0_24px_80px_-40px_rgba(0,0,0,.45)] transition-[width,border-radius] duration-300 " +
                (viewport === "mobile"
                  ? "h-[720px] w-[390px] max-w-full rounded-[28px] border-[7px] border-[#17191d]"
                  : "h-[720px] w-full rounded-xl border border-black/10")
              }
            >
              <iframe
                key={prototype.builtAt + "-" + viewport}
                title={"Interactive prototype for " + (conv.productName || conv.title)}
                srcDoc={securedHtml}
                sandbox="allow-scripts allow-modals"
                className="h-full w-full border-0 bg-white"
              />
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-[24px] border border-line-strong bg-raised p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-spark">Prototype notes</p>
          <p className="mt-3 text-[15px] leading-6 text-ink-2">{prototype.summary}</p>

          {prototype.screens.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[12px] font-medium text-ink-4">Included states</p>
              <ol className="mt-3 space-y-2.5">
                {prototype.screens.map((screen, index) => (
                  <li key={screen + index} className="flex gap-3 text-[14px] leading-5 text-ink-2">
                    <span className="font-mono text-[11px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                    <span>{screen}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-6 grid gap-2 border-t border-line pt-5">
            <Button variant="secondary" onClick={f.buildPrototype} disabled={f.generating}>
              <RefreshCw className={"size-3.5 " + (f.generating ? "animate-spin" : "")} />
              Regenerate from brief
            </Button>
            <Button variant="ghost" onClick={f.copyPrototype}>
              <Copy className="size-3.5" />
              Copy prototype HTML
            </Button>
          </div>
        </aside>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={() => f.setProjectStage("brief")}>
          <ArrowLeft className="size-3.5" />
          Back to brief
        </Button>
        <Button variant="primary" onClick={() => f.setProjectStage("handoff")}>
          Prepare handoff
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </ScreenShell>
  );
}
