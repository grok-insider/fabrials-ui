import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Alert, AlertDescription, AlertTitle, Button, Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle, Field, Label, NativeCheckbox, NativeSelect,
  PageHeader, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@fabrials/ui";

const meta = { title: "Fabrials/Enterprise", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function EnterpriseDemo() {
  const [saved, setSaved] = useState("");
  return <main className="catalogue">
    <PageHeader title="Workspace preferences" description="Native form behavior and shared presentation without product-specific state." />
    <section className="catalogue-grid" aria-label="Preference patterns">
      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Preferences apply to this example only.</CardDescription></CardHeader>
        <form onSubmit={event => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSaved(`${data.get("density")} · notifications ${data.has("notifications") ? "enabled" : "disabled"}`);
        }}>
          <CardContent className="catalogue-stack">
            <Field label="Density">{props => <NativeSelect {...props} name="density" defaultValue="comfortable"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></NativeSelect>}</Field>
            <Label className="catalogue-row"><NativeCheckbox name="notifications" defaultChecked /> Notifications</Label>
          </CardContent>
          <CardFooter><Button type="submit">Save preferences</Button></CardFooter>
        </form>
      </Card>
      <div className="catalogue-stack">
        <Alert><AlertTitle>{saved ? "Preferences saved" : "Ready to configure"}</AlertTitle><AlertDescription>{saved || "Changes remain local to the component preview."}</AlertDescription></Alert>
        <Alert variant="destructive"><AlertTitle>Connection unavailable</AlertTitle><AlertDescription>Your existing data has not been changed. Reconnect before trying again.</AlertDescription></Alert>
      </div>
    </section>
    <section aria-label="Connected services">
      <Table regionLabel="Service status" aria-label="Connected services">
        <TableCaption>Synthetic connection inventory</TableCaption>
        <TableHeader><TableRow><TableHead scope="col">Service</TableHead><TableHead scope="col">State</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell>Team workspace</TableCell><TableCell>Connected</TableCell></TableRow><TableRow><TableCell>Operations</TableCell><TableCell>Reconnect required</TableCell></TableRow></TableBody>
      </Table>
    </section>
  </main>;
}

export const Preferences: Story = { render: () => <EnterpriseDemo /> };
