import { Database, Moon, Sun } from "lucide-react";
import { useForge } from "../../store/ForgeContext";
import { Button } from "../ui/primitives";

export function SettingsView() {
  const f = useForge();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <div>
          <h1 className="font-display text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-ink-3">Configure how Forge looks and how project data is stored on this device.</p>
        </div>

        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-[13px] font-medium">Appearance</h2>
          <p className="mt-1 text-[12px] text-ink-4">Choose the interface theme for this browser.</p>
          <div className="mt-3 grid max-w-sm grid-cols-2 gap-2">
            <Button variant={f.theme === "dark" ? "primary" : "secondary"} onClick={() => f.theme !== "dark" && f.toggleTheme()}>
              <Moon className="size-3.5" /> Dark
            </Button>
            <Button variant={f.theme === "light" ? "primary" : "secondary"} onClick={() => f.theme !== "light" && f.toggleTheme()}>
              <Sun className="size-3.5" /> Light
            </Button>
          </div>
        </section>

        <section className="mt-8 border-t border-line pt-6">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-inset text-ink-3"><Database className="size-4" /></div>
            <div>
              <h2 className="text-[13px] font-medium">Project storage</h2>
              <p className="mt-1 max-w-lg text-[12px] leading-5 text-ink-3">
                Projects are currently saved in this browser. You have {f.conversations.length} saved project{f.conversations.length === 1 ? "" : "s"}. Rename or delete individual projects from the sidebar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
