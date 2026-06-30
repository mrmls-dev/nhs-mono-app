import {
    ArrowRight,
    CalendarCheck,
    ClipboardList,
    ListChecks,
    type LucideIcon,
} from "lucide-react";
import OpenSurveyButton from "@/components/OpenSurveyButton";
import Reveal from "@/components/Reveal";
import { HOW_IT_WORKS } from "@/lib/home-data";

const STEP_ICONS: LucideIcon[] = [ListChecks, ClipboardList, CalendarCheck];

export default function HomeHowItWorks() {
    return (
        <section className="border-b border-border bg-background">
            <div className="container mx-auto flex flex-col gap-12 px-5 py-16 lg:py-24">
                <Reveal className="flex max-w-2xl flex-col gap-3">
                    <span className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                        How it works
                    </span>
                    <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                        From first click to keys in three steps
                    </h2>
                </Reveal>

                <div className="relative">
                    {/* Connecting line (desktop) */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-8 right-[16.66%] left-[16.66%] hidden border-t-2 border-dashed border-border md:block"
                    />

                    <ol className="grid gap-10 md:grid-cols-3 md:gap-6">
                        {HOW_IT_WORKS.map((s, i) => {
                            const Icon = STEP_ICONS[i] ?? ListChecks;
                            return (
                                <Reveal
                                    key={s.no}
                                    as="li"
                                    delay={i * 0.1}
                                    className="flex flex-col items-center gap-4 text-center md:px-4"
                                >
                                    <div className="relative">
                                        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-8 ring-background">
                                            <Icon className="size-7" aria-hidden />
                                        </span>
                                        <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-card font-heading text-xs font-bold text-foreground">
                                            {s.no}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {s.title}
                                    </h3>
                                    <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                        {s.body}
                                    </p>
                                </Reveal>
                            );
                        })}
                    </ol>
                </div>

                <Reveal delay={0.1} className="flex justify-center">
                    <OpenSurveyButton step={1} className="h-11 px-6 text-sm">
                        Start my match
                        <ArrowRight aria-hidden />
                    </OpenSurveyButton>
                </Reveal>
            </div>
        </section>
    );
}
