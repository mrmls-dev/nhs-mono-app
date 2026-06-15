const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function uploadFile(
    file: File,
    folder?: string,
): Promise<{ url: string; key: string }> {
    const endpoint = new URL(`${API_BASE}/storage/upload`);
    if (folder) endpoint.searchParams.set("folder", folder);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(endpoint.toString(), { method: "POST", body: form });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Upload failed"));
    }
    return res.json() as Promise<{ url: string; key: string }>;
}

export async function deleteFile(key: string): Promise<void> {
    const res = await fetch(`${API_BASE}/storage/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Delete failed"));
    }
}
