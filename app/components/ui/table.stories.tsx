import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Badge } from "./badge";
import { Avatar, AvatarFallback } from "./avatar";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <div className="rounded-md border w-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell><Badge>Active</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Johnson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell><Badge>Active</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const StudentList: Story = {
  render: () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Lessons</TableHead>
            <TableHead>Last Lesson</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>MG</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Maria Garcia</p>
                  <p className="text-xs text-muted-foreground">maria@example.com</p>
                </div>
              </div>
            </TableCell>
            <TableCell>B2</TableCell>
            <TableCell>24</TableCell>
            <TableCell>Dec 20, 2024</TableCell>
            <TableCell><Badge>Active</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
              </div>
            </TableCell>
            <TableCell>A2</TableCell>
            <TableCell>8</TableCell>
            <TableCell>Dec 18, 2024</TableCell>
            <TableCell><Badge>Active</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>EK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Emma Kim</p>
                  <p className="text-xs text-muted-foreground">emma@example.com</p>
                </div>
              </div>
            </TableCell>
            <TableCell>C1</TableCell>
            <TableCell>45</TableCell>
            <TableCell>Dec 22, 2024</TableCell>
            <TableCell><Badge variant="secondary">Paused</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const BookingsTable: Story = {
  render: () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Dec 24, 2024</TableCell>
            <TableCell>10:00 AM</TableCell>
            <TableCell>Maria Garcia</TableCell>
            <TableCell>60 Min Conversation</TableCell>
            <TableCell>$45.00</TableCell>
            <TableCell><Badge variant="outline">Upcoming</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dec 23, 2024</TableCell>
            <TableCell>2:00 PM</TableCell>
            <TableCell>John Smith</TableCell>
            <TableCell>30 Min Grammar</TableCell>
            <TableCell>$25.00</TableCell>
            <TableCell><Badge>Completed</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dec 22, 2024</TableCell>
            <TableCell>11:00 AM</TableCell>
            <TableCell>Emma Kim</TableCell>
            <TableCell>90 Min Intensive</TableCell>
            <TableCell>$65.00</TableCell>
            <TableCell><Badge>Completed</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const CompactTable: Story = {
  render: () => (
    <div className="rounded-md border w-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Item</TableHead>
            <TableHead className="text-xs text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="py-1.5">Lesson Revenue</TableCell>
            <TableCell className="py-1.5 text-right">$1,250</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-1.5">Package Sales</TableCell>
            <TableCell className="py-1.5 text-right">$450</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-1.5">Digital Products</TableCell>
            <TableCell className="py-1.5 text-right">$120</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-1.5 font-semibold">Total</TableCell>
            <TableCell className="py-1.5 text-right font-semibold">$1,820</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const EmptyTable: Story = {
  render: () => (
    <div className="rounded-md border w-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
              No students yet. Add your first student to get started.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
