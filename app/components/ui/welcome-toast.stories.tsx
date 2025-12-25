import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const meta: Meta = {
  title: "UI/WelcomeToast",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Note: The actual WelcomeToast component uses sessionStorage and auto-dismisses.
// These stories show the visual appearance of toast notifications.

export const Success: Story = {
  render: () => (
    <div className="min-w-[280px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-900">
      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
      <p className="text-sm font-medium">Welcome! Your account has been created.</p>
    </div>
  ),
};

export const SuccessLong: Story = {
  render: () => (
    <div className="min-w-[280px] max-w-[400px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-900">
      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
      <p className="text-sm font-medium">
        Welcome to TutorLingua! Your profile is ready. Start by adding your first service.
      </p>
    </div>
  ),
};

export const Info_Toast: Story = {
  render: () => (
    <div className="min-w-[280px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-blue-50 border-blue-200 text-blue-900">
      <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
      <p className="text-sm font-medium">Your calendar has been synced.</p>
    </div>
  ),
};

export const Warning: Story = {
  render: () => (
    <div className="min-w-[280px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-amber-50 border-amber-200 text-amber-900">
      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
      <p className="text-sm font-medium">Please complete your profile to accept bookings.</p>
    </div>
  ),
};

export const ToastPositions: Story = {
  render: () => (
    <div className="relative w-[600px] h-[400px] border rounded-lg bg-muted/20">
      {/* Top Right (default) */}
      <div className="absolute top-4 right-4">
        <div className="min-w-[200px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-900">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium">Top Right</p>
        </div>
      </div>

      {/* Top Left */}
      <div className="absolute top-4 left-4">
        <div className="min-w-[200px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-blue-50 border-blue-200 text-blue-900">
          <Info className="h-5 w-5 text-blue-600" />
          <p className="text-sm font-medium">Top Left</p>
        </div>
      </div>

      {/* Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <div className="min-w-[200px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-amber-50 border-amber-200 text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium">Bottom Right</p>
        </div>
      </div>

      {/* Center Label */}
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
        Toast Position Examples
      </div>
    </div>
  ),
};

export const UsageExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 border rounded-lg max-w-lg">
      <h3 className="font-semibold">How to Use WelcomeToast</h3>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>1. Add <code className="bg-muted px-1 rounded">&lt;WelcomeToast /&gt;</code> to your layout.</p>
        <p>2. Before navigation, call:</p>
        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`import { setWelcomeToast } from "@/components/ui/welcome-toast";

// In your handler:
setWelcomeToast("Welcome! Your account is ready.");
router.push("/dashboard");`}
        </pre>
        <p>3. The toast will appear and auto-dismiss after 4 seconds.</p>
      </div>

      <div className="pt-4">
        <p className="text-sm font-medium mb-2">Preview:</p>
        <div className="min-w-[280px] rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-900">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Welcome! Your account is ready.</p>
        </div>
      </div>
    </div>
  ),
};
