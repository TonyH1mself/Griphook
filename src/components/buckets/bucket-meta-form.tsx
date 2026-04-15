"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBucketMeta, type BucketActionState } from "@/server/bucket-actions";
import { useActionState } from "react";

function fe(s: BucketActionState, k: string) {
  return s.fieldErrors?.[k];
}

export function BucketMetaForm({
  bucketId,
  name,
  description,
}: {
  bucketId: string;
  name: string;
  description: string | null;
}) {
  const bound = updateBucketMeta.bind(null, bucketId);
  const [state, action, pending] = useActionState<BucketActionState, FormData>(bound, {});

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`meta-name-${bucketId}`}>Name</Label>
        <Input
          id={`meta-name-${bucketId}`}
          name="name"
          defaultValue={name}
          className="min-h-11"
          required
        />
        {fe(state, "name") ? <p className="text-xs text-red-600">{fe(state, "name")}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`meta-desc-${bucketId}`}>Description</Label>
        <Textarea
          id={`meta-desc-${bucketId}`}
          name="description"
          defaultValue={description ?? ""}
          rows={3}
        />
        {fe(state, "description") ? (
          <p className="text-xs text-red-600">{fe(state, "description")}</p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" variant="secondary" className="min-h-11 rounded-2xl" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
