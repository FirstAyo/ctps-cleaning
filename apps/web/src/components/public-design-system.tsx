import {
  Alert,
  Badge,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
} from "@ctps/ui/content";
import { ImageComparison } from "@ctps/ui/image-comparison";
import { Container, Inline, ResponsiveGrid, Section, Stack } from "@ctps/ui/layout";
import { Accordion, Dialog, Drawer, Pagination, Tabs, ToastDemo } from "@ctps/ui/navigation";
import {
  Button,
  Checkbox,
  FieldGroup,
  FormDescription,
  FormError,
  Input,
  Label,
  LinkButton,
  RadioCard,
  Select,
  Switch,
  Textarea,
} from "@ctps/ui/primitives";
import { ThemeToggle } from "@ctps/ui/theme";

import { PublicFooter, PublicHeader } from "./public-shell";

const colorTokens = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["surface-elevated", "bg-surface-elevated"],
  ["primary", "bg-primary"],
  ["secondary", "bg-secondary"],
  ["accent", "bg-accent"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["destructive", "bg-destructive"],
] as const;

export function PublicDesignSystem() {
  return (
    <>
      <a className="skip-link" href="#design-main">
        Skip to main content
      </a>
      <PublicHeader />
      <main id="design-main">
        <section className="border-b border-border bg-secondary py-16 text-secondary-foreground sm:py-24">
          <Container>
            <Badge>Phase 2 preview</Badge>
            <h1 className="public-display mt-5 max-w-4xl">
              Clean precision, expressed with restraint.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-sidebar-muted">
              A development-only gallery for CTPS tokens, shared primitives, responsive composition,
              and accessible interaction.
            </p>
          </Container>
        </section>
        <Section>
          <Container>
            <Stack gap="lg">
              <header>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Foundations
                </p>
                <h2 className="public-heading mt-3">Color and typography</h2>
              </header>
              <ResponsiveGrid>
                {colorTokens.map(([token, className]) => (
                  <div
                    className="overflow-hidden rounded-lg border border-border bg-card"
                    key={token}
                  >
                    <div className={`h-24 ${className}`} />
                    <p className="p-3 font-mono text-sm">{token}</p>
                  </div>
                ))}
              </ResponsiveGrid>
              <div className="grid gap-6 rounded-lg border border-border bg-card p-6">
                <p className="public-heading">Editorial section heading</p>
                <p className="max-w-[65ch] text-lg leading-8">
                  Body large supports calm introductions and clear reading rhythm without
                  sacrificing density on smaller screens.
                </p>
                <p className="max-w-[70ch] text-muted-foreground">
                  Standard body copy uses the local system font stack, comfortable line height, and
                  semantic foreground tokens.
                </p>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Overline treatment
                </p>
              </div>
            </Stack>
          </Container>
        </Section>
        <Section className="bg-surface-muted/55">
          <Container>
            <h2 className="public-heading">Core interaction</h2>
            <Inline className="mt-8">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary action</Button>
              <Button variant="outline">Outline action</Button>
              <Button variant="ghost">Ghost action</Button>
              <Button variant="destructive">Destructive action</Button>
              <Button loading>Loading</Button>
              <ThemeToggle />
            </Inline>
            <ResponsiveGrid className="mt-10">
              <Card>
                <CardHeader>
                  <CardTitle>Window Cleaning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    A neutral interface label demonstrating the public card hierarchy.
                  </p>
                  <LinkButton className="mt-5" href="#forms" variant="outline">
                    View form patterns
                  </LinkButton>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pressure Washing</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge tone="success">Available pattern</Badge>
                  <p className="mt-3 text-muted-foreground">Status combines text with color.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Gutter Cleaning</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </Container>
        </Section>
        <Section>
          <Container>
            <div className="grid gap-12 lg:grid-cols-2">
              <div id="forms">
                <h2 className="public-heading">Form controls</h2>
                <form className="mt-8 grid gap-5">
                  <FieldGroup>
                    <Label htmlFor="demo-name">Demonstration label</Label>
                    <Input
                      aria-describedby="demo-name-description"
                      id="demo-name"
                      placeholder="Interface example"
                    />
                    <FormDescription id="demo-name-description">
                      Placeholders supplement visible labels.
                    </FormDescription>
                  </FieldGroup>
                  <FieldGroup>
                    <Label htmlFor="demo-service">Service label</Label>
                    <Select defaultValue="" id="demo-service">
                      <option disabled value="">
                        Choose a demonstration label
                      </option>
                      <option>Window Cleaning</option>
                      <option>Pressure Washing</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup>
                    <Label htmlFor="demo-notes">Notes label</Label>
                    <Textarea id="demo-notes" />
                  </FieldGroup>
                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-semibold">Radio-card foundation</legend>
                    <RadioCard
                      description="Neutral option for interface review."
                      label="Residential pattern"
                      name="property"
                    />
                    <RadioCard
                      description="Neutral option for interface review."
                      label="Commercial pattern"
                      name="property"
                    />
                  </fieldset>
                  <Inline>
                    <label className="flex min-h-11 items-center gap-2">
                      <Checkbox /> Checkbox label
                    </label>
                    <label className="flex min-h-11 items-center gap-2">
                      <Switch /> Switch label
                    </label>
                  </Inline>
                  <FormError>Example validation: describe how to correct the field.</FormError>
                </form>
              </div>
              <div>
                <h2 className="public-heading">Overlays and disclosure</h2>
                <Inline className="mt-8">
                  <Dialog
                    description="Focus is managed by the native dialog element."
                    title="Accessible dialog"
                    triggerLabel="Open dialog"
                  >
                    <p className="text-muted-foreground">This is a component demonstration only.</p>
                  </Dialog>
                  <Drawer title="Accessible drawer">
                    <p className="text-muted-foreground">
                      Escape and the close control dismiss this drawer.
                    </p>
                  </Drawer>
                  <ToastDemo />
                </Inline>
                <div className="mt-8">
                  <Tabs
                    tabs={[
                      { label: "Overview", content: <p>Keyboard-operable tab foundation.</p> },
                      { label: "Details", content: <p>Focused details remain concise.</p> },
                      {
                        label: "States",
                        content: <p>State content is associated with its tab.</p>,
                      },
                    ]}
                  />
                </div>
                <Accordion
                  items={[
                    {
                      title: "What is demonstrated?",
                      content:
                        "Native disclosure behavior with visible focus and reduced-motion-safe transitions.",
                    },
                    {
                      title: "What is deferred?",
                      content: "Business copy, data, routes, and workflows remain deferred.",
                    },
                  ]}
                />
              </div>
            </div>
          </Container>
        </Section>
        <Section className="bg-surface-muted/55">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Future-facing primitive
                </p>
                <h2 className="public-heading mt-3">Image comparison</h2>
                <p className="mt-5 max-w-xl text-muted-foreground">
                  The prototype uses abstract tokenized surfaces, not project imagery. It works with
                  pointer, touch, range-keyboard controls, and text labels.
                </p>
                <Callout className="mt-6" title="Reduced motion" tone="success">
                  System preferences remove decorative reveals and compress transition duration.
                </Callout>
              </div>
              <ImageComparison />
            </div>
          </Container>
        </Section>
        <Section>
          <Container>
            <h2 className="public-heading">System states</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <LoadingState
                description="Content shape is reserved while a neutral demonstration loads."
                title="Loading example"
              />
              <EmptyState
                description="No demonstration records match the current view."
                title="Empty example"
              />
              <ErrorState
                description="The demonstration could not be loaded. No private details are exposed."
                title="Error example"
              />
              <Alert title="Success example" tone="success">
                The demonstration state changed successfully.
              </Alert>
            </div>
            <div className="mt-8">
              <Pagination />
            </div>
            <div className="motion-reveal mt-12 rounded-lg border border-primary/30 bg-primary/8 p-8">
              <h3 className="text-xl font-semibold">Restrained reveal example</h3>
              <p className="mt-2 text-muted-foreground">
                This one-time CSS entrance becomes immediate under reduced motion.
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <PublicFooter />
    </>
  );
}
