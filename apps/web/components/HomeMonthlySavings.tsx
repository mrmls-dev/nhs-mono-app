import { TrendingDown } from "lucide-react";
import Reveal from "@/components/Reveal";
import { SAVINGS_ITEMS, SAVINGS_TOTAL } from "@/lib/home-data";

export default function HomeMonthlySavings() {
    return (
        <section className="border-b border-border bg-muted/30">
            <div className="container mx-auto grid gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
                {/* Left — pitch + headline total */}
                <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
                    <Reveal className="flex flex-col gap-3">
                        <span className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                            Built-in monthly savings
                        </span>
                        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                            Your new home pays you back
                        </h2>
                        <p className="max-w-md text-base text-muted-foreground">
                            Every home is built with energy-efficient features
                            that automatically lower your monthly costs — before
                            you even move in.
                        </p>
                    </Reveal>

                    <Reveal
                        delay={0.1}
                        className="flex items-center gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6"
                    >
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <TrendingDown className="size-6" aria-hidden />
                        </span>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Total built-in savings
                            </span>
                            <span className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                                {SAVINGS_TOTAL}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                per month · automatically
                            </span>
                        </div>
                    </Reveal>
                </div>

                {/* Right — itemized breakdown */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {SAVINGS_ITEMS.map((item, i) => (
                        <Reveal
                            key={item.title}
                            delay={(i % 2) * 0.06 + Math.floor(i / 2) * 0.04}
                            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
                        >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <item.icon className="size-5" aria-hidden />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">
                                    {item.title}
                                </span>
                                <span className="text-sm font-bold text-primary">
                                    {item.amount}
                                    <span className="font-medium text-muted-foreground">
                                        /mo saved
                                    </span>
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
