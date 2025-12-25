import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ResizablePanelGroup>;

export const Horizontal: Story = {
  render: () => (
    <div className="h-[300px] w-full max-w-[600px] rounded-lg border">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15}>
          <div className="flex h-full items-center justify-center p-4 bg-muted/30">
            <span className="text-sm font-medium">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-sm font-medium">Main Content</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-[400px] w-full max-w-[400px] rounded-lg border">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4 bg-muted/30">
            <span className="text-sm font-medium">Editor</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-sm font-medium">Preview</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const ThreePanels: Story = {
  render: () => (
    <div className="h-[300px] w-full max-w-[800px] rounded-lg border">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={10}>
          <div className="flex h-full items-center justify-center p-4 bg-muted/30">
            <span className="text-sm font-medium">Nav</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60}>
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-sm font-medium">Content</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20} minSize={10}>
          <div className="flex h-full items-center justify-center p-4 bg-muted/30">
            <span className="text-sm font-medium">Aside</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const NestedPanels: Story = {
  render: () => (
    <div className="h-[400px] w-full max-w-[600px] rounded-lg border">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25}>
          <div className="flex h-full items-center justify-center p-4 bg-muted/30">
            <span className="text-sm font-medium">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70}>
              <div className="flex h-full items-center justify-center p-4">
                <span className="text-sm font-medium">Main</span>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30}>
              <div className="flex h-full items-center justify-center p-4 bg-muted/30">
                <span className="text-sm font-medium">Console</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const ClassroomLayout: Story = {
  render: () => (
    <div className="h-[400px] w-full max-w-[800px] rounded-lg border">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="flex h-full flex-col">
            <div className="flex-1 bg-slate-900 flex items-center justify-center">
              <span className="text-white text-sm">Video Stage</span>
            </div>
            <div className="h-12 border-t flex items-center justify-center bg-muted/30">
              <span className="text-xs text-muted-foreground">Controls</span>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="flex h-full flex-col border-l">
            <div className="h-10 border-b flex items-center px-3">
              <span className="text-sm font-medium">Chat</span>
            </div>
            <div className="flex-1 p-3 bg-muted/10">
              <span className="text-xs text-muted-foreground">Messages...</span>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const WithoutHandle: Story = {
  render: () => (
    <div className="h-[200px] w-full max-w-[500px] rounded-lg border">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4 bg-muted/30">
            <span className="text-sm">Left</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-sm">Right</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
