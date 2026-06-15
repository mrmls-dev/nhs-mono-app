"use client";

import { useState } from "react";
import { Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import { getMyAgent, updateBranding } from "@/api/agent";

export function ScheduleEmbedClient() {
    const queryClient = useQueryClient();
    const { data: agent } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
    });

    // The saved value comes from the server; `draft` holds unsaved edits (null
    // until the user types). Deriving avoids seeding state from an effect.
    const saved = agent?.ghlScheduleEmbed ?? "";
    const [draft, setDraft] = useState<string | null>(null);
    const embed = draft ?? saved;
    const dirty = draft !== null && draft !== saved;

    const mutation = useMutation({
        mutationFn: () =>
            updateBranding(agent!.id, { ghlScheduleEmbed: embed }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-agent"] });
            setDraft(null);
            toast.success("Schedule embed saved.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const onSave = () => {
        if (agent) mutation.mutate();
    };
    const submitting = mutation.isPending;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Schedule Embed
                </h1>
                <p className="text-sm text-muted-foreground">
                    Paste the GoHighLevel booking widget embed. It appears on your
                    site&apos;s scheduling page.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Embed code</CardTitle>
                        <CardDescription>
                            Paste the full{" "}
                            <code className="font-mono text-xs">
                                &lt;iframe&gt;
                            </code>{" "}
                            snippet from GoHighLevel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Textarea
                            rows={10}
                            className="font-mono text-xs"
                            placeholder='<iframe src="https://api.mostro360.com/widget/booking/..." ...></iframe>'
                            value={embed}
                            onChange={(e) => setDraft(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDraft(null)}
                                disabled={!dirty || submitting}
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={onSave}
                                disabled={!dirty || submitting}
                            >
                                {submitting && (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                )}
                                Save embed
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Live preview</CardTitle>
                        <CardDescription>
                            How the booking widget renders on your site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {embed.trim() ? (
                            <iframe
                                title="Schedule embed preview"
                                className="h-[28rem] w-full rounded-lg border bg-background"
                                sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                                srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif}</style></head><body>${embed}</body></html>`}
                            />
                        ) : (
                            <Empty className="border border-dashed">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <CalendarClock />
                                    </EmptyMedia>
                                    <EmptyTitle>Nothing to preview</EmptyTitle>
                                    <EmptyDescription>
                                        Paste an embed snippet to see it here.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
