import { KORAFLOW_PASTE } from "../../data/sample";
import { useForge } from "../../store/ForgeContext";
import { ForgeMark } from "../ui/primitives";
import { Composer } from "./Composer";

const GYM_PASTE = `Trainers at my gym keep class attendance in a WhatsApp group. They forget who showed up, so the front desk argues about memberships. They don’t want another dashboard. They want the session record captured from the chat, and they must be able to correct it when the AI gets a name wrong. Nothing should mark a member absent automatically. First version: one gym, class attendance only, mobile.`;

const STARTERS: { title: string; body: string; paste: string; explain?: boolean }[] = [
  {
    title: "Try the KoraFlow example",
    body: "A Lagos merchant WhatsApp thread — the path this product was designed around.",
    paste: KORAFLOW_PASTE,
  },
  {
    title: "A messy gym idea",
    body: "Different source material, same loop — so you can see it isn’t a single canned screen.",
    paste: GYM_PASTE,
  },
  {
    title: "How Forge works",
    body: "One forced decision: what category of product is this? Then a spec that includes failure modes.",
    paste: "",
    explain: true,
  },
];

export function Welcome() {
  const f = useForge();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <ForgeMark className="size-10" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-balance sm:text-4xl">What are you trying to build?</h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-pretty text-ink-3">
          Paste the messy version — notes, a voice memo transcript, a WhatsApp thread. I extract the problem, make you
          lock a product category, then write a spec that includes how it can go wrong.
        </p>
      </div>

      <Composer large autoFocus />

      <div className="mt-6 grid gap-2 md:grid-cols-3">
        {STARTERS.map((s) => (
          <button
            key={s.title}
            onClick={() => {
              if (s.explain) {
                f.setComposer("");
                f.sendChat(
                  "How does Forge work? Walk me through the loop before I paste anything — I want the category gate explained.",
                );
                return;
              }
              f.sendChat(s.paste);
            }}
            className="rounded-2xl border border-line bg-raised p-4 text-left hover:bg-surface"
          >
            <p className="text-[13px] font-medium">{s.title}</p>
            <p className="mt-1 text-[12px] text-pretty text-ink-3">{s.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
