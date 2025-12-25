import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ColorPicker } from "./color-picker";
import { Label } from "./label";

const meta: Meta<typeof ColorPicker> = {
  title: "UI/ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

function ColorPickerDemo({
  initialColor = "#D36135",
  label,
  presets,
}: {
  initialColor?: string;
  label?: string;
  presets?: string[];
}) {
  const [color, setColor] = useState(initialColor);

  return (
    <div className="flex items-center gap-4">
      <ColorPicker
        value={color}
        onChange={setColor}
        label={label}
        presets={presets}
      />
      <span className="text-sm font-mono">{color}</span>
    </div>
  );
}

export const Default: Story = {
  render: () => <ColorPickerDemo />,
};

export const WithLabel: Story = {
  render: () => <ColorPickerDemo label="Primary Color" />,
};

export const DifferentColors: Story = {
  render: () => (
    <div className="space-y-4">
      <ColorPickerDemo initialColor="#D36135" label="Primary" />
      <ColorPickerDemo initialColor="#3E5641" label="Accent" />
      <ColorPickerDemo initialColor="#FDF8F5" label="Background" />
    </div>
  ),
};

export const CustomPresets: Story = {
  render: () => (
    <ColorPickerDemo
      label="Brand Colors"
      presets={[
        "#EF4444", // Red
        "#F97316", // Orange
        "#EAB308", // Yellow
        "#22C55E", // Green
        "#3B82F6", // Blue
        "#8B5CF6", // Purple
        "#EC4899", // Pink
        "#000000", // Black
        "#FFFFFF", // White
        "#6B7280", // Gray
      ]}
    />
  ),
};

export const ThemeCustomizer: Story = {
  render: () => {
    const [primaryColor, setPrimaryColor] = useState("#D36135");
    const [accentColor, setAccentColor] = useState("#3E5641");
    const [bgColor, setBgColor] = useState("#FDF8F5");

    return (
      <div className="space-y-6 w-[350px]">
        <h3 className="font-semibold">Theme Customizer</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2">
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
              <span className="text-xs font-mono text-muted-foreground w-16">
                {primaryColor}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Accent Color</Label>
            <div className="flex items-center gap-2">
              <ColorPicker value={accentColor} onChange={setAccentColor} />
              <span className="text-xs font-mono text-muted-foreground w-16">
                {accentColor}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Background</Label>
            <div className="flex items-center gap-2">
              <ColorPicker value={bgColor} onChange={setBgColor} />
              <span className="text-xs font-mono text-muted-foreground w-16">
                {bgColor}
              </span>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ backgroundColor: bgColor }}
        >
          <h4 className="font-medium" style={{ color: primaryColor }}>
            Preview
          </h4>
          <p className="text-sm mt-1" style={{ color: accentColor }}>
            This is how your theme colors look together.
          </p>
        </div>
      </div>
    );
  },
};

export const InlineUsage: Story = {
  render: () => {
    const [color, setColor] = useState("#7C3AED");

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border w-fit">
        <ColorPicker value={color} onChange={setColor} />
        <div className="h-6 w-20 rounded" style={{ backgroundColor: color }} />
        <span className="text-sm font-mono">{color}</span>
      </div>
    );
  },
};
