import { redirect } from "next/navigation";

export default function SharedRedirect() {
  redirect("/app/buckets?type=shared");
}
