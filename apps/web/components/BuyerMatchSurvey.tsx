"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    MapPin,
    Sparkles,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { cn } from "@workspace/ui/lib/utils";
import { createBuyerLead } from "@/api/buyer-leads";
import {
    BATHROOM_OPTIONS,
    BUDGET_OPTIONS,
    BUDGET_PRICE_MAX,
    BUYER_MATCH_EVENT,
    CONSENT_TEXT,
    COUNTY_OPTIONS,
    HEADER_OFFSET,
    HOME_TYPE_OPTIONS,
    QUICK_BEDROOMS,
    type BuyerMatchAnswers,
    type BuyerMatchOpenDetail,
    type CountyOption,
} from "@/lib/home-data";

const AUTO_ADVANCE_MS = 200;
const LAST_PROGRESS_STEP = 4; // steps 1–4 are the question steps

// Step map: 0 intro · 1 location · 2 home type · 3 bathrooms · 4 budget ·
//           5 details (name + email) · 6 phone + consent.
// On submit we redirect to the filtered listing.
const STEP = {
    intro: 0,
    location: 1,
    homeType: 2,
    bathrooms: 3,
    budget: 4,
    details: 5,
    phone: 6,
} as const;

const leadSchema = z.object({
    firstName: z.string().min(1, "Please enter your first name"),
    lastName: z.string().min(1, "Please enter your last name"),
    phone: z.string().min(10, "Enter a valid phone number"),
    email: z.email("Enter a valid email address"),
});
type LeadValues = z.infer<typeof leadSchema>;

/** Deterministic match count (8–42) so the same answers always show the same number. */
function computeMatchCount(a: BuyerMatchAnswers): number {
    const seed = [a.location, a.homeType, a.bedrooms, a.bathrooms, a.budget]
        .filter(Boolean)
        .join("|");
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return 8 + (Math.abs(h) % 35);
}

const fallbackCounties: CountyOption[] = COUNTY_OPTIONS.map((name) => ({
    id: null,
    name,
}));

export default function BuyerMatchSurvey({
    counties,
    agentId,
}: {
    counties?: CountyOption[];
    agentId?: string;
}) {
    const router = useRouter();
    const countyOptions =
        counties && counties.length > 0 ? counties : fallbackCounties;

    const [step, setStep] = useState<number>(STEP.intro);
    const [location, setLocation] = useState("");
    const [countyId, setCountyId] = useState<string | null>(null);
    const [homeType, setHomeType] = useState<string | null>(null);
    const [bedrooms, setBedrooms] = useState<string | null>(null);
    const [bathrooms, setBathrooms] = useState<string | null>(null);
    const [budget, setBudget] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const answers: BuyerMatchAnswers = useMemo(
        () => ({ location, homeType, bedrooms, bathrooms, budget }),
        [location, homeType, bedrooms, bathrooms, budget]
    );
    const matchCount = useMemo(() => computeMatchCount(answers), [answers]);

    const scrollToCard = () => {
        const el = cardRef.current;
        if (!el) return;
        const top =
            el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
    };

    // CTA event bus: open the survey at a given step and scroll it into view.
    useEffect(() => {
        const onOpen = (e: Event) => {
            const detail = (e as CustomEvent<BuyerMatchOpenDetail>).detail;
            setStep(detail?.step ?? STEP.location);
            requestAnimationFrame(scrollToCard);
        };
        window.addEventListener(BUYER_MATCH_EVENT, onOpen);
        return () => window.removeEventListener(BUYER_MATCH_EVENT, onOpen);
    }, []);

    useEffect(() => {
        return () => {
            if (advanceTimer.current) clearTimeout(advanceTimer.current);
        };
    }, []);

    const goTo = (next: number) => setStep(next);
    const back = () => setStep((s) => Math.max(0, s - 1));

    /** Single-select steps auto-advance after a short beat. */
    const autoAdvance = (to: number) => {
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        advanceTimer.current = setTimeout(() => setStep(to), AUTO_ADVANCE_MS);
    };

    const selectCounty = (opt: CountyOption) => {
        setLocation(opt.name);
        setCountyId(opt.id);
    };

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<LeadValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: { firstName: "", lastName: "", phone: "", email: "" },
    });

    /** Validate the name/email step before moving to the phone step. */
    const handleDetailsNext = async () => {
        const ok = await trigger(["firstName", "lastName", "email"]);
        if (ok) goTo(STEP.phone);
    };

    const onSubmitLead = async (values: LeadValues) => {
        setSubmitting(true);

        // Persist the lead, attributed to this agent's site. Best-effort: a
        // failure here shouldn't trap the buyer, so we still hand them off.
        if (agentId) {
            try {
                await createBuyerLead({
                    agentId,
                    ...values,
                    consent,
                    location: location || undefined,
                    countyId,
                    homeType,
                    bedrooms,
                    bathrooms,
                    budget,
                    matchCount,
                });
            } catch (err) {
                console.error("Buyer lead submission failed:", err);
            }
        }

        // Hand the buyer off to the listing, pre-filtered to their answers.
        const params = new URLSearchParams();
        if (countyId) params.set("county", countyId);
        if (bedrooms) params.set("beds", bedrooms.replace("+", ""));
        if (bathrooms) params.set("baths", bathrooms.replace("+", ""));
        const priceMax = budget ? BUDGET_PRICE_MAX[budget] : null;
        if (priceMax) params.set("priceMax", String(priceMax));
        const qs = params.toString();
        router.push(qs ? `/communities?${qs}` : "/communities");
    };

    const showProgress = step >= STEP.location && step <= LAST_PROGRESS_STEP;

    return (
        <div
            id="buyer-match"
            ref={cardRef}
            className="relative w-full scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-2xl ring-1 shadow-foreground/10 ring-foreground/5 sm:p-8"
        >
            {/* Progress */}
            {showProgress && (
                <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>
                            Step {step} of {LAST_PROGRESS_STEP}
                        </span>
                        <span>
                            {Math.round((step / LAST_PROGRESS_STEP) * 100)}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                            style={{
                                width: `${(step / LAST_PROGRESS_STEP) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Fade-in wrapper, re-keyed per step */}
            <div key={step} className="animate-in duration-300 fade-in-0">
                {/* Step 0 — intro */}
                {step === STEP.intro && (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                                <Sparkles className="size-3.5" aria-hidden />
                                Buyer match
                            </span>
                            <h2 className="font-heading text-2xl font-bold text-foreground">
                                Let&rsquo;s find your match
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Answer a few quick questions and we&rsquo;ll
                                show you brand-new homes and builder incentives
                                that fit.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-foreground">
                                How many bedrooms?
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                                {QUICK_BEDROOMS.map((bd) => {
                                    const active = bedrooms === bd;
                                    return (
                                        <button
                                            key={bd}
                                            type="button"
                                            onClick={() => setBedrooms(bd)}
                                            aria-pressed={active}
                                            className={cn(
                                                "flex flex-col items-center gap-0.5 rounded-xl border py-3 transition-colors",
                                                active
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                                            )}
                                        >
                                            <span className="text-base leading-none font-bold">
                                                {bd}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[11px] font-medium",
                                                    active
                                                        ? "text-primary-foreground/80"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                Bed
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={() => goTo(STEP.location)}
                            disabled={!bedrooms}
                            className="h-11 w-full text-sm"
                        >
                            Start my match
                            <ArrowRight aria-hidden />
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            {bedrooms
                                ? "Takes about 30 seconds · No obligation"
                                : "Select bedrooms to begin"}
                        </p>
                    </div>
                )}

                {/* Step 1 — location */}
                {step === STEP.location && (
                    <StepShell
                        title="Where are you looking?"
                        subtitle="Search a city or pick a county."
                    >
                        <div className="relative">
                            <MapPin
                                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                value={location}
                                onChange={(e) => {
                                    setLocation(e.target.value);
                                    setCountyId(null);
                                }}
                                placeholder="City, county, or ZIP"
                                className="pl-9"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {countyOptions.map((county) => (
                                <Chip
                                    key={county.name}
                                    active={location === county.name}
                                    onClick={() => selectCounty(county)}
                                >
                                    {county.name}
                                </Chip>
                            ))}
                        </div>
                        <NavRow
                            onBack={back}
                            onNext={() => goTo(STEP.homeType)}
                            nextDisabled={location.trim().length === 0}
                        />
                    </StepShell>
                )}

                {/* Step 2 — home type */}
                {step === STEP.homeType && (
                    <StepShell
                        title="What type of home?"
                        subtitle="Pick the style that fits you best."
                    >
                        <div className="flex flex-col gap-2.5">
                            {HOME_TYPE_OPTIONS.map((opt) => {
                                const active = homeType === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setHomeType(opt.value);
                                            autoAdvance(STEP.bathrooms);
                                        }}
                                        className={cn(
                                            "flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all",
                                            active
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border bg-background hover:border-primary/50 hover:bg-muted"
                                        )}
                                    >
                                        <span className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold text-foreground">
                                                {opt.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {opt.description}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                                                active
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border"
                                            )}
                                        >
                                            {active && (
                                                <Check
                                                    className="size-3"
                                                    aria-hidden
                                                />
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <NavRow onBack={back} />
                    </StepShell>
                )}

                {/* Step 3 — bathrooms */}
                {step === STEP.bathrooms && (
                    <StepShell
                        title="How many bathrooms?"
                        subtitle="Tap to continue."
                    >
                        <div className="flex flex-wrap gap-2">
                            {BATHROOM_OPTIONS.map((ba) => (
                                <Chip
                                    key={ba}
                                    active={bathrooms === ba}
                                    onClick={() => {
                                        setBathrooms(ba);
                                        autoAdvance(STEP.budget);
                                    }}
                                >
                                    {ba}
                                </Chip>
                            ))}
                        </div>
                        <NavRow onBack={back} />
                    </StepShell>
                )}

                {/* Step 4 — budget */}
                {step === STEP.budget && (
                    <StepShell
                        title="What's your budget?"
                        subtitle="Tap to continue."
                    >
                        <div className="flex flex-wrap gap-2">
                            {BUDGET_OPTIONS.map((b) => (
                                <Chip
                                    key={b}
                                    active={budget === b}
                                    onClick={() => {
                                        setBudget(b);
                                        autoAdvance(STEP.details);
                                    }}
                                >
                                    {b}
                                </Chip>
                            ))}
                        </div>
                        <NavRow onBack={back} />
                    </StepShell>
                )}

                {/* Step 5 — details (name + email) */}
                {step === STEP.details && (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                <Sparkles className="size-3.5" aria-hidden />
                                {matchCount} matching homes found
                            </span>
                            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                                Connect with us
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                A few quick details so we can pull up the homes
                                that fit you best.
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleDetailsNext();
                            }}
                            noValidate
                            className="flex flex-col gap-4"
                        >
                            <FieldGroup>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        data-invalid={
                                            errors.firstName ? true : undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="bm-first">
                                            First name
                                        </FieldLabel>
                                        <Input
                                            id="bm-first"
                                            placeholder="Jordan"
                                            aria-invalid={
                                                errors.firstName
                                                    ? true
                                                    : undefined
                                            }
                                            {...register("firstName")}
                                        />
                                        {errors.firstName && (
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            errors.firstName
                                                                .message,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </Field>
                                    <Field
                                        data-invalid={
                                            errors.lastName ? true : undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="bm-last">
                                            Last name
                                        </FieldLabel>
                                        <Input
                                            id="bm-last"
                                            placeholder="Avery"
                                            aria-invalid={
                                                errors.lastName
                                                    ? true
                                                    : undefined
                                            }
                                            {...register("lastName")}
                                        />
                                        {errors.lastName && (
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            errors.lastName
                                                                .message,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </Field>
                                </div>
                                <Field
                                    data-invalid={
                                        errors.email ? true : undefined
                                    }
                                >
                                    <FieldLabel htmlFor="bm-email">
                                        Email
                                    </FieldLabel>
                                    <Input
                                        id="bm-email"
                                        type="email"
                                        placeholder="you@email.com"
                                        aria-invalid={
                                            errors.email ? true : undefined
                                        }
                                        {...register("email")}
                                    />
                                    {errors.email && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.email.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                            </FieldGroup>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={back}
                                    className="h-11 px-4"
                                >
                                    <ArrowLeft aria-hidden />
                                    Back
                                </Button>
                                <Button type="submit" className="h-11 flex-1">
                                    Continue
                                    <ArrowRight aria-hidden />
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 6 — phone + consent */}
                {step === STEP.phone && (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                                Almost there
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Add a phone number so a specialist can help if
                                you&rsquo;d like — then see your matches.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmitLead)}
                            noValidate
                            className="flex flex-col gap-4"
                        >
                            <Field
                                data-invalid={errors.phone ? true : undefined}
                            >
                                <FieldLabel htmlFor="bm-phone">
                                    Phone
                                </FieldLabel>
                                <Input
                                    id="bm-phone"
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    aria-invalid={
                                        errors.phone ? true : undefined
                                    }
                                    {...register("phone")}
                                />
                                {errors.phone && (
                                    <FieldError
                                        errors={[
                                            { message: errors.phone.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            {/* Consent (optional) */}
                            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
                                <p className="text-[11px] leading-snug text-muted-foreground">
                                    {CONSENT_TEXT}
                                </p>
                                <label className="flex items-start gap-2.5 text-xs font-medium text-foreground">
                                    <Checkbox
                                        checked={consent}
                                        onCheckedChange={(v) =>
                                            setConsent(v === true)
                                        }
                                        className="mt-0.5"
                                    />
                                    <span>I consent.</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={back}
                                    disabled={submitting}
                                    className="h-11 px-4"
                                >
                                    <ArrowLeft aria-hidden />
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="h-11 flex-1"
                                >
                                    {submitting ? (
                                        <Loader2
                                            className="animate-spin"
                                            aria-hidden
                                        />
                                    ) : (
                                        <>
                                            Show my matches
                                            <ArrowRight aria-hidden />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------------- */

function StepShell({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <h2 className="font-heading text-xl font-bold text-foreground">
                    {title}
                </h2>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function Chip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted"
            )}
        >
            {children}
        </button>
    );
}

function NavRow({
    onBack,
    onNext,
    nextDisabled,
    nextLabel = "Continue",
}: {
    onBack: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
}) {
    return (
        <div className="flex items-center gap-3 pt-1">
            <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-11 px-4"
            >
                <ArrowLeft aria-hidden />
                Back
            </Button>
            {onNext && (
                <Button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled}
                    className="h-11 flex-1"
                >
                    {nextLabel}
                    <ArrowRight aria-hidden />
                </Button>
            )}
        </div>
    );
}
