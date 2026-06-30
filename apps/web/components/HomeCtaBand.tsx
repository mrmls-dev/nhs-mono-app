import Image from "next/image";
import { ArrowRight } from "lucide-react";
import OpenSurveyButton from "@/components/OpenSurveyButton";
import Reveal from "@/components/Reveal";

export default function HomeCtaBand() {
    return (
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
            {/* Houses photo under a brand-color wash to keep the high-contrast CTA */}
            <Image
                src="/images/community_houses.webp"
                alt=""
                fill
                sizes="100vw"
                className="absolute inset-0 object-cover object-center"
            />
            <div aria-hidden className="absolute inset-0 bg-primary/70" />
            <div className="relative container mx-auto flex flex-col items-center gap-6 px-5 py-16 text-center lg:py-24">
                <Reveal className="flex flex-col items-center gap-6">
                    <span className="text-xs font-semibold tracking-[0.25em] text-primary-foreground/70 uppercase">
                        ——— Don&rsquo;t wait ———
                    </span>
                    <h2 className="max-w-3xl font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                        Every month you wait costs you more.
                    </h2>
                    <p className="max-w-xl text-base text-primary-foreground/80">
                        New-construction inventory moves fast — the community
                        you want today may not be available next month. Start
                        your free match now.
                    </p>
                    <OpenSurveyButton
                        step={1}
                        variant="secondary"
                        className="h-12 bg-background px-8 text-base font-semibold text-foreground hover:bg-background/90"
                    >
                        Find my match
                        <ArrowRight aria-hidden />
                    </OpenSurveyButton>
                </Reveal>
            </div>
        </section>
    );
}
