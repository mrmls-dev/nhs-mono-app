import Reveal from "@/components/Reveal";
import { TRUST_STATS } from "@/lib/home-data";

export default function HomeTrustStats() {
    return (
        <section className="border-b border-border bg-background">
            <div className="container mx-auto grid grid-cols-2 gap-8 px-5 py-10 lg:grid-cols-4 lg:py-12">
                {TRUST_STATS.map((stat, i) => (
                    <Reveal
                        key={stat.label}
                        delay={i * 0.08}
                        className="flex flex-col items-center gap-1 border-border text-center lg:border-l lg:first:border-l-0"
                    >
                        <span className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                            {stat.value}
                        </span>
                        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase sm:text-sm">
                            {stat.label}
                        </span>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}
