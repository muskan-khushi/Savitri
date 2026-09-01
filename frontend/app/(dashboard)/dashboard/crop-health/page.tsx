import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";

/**
 * Crop Health — one job: upload a leaf photo, get a real diagnosis.
 * Maps to POST /api/v1/disease-detection (MobileNetV2/PlantVillage).
 * That endpoint honestly refuses to predict without a trained
 * checkpoint present — this page's empty/pending states need to
 * carry that same honesty once wired up (a 503 here should read as
 * "model not ready yet," never a silent fallback guess).
 */
export default function CropHealthPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Crop Health</h1>
      <p className="mt-1 text-soil/60">Upload a photo, get a real diagnosis — or an honest &quot;not sure.&quot;</p>
      <div className="mt-10">
        <EmptyState
          title="Photo upload coming next"
          body="This page will connect to the real MobileNetV2 disease-detection model — including its honest refusal to guess when no trained checkpoint is available."
          action={<Button variant="secondary" disabled>Upload photo (not yet wired)</Button>}
        />
      </div>
    </div>
  );
}
