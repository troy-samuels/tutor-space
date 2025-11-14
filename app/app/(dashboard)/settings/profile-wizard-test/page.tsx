import { ProfileWizard } from "@/components/settings/profile-wizard";
import { Step1Essential } from "@/components/settings/wizard-steps/step-1-essential";
import { Step2Professional } from "@/components/settings/wizard-steps/step-2-professional";
import { Step3Preferences } from "@/components/settings/wizard-steps/step-3-preferences";
import { Step4Social } from "@/components/settings/wizard-steps/step-4-social";

const testSteps = [
  {
    id: 1,
    title: "Essential Info",
    description: "Basic information to get started",
    component: Step1Essential,
  },
  {
    id: 2,
    title: "Professional Profile",
    description: "Make your profile stand out",
    component: Step2Professional,
  },
  {
    id: 3,
    title: "Booking Preferences",
    description: "Configure your availability settings",
    component: Step3Preferences,
  },
  {
    id: 4,
    title: "Social Proof",
    description: "Add your social media links",
    component: Step4Social,
  },
];

export default function ProfileWizardTestPage() {
  return (
    <div className="container py-8">
      <ProfileWizard
        steps={testSteps}
        initialValues={{ test: "data" }}
        onComplete={() => {
          alert("Wizard completed!");
        }}
      />
    </div>
  );
}
