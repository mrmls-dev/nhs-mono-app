import { newAgentSchema } from "../../../new-agent/new-agent-schema";

/** Edit reuses the create schema minus the password (handled separately). */
export const editAgentSchema = newAgentSchema.omit({ password: true });

export type EditAgentValues = typeof editAgentSchema;
