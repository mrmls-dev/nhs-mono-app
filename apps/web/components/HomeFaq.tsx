"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@workspace/ui/lib/utils";
import { FAQ_ITEMS } from "@/lib/home-data";

export default function HomeFaq() {
    return (
        <section className="border-b border-border bg-muted/30">
            <div className="container mx-auto grid gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.55 }}
                    className="lg:sticky lg:top-28 lg:self-start"
                >
                    <span className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                        New to new construction?
                    </span>
                    <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                        Answers, before you ask
                    </h2>
                    <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                        The essentials buyers want to know before touring their
                        first brand-new home. Still curious? A specialist is one
                        message away.
                    </p>
                </motion.div>

                <AccordionPrimitive.Root
                    type="single"
                    collapsible
                    defaultValue="item-0"
                    className="flex flex-col gap-3"
                >
                    {FAQ_ITEMS.map((item, i) => (
                        <motion.div
                            key={item.question}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.45, delay: i * 0.05 }}
                        >
                            <AccordionPrimitive.Item
                                value={`item-${i}`}
                                className={cn(
                                    "group rounded-2xl border border-border bg-card px-5 transition-colors",
                                    "data-[state=open]:border-primary/40 data-[state=open]:bg-primary/3",
                                )}
                            >
                                <AccordionPrimitive.Header>
                                    <AccordionPrimitive.Trigger className="flex w-full items-center gap-4 py-5 text-left outline-none focus-visible:rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50">
                                        <span className="font-heading text-sm font-bold text-primary tabular-nums">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="flex-1 text-base font-semibold text-foreground">
                                            {item.question}
                                        </span>
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-data-[state=open]:border-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                                            <Plus
                                                className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-45"
                                                aria-hidden
                                            />
                                        </span>
                                    </AccordionPrimitive.Trigger>
                                </AccordionPrimitive.Header>
                                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                                    <p className="pr-10 pb-5 pl-9 text-sm leading-relaxed text-muted-foreground">
                                        {item.answer}
                                    </p>
                                </AccordionPrimitive.Content>
                            </AccordionPrimitive.Item>
                        </motion.div>
                    ))}
                </AccordionPrimitive.Root>
            </div>
        </section>
    );
}
