/**
 * ChatMockup
 *
 * Per the plan's For Farmers page: "show, don't tell — a realistic
 * phone mockup of what a farmer actually receives." Content mirrors
 * the real backend's irrigation-advisory response shape (see
 * backend/app/services/irrigation_service.py) rather than inventing
 * a nicer-sounding fake message — this is genuinely what the
 * Telegram bot sends today, in English; Hindi rendering here previews
 * how it will look once Bhashini is wired into this exact bot flow.
 */
export function ChatMockup() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-8 border-soil bg-soil p-2 shadow-xl">
      <div className="overflow-hidden rounded-[1.8rem] bg-wheat">
        <div className="bg-leaf px-4 py-3 text-sm font-medium text-dawn-cream">
          Savitri
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-dawn-cream px-4 py-3 text-sm text-soil shadow-sm">
            <span className="font-devanagari">नमस्ते! आज सिंचाई करनी चाहिए?</span>
            <span className="mt-1 block text-[11px] text-soil/50">You · 9:02 AM</span>
          </div>
          <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-terracotta/90 px-4 py-3 text-sm text-dawn-cream shadow-sm">
            <span className="font-devanagari">
              आज सिंचाई करें — लगभग 7 मिमी पानी दें। गेहूं को आज 7.1mm पानी चाहिए,
              बारिश से सिर्फ 0mm मिला।
            </span>
            <span className="mt-1 block text-[11px] text-dawn-cream/70">Savitri · 9:02 AM</span>
          </div>
          <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-dawn-cream px-4 py-3 text-sm text-soil shadow-sm">
            <span className="font-devanagari">धन्यवाद</span>
            <span className="mt-1 block text-[11px] text-soil/50">You · 9:03 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
