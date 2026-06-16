import type { Metadata } from "next";
import { CountyAssignment } from "../_components/CountyAssignment";
import { CommunityVisibility } from "../../../_components/CommunityVisibility";
import { ModelVideoManager } from "../../../_components/ModelVideoManager";

export const metadata: Metadata = {
    title: "Agent Coverage | Dashboard",
};

export default async function AgentCoveragePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Coverage
                </h1>
                <p className="text-sm text-muted-foreground">
                    Choose the counties this agent serves. Only communities in
                    the selected counties appear on their site.
                </p>
                <div className="mt-2">
                    <CountyAssignment agentId={id} />
                </div>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                    Communities
                </h2>
                <p className="text-sm text-muted-foreground">
                    Communities are visible by default. Turn off any the agent
                    should not display.
                </p>
                <div className="mt-2">
                    <CommunityVisibility agentId={id} />
                </div>
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                    Model videos
                </h2>
                <p className="text-sm text-muted-foreground">
                    Set a custom video for any model on this agent&rsquo;s site.
                    Expand a community and paste a URL (YouTube, Vimeo, or a
                    direct video link). Leave blank to use the default.
                </p>
                <div className="mt-2">
                    <ModelVideoManager agentId={id} />
                </div>
            </section>
        </div>
    );
}
