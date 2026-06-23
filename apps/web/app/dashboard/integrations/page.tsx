import type { Metadata } from "next";
import { IntegrationsClient } from "./_components/IntegrationsClient";

export const metadata: Metadata = {
    title: "Integrations | Dashboard",
};

export default function IntegrationsPage() {
    return <IntegrationsClient />;
}
