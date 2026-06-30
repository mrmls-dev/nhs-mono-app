import { Check, ShieldCheck } from "lucide-react";
import BuyerMatchSurvey from "@/components/BuyerMatchSurvey";
import Reveal from "@/components/Reveal";
import { HERO_BULLETS, type CountyOption } from "@/lib/home-data";

export default function HomeHero({
    counties,
    agentId,
}: {
    counties?: CountyOption[];
    agentId?: string;
}) {
    return (
        <section className="relative overflow-hidden border-b border-border bg-muted/30">
            {/* Decorative grid + glow — atmosphere without leaning on color */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage:
                        "radial-gradient(ellipse 80% 60% at 30% 0%, black, transparent 75%)",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="container relative mx-auto grid gap-10 px-5 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
                <div className="flex flex-col gap-6">
                    <Reveal>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur">
                            <ShieldCheck
                                className="size-3.5 text-primary"
                                aria-hidden
                            />
                            New construction, made simple
                        </span>
                    </Reveal>

                    <Reveal delay={0.08}>
                        <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-foreground text-balance sm:text-5xl xl:text-6xl">
                            Find the brand-new home that fits your life.
                        </h1>
                    </Reveal>

                    <Reveal delay={0.16}>
                        <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                            Skip the endless scrolling. Answer a few quick
                            questions and get a hand-picked list of
                            new-construction homes — plus the builder incentives
                            most buyers never hear about.
                        </p>
                    </Reveal>

                    <Reveal delay={0.24}>
                        <ul className="flex flex-col gap-3">
                            {HERO_BULLETS.map((b) => (
                                <li
                                    key={b}
                                    className="flex items-center gap-3 text-sm font-medium text-foreground sm:text-base"
                                >
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Check className="size-3.5" aria-hidden />
                                    </span>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    <Reveal delay={0.3}>
                        <p className="text-xs text-muted-foreground">
                            Free · No obligation · Backed by local specialists
                        </p>
                    </Reveal>
                </div>

                {/* Reserve a stable column height so the hero doesn't resize as
                    the survey steps change, and vertically center the card
                    (which hugs its own content) within that reserved space. */}
                <Reveal
                    delay={0.18}
                    y={28}
                    className="lg:flex lg:min-h-120 lg:flex-col lg:justify-center lg:pl-4"
                >
                    <BuyerMatchSurvey counties={counties} agentId={agentId} />
                </Reveal>
            </div>
        </section>
    );
}
