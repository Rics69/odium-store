"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateDisplayName, uploadAvatar } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitLabel({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : idle}</>;
}

export function DisplayNameForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState(updateDisplayName, null);
  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-3 rounded-xl border p-4">
      <Label htmlFor="display_name">Имя</Label>
      <Input id="display_name" name="display_name" defaultValue={defaultName} required />
      <Button type="submit">
        <SubmitLabel idle="Сохранить имя" busy="Сохраняем…" />
      </Button>
      {state && "error" in state && state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

export function AvatarForm() {
  const [state, action] = useActionState(uploadAvatar, null);
  return (
    <form action={action} className="flex max-w-md flex-col gap-2 rounded-xl border p-4">
      <Label htmlFor="avatar">Аватар</Label>
      <Input id="avatar" name="avatar" type="file" accept="image/*" />
      <Button type="submit" variant="secondary">
        <SubmitLabel idle="Загрузить" busy="Загружаем…" />
      </Button>
      {state && "error" in state && state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
