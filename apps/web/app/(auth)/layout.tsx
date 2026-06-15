export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted px-4 py-10">
            {children}
        </div>
    );
}
