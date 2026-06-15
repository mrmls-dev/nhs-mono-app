"use client";

import { useQuery } from "@tanstack/react-query";
import { getAgents, type Agent } from "@/api/agent";

/** Shared list query — reused by the agents table, switcher, and detail panels. */
export function useAgents() {
    return useQuery({ queryKey: ["agents"], queryFn: getAgents });
}

/** Resolve a single agent out of the cached list. */
export function useAgent(id: string): {
    agent: Agent | null;
    isLoading: boolean;
} {
    const { data: agents = [], isLoading } = useAgents();
    return { agent: agents.find((a) => a.id === id) ?? null, isLoading };
}
