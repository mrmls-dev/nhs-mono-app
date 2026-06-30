import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import Reveal from "@/components/Reveal";
import { BLOG_POSTS } from "@/lib/home-data";

export default function HomeBlog() {
    return (
        <section className="border-b border-border bg-background">
            <div className="container mx-auto flex flex-col gap-10 px-5 py-16 lg:py-24">
                <Reveal className="flex flex-col gap-3">
                    <span className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                        Recent news &amp; guides
                    </span>
                    <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                        Smarter moves for new-construction buyers
                    </h2>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        Tips, market insights, and financing know-how to help you
                        buy with confidence.
                    </p>
                </Reveal>

                <div className="grid gap-6 md:grid-cols-3">
                    {BLOG_POSTS.map((post, i) => (
                        <Reveal
                            key={post.id}
                            delay={i * 0.08}
                            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                        >
                            {/* Diagonal-stripe placeholder thumbnail */}
                            <div
                                className="relative h-40 bg-muted"
                                style={{
                                    backgroundImage:
                                        "repeating-linear-gradient(135deg, color-mix(in oklch, var(--primary) 12%, transparent) 0, color-mix(in oklch, var(--primary) 12%, transparent) 12px, transparent 12px, transparent 26px)",
                                }}
                            >
                                <Badge className="absolute top-3 left-3 rounded-full bg-background/85 text-foreground backdrop-blur hover:bg-background/85">
                                    {post.category}
                                </Badge>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 p-5">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{post.date}</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="size-3.5" aria-hidden />
                                        {post.readTime}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                    {post.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {post.excerpt}
                                </p>
                                <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-primary">
                                    Read more
                                    <ArrowRight
                                        className="size-4 transition-transform group-hover:translate-x-0.5"
                                        aria-hidden
                                    />
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
