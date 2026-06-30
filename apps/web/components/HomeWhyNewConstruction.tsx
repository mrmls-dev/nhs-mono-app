import { ArrowRight } from "lucide-react";
import OpenSurveyButton from "@/components/OpenSurveyButton";
import Reveal from "@/components/Reveal";
import { VALUE_PROPS } from "@/lib/home-data";

export default function HomeWhyNewConstruction() {
    return (
        <section className="border-b border-border bg-background">
            <div className="container mx-auto flex flex-col gap-10 px-5 py-16 lg:py-24">
                <Reveal className="flex max-w-2xl flex-col gap-3">
                    <span className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                        Why new construction
                    </span>
                    <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                        A smarter way to buy your next home
                    </h2>
                    <p className="text-base text-muted-foreground">
                        New-construction homes give buyers advantages that resale
                        simply can&rsquo;t match — from modern design to real
                        savings at closing and every month after.
                    </p>
                </Reveal>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {VALUE_PROPS.map((card, i) => (
                        <Reveal
                            key={card.no}
                            delay={(i % 4) * 0.06}
                            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                        >
                            <span className="font-heading text-4xl font-bold text-muted-foreground/20 transition-colors group-hover:text-primary/30">
                                {card.no}
                            </span>
                            <h3 className="text-base font-bold text-foreground">
                                {card.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {card.body}
                            </p>
                        </Reveal>
                    ))}

                    {/* CTA cell completes the grid (7 + 1 = 8) */}
                    <Reveal
                        delay={0.06}
                        className="flex flex-col justify-between gap-4 rounded-2xl bg-primary p-6 text-primary-foreground"
                    >
                        <p className="font-heading text-xl font-bold text-balance">
                            See which homes fit you.
                        </p>
                        <OpenSurveyButton
                            step={1}
                            variant="secondary"
                            className="h-11 w-full bg-background text-foreground hover:bg-background/90"
                        >
                            Find my match
                            <ArrowRight aria-hidden />
                        </OpenSurveyButton>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
