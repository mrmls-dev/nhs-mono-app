import type { Metadata } from "next";
import { ScheduleEmbedClient } from "./_components/ScheduleEmbedClient";

export const metadata: Metadata = {
    title: "Schedule Embed | Dashboard",
};

export default function ScheduleEmbedPage() {
    return <ScheduleEmbedClient />;
}
