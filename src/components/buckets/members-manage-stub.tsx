import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function MembersManageStub() {
  return (
    <Card className="border-dashed">
      <CardTitle>Member management</CardTitle>
      <CardDescription>
        Adjusting shares and removing members will land here next. Admins can still change
        percentages via SQL or a future release; after someone joins with a code, rebalance splits
        to total 100%.
      </CardDescription>
    </Card>
  );
}
