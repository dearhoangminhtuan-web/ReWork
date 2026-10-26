"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestMagicLink } from "@/app/actions/auth";
import { Label, TextInput } from "@/components/ui/form";
import { Button, Notice } from "@/components/ui/print";

export function LoginForm() {
  const t = useTranslations("login");
  const [state, action, pending] = useActionState(requestMagicLink, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Label htmlFor="email">{t("email")}</Label>
      <TextInput id="email" name="email" type="email" autoComplete="email" required />
      <Button type="submit" disabled={pending}>
        {t("send")}
      </Button>
      {state?.status === "sent" ? <Notice>{t("sent")}</Notice> : null}
      {state && state.status !== "sent" ? <Notice tone="alert">{t("failed")}</Notice> : null}
    </form>
  );
}
