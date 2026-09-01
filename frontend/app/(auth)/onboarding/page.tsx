import { Button } from "@/components/ui/button";

/**
 * Onboarding — one job: get a new farmer from "just signed up" to
 * "has a farm profile and knows how to ask Savitri a question."
 * Real Telegram bot flow already exists (backend/bot/telegram_bot.py)
 * and handles this exact job over chat — this web page is a parallel
 * path for anyone who lands on the site first rather than Telegram.
 */
export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl text-soil">Let&apos;s set up your farm</h1>
      <p className="mt-3 text-soil/60">
        Two minutes — location, crop, and how you&apos;d like to be reached.
      </p>
      <div className="mt-8 w-full rounded-3xl border border-dashed border-soil/20 bg-wheat/20 p-8 text-sm text-soil/60">
        Onboarding steps not yet built — the real farm-setup flow already
        works today over Telegram (/irrigation command). This page is a
        placeholder for the equivalent web flow.
      </div>
      <Button className="mt-6" asChild>
        <a href="https://t.me" target="_blank" rel="noreferrer">
          Set up via Telegram instead
        </a>
      </Button>
    </div>
  );
}
