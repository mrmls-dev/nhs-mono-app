"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";
import type { CommunityFormValues } from "../community-schema";

export function SchoolFieldArray() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<CommunityFormValues>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "schools",
    });

    const schoolErrors = errors.schools;

    return (
        <div className="flex flex-col gap-3">
            {fields.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <GraduationCap />
                        </EmptyMedia>
                        <EmptyTitle>No schools yet</EmptyTitle>
                        <EmptyDescription>
                            Add nearby schools for this community.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                fields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                School #{index + 1}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => remove(index)}
                                aria-label="Remove school"
                            >
                                <Trash2 />
                            </Button>
                        </div>
                        <FieldGroup className="gap-3">
                            <Field
                                data-invalid={
                                    schoolErrors?.[index]?.name
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    placeholder="Sun 'n Lake Elementary"
                                    aria-invalid={
                                        schoolErrors?.[index]?.name
                                            ? true
                                            : undefined
                                    }
                                    {...register(`schools.${index}.name`)}
                                />
                                {schoolErrors?.[index]?.name && (
                                    <FieldError
                                        errors={[
                                            {
                                                message: schoolErrors[index]
                                                    ?.name?.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Field
                                    data-invalid={
                                        schoolErrors?.[index]?.type
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Type</FieldLabel>
                                    <Input
                                        placeholder="Public"
                                        aria-invalid={
                                            schoolErrors?.[index]?.type
                                                ? true
                                                : undefined
                                        }
                                        {...register(`schools.${index}.type`)}
                                    />
                                </Field>
                                <Field
                                    data-invalid={
                                        schoolErrors?.[index]?.grades
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Grades</FieldLabel>
                                    <Input
                                        placeholder="K-5"
                                        aria-invalid={
                                            schoolErrors?.[index]?.grades
                                                ? true
                                                : undefined
                                        }
                                        {...register(`schools.${index}.grades`)}
                                    />
                                </Field>
                                <Field
                                    data-invalid={
                                        schoolErrors?.[index]?.distance
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Distance</FieldLabel>
                                    <Input
                                        placeholder="0.9 mi."
                                        aria-invalid={
                                            schoolErrors?.[index]?.distance
                                                ? true
                                                : undefined
                                        }
                                        {...register(
                                            `schools.${index}.distance`,
                                        )}
                                    />
                                </Field>
                            </div>
                        </FieldGroup>
                    </div>
                ))
            )}

            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        append({
                            name: "",
                            type: "",
                            grades: "",
                            distance: "",
                        })
                    }
                >
                    <Plus data-icon="inline-start" />
                    Add school
                </Button>
            </div>
        </div>
    );
}
