import type { Metadata } from "next";
import { ContactsClient } from "./_components/ContactsClient";

export const metadata: Metadata = {
    title: "Contacts | Dashboard",
};

export default function ContactsPage() {
    return <ContactsClient />;
}
