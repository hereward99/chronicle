import { useState } from "react";
import { Skull, Scroll, MapPin, Users, Flag, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogSize,
} from "@/components/ui/dialog";
import { EntityCard, EntityCardHeaderBar } from "@/components/ui/entity-card";
import { ChronicleDate } from "@/components/ChronicleDate";
import { statusBadgeClass } from "@/lib/statusColors";
import { notify } from "@/lib/notify";

/**
 * Kitchen-sink dev route (/dev/kitchen-sink).
 * Dev-only visual reference for the shared design system: tokens, typography,
 * buttons, badges, cards, dialogs, form controls and toast taxonomy.
 * Never registered in production builds.
 */

const SURFACE_TOKENS = [
  "background",
  "foreground",
  "card",
  "muted",
  "border",
  "input",
];

const BRAND_TOKENS = ["primary", "secondary", "accent", "destructive"];

const STATUS_TOKENS = ["success", "warning", "info", "destructive"];

const STATUSES = [
  "Active",
  "Ally",
  "Rival",
  "Enemy",
  "Planned",
  "Completed",
  "Dead",
  "Unknown",
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
      <Separator />
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="space-y-1">
      <div
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `hsl(var(--${token}))` }}
      />
      <p className="text-xs text-muted-foreground font-mono">--{token}</p>
    </div>
  );
}

export default function KitchenSink() {
  const [dialogSize, setDialogSize] = useState<DialogSize | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-5xl">
      <header className="space-y-2">
        <Badge variant="outline">dev only</Badge>
        <h1 className="font-display text-4xl text-foreground">Kitchen Sink</h1>
        <p className="text-muted-foreground">
          Living reference for Sanctum's shared design system. This route is not
          registered in production builds.
        </p>
      </header>

      <Section title="Colour tokens" description="Always use tokens, never raw hex or palette utilities.">
        <div className="space-y-4">
          {[
            { label: "Surfaces", tokens: SURFACE_TOKENS },
            { label: "Brand", tokens: BRAND_TOKENS },
            { label: "Semantic status", tokens: STATUS_TOKENS },
          ].map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-sm text-muted-foreground">{group.label}</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {group.tokens.map((t) => (
                  <Swatch key={t} token={t} />
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="h-14 rounded-md bg-gradient-subtle border border-border" />
            <div className="h-14 rounded-md shadow-gothic bg-card border border-border" />
            <div className="h-14 rounded-md shadow-crimson bg-card border border-border" />
          </div>
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          <h1 className="font-display text-4xl text-foreground">Display / Cinzel 4xl</h1>
          <h2 className="font-display text-2xl text-foreground">Display / Cinzel 2xl</h2>
          <p className="text-base text-foreground">
            Body text in the default sans stack — used for descriptions, form
            copy and list content.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted small text for metadata and helper copy.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          {(["default", "secondary", "outline", "ghost", "destructive", "link"] as const).map(
            (variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ),
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Icon button">
            <Skull className="h-4 w-4" />
          </Button>
          <Button disabled>Disabled</Button>
          <Button offlineDisabled>Offline-guarded</Button>
        </div>
      </Section>

      <Section title="Status badges" description="statusBadgeClass() is the single source of truth.">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Badge key={s} className={statusBadgeClass("character", s)}>
              {s}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["default", "secondary", "outline", "destructive"] as const).map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Entity cards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityCard>
            <EntityCardHeaderBar
              leading={<Skull className="h-5 w-5 text-primary" />}
              title="Rosa Marquez"
              subtitle={<ChronicleDate value={new Date().toISOString()} prefix="Created" withIcon />}
              badge={<Badge className={statusBadgeClass("character", "Active")}>Active</Badge>}
            />
            <CardContent className="text-sm text-muted-foreground">
              List-variant card with the standard header bar.
            </CardContent>
          </EntityCard>

          <EntityCard highlighted>
            <EntityCardHeaderBar
              leading={<Users className="h-5 w-5 text-primary" />}
              title="The Ashen Court"
              subtitle="Primary coterie"
              actions={
                <Button size="icon" variant="ghost" aria-label="Example action">
                  <Scroll className="h-4 w-4" />
                </Button>
              }
            />
            <CardContent className="text-sm text-muted-foreground">
              Highlighted card (primary ring) with icon-only actions.
            </CardContent>
          </EntityCard>

          <EntityCard variant="panel" className="md:col-span-2">
            <EntityCardHeaderBar
              leading={<Flag className="h-5 w-5 text-primary" />}
              title="Panel variant"
              subtitle="Used for dashboard sections"
            />
            <CardContent className="text-sm text-muted-foreground">
              Subtle gradient surface, no hover affordance.
            </CardContent>
          </EntityCard>
        </div>
      </Section>

      <Section title="Dates">
        <div className="flex flex-col gap-2 text-sm">
          <ChronicleDate value={new Date().toISOString()} prefix="Played" withIcon />
          <ChronicleDate value={new Date().toISOString()} variant="short" withIcon />
          <ChronicleDate inGameStart="January 1939" inGameEnd="March 1939" prefix="Set in" withIcon />
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ks-input">Text input</Label>
            <Input id="ks-input" placeholder="Enter a name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ks-select">Select</Label>
            <Select>
              <SelectTrigger id="ks-select">
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ks-textarea">Textarea</Label>
            <Textarea id="ks-textarea" placeholder="Notes…" />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="ks-check" />
            <Label htmlFor="ks-check">Checkbox</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="ks-switch" />
            <Label htmlFor="ks-switch">Switch</Label>
          </div>
        </div>
      </Section>

      <Section title="Dialog sizes" description="sm = confirmations, md = forms, lg = full editors.">
        <div className="flex flex-wrap gap-3">
          {(["sm", "md", "lg"] as DialogSize[]).map((size) => (
            <Button key={size} variant="outline" onClick={() => setDialogSize(size)}>
              Open {size}
            </Button>
          ))}
        </div>
        <Dialog open={dialogSize !== null} onOpenChange={(o) => !o && setDialogSize(null)}>
          <DialogContent size={dialogSize ?? "md"}>
            <DialogHeader>
              <DialogTitle>Dialog — size {dialogSize}</DialogTitle>
              <DialogDescription>
                Standard header, body and footer layout.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Body content goes here.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogSize(null)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogSize(null)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Toast taxonomy" description="Always go through notify.*, never toast() directly.">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => notify.success("Saved", "Your changes were stored.")}>
            success
          </Button>
          <Button variant="outline" onClick={() => notify.error("Something failed", "Try again shortly.")}>
            error
          </Button>
          <Button variant="outline" onClick={() => notify.offline("Deleting a note")}>
            offline
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.undo({
                description: "Note deleted",
                perform: () => undefined,
                onUndo: () => notify.success("Restored"),
                successMessage: "Note deleted",
              })
            }
          >
            undo
          </Button>
        </div>
      </Section>

      <Section title="Loading states">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityCard>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </EntityCard>
          <EntityCard variant="panel">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2 h-full">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <p className="font-display text-lg text-foreground">Empty state</p>
              <p className="text-sm text-muted-foreground">
                Icon, title, one line of guidance, then a primary action.
              </p>
              <Button size="sm">
                <CalendarDays className="h-4 w-4 mr-2" />
                Create the first one
              </Button>
            </CardContent>
          </EntityCard>
        </div>
      </Section>
    </div>
  );
}
