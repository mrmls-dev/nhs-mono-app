import type { Metadata } from "next";
import { MembersClient } from "./_components/MembersClient";

export const metadata: Metadata = {
    title: "Members | Dashboard",
};

export default function MembersPage() {
    return <MembersClient />;
}
