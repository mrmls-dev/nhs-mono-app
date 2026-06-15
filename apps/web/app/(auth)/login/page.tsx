import type { Metadata } from "next";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
    title: "Sign in | National House Search",
};

export default function LoginPage() {
    return <LoginForm />;
}
