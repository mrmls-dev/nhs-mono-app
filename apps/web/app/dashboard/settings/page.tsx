import type { Metadata } from "next";
import { SettingsClient } from "./_components/SettingsClient";

export const metadata: Metadata = {
    title: "Settings | Dashboard",
};

export default function SettingsPage() {
    return <SettingsClient />;
}
