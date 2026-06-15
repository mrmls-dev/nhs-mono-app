"use client";

/**
 * Google-style search result preview. Shows the home page title + URL +
 * meta description, plus an example of how a sub-page (community) title looks
 * once the brand suffix template is applied.
 */
export function SearchSnippetPreview({
    title,
    description,
    domain,
    subPageExample,
}: {
    title: string;
    description: string;
    domain: string;
    subPageExample: string;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{domain}</span>
                <span className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
                    {title}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">
                    {description || "No meta description set."}
                </span>
            </div>

            <div className="flex flex-col gap-0.5 border-t pt-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Community / plan page title
                </span>
                <span className="text-base text-[#1a0dab] dark:text-[#8ab4f8]">
                    {subPageExample}
                </span>
            </div>
        </div>
    );
}
