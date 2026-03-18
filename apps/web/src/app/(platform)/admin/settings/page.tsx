
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/atoms/card"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Button } from "@/shared/ui/atoms/button"
import { getShippingRuleAction } from "@/app/actions/settings"
import { ShippingForm } from "./_components/shipping-form"

// Force dynamic since we fetch fresh settings
export const dynamic = "force-dynamic"

export default async function SettingsPage() {
    const { success, data } = await getShippingRuleAction()
    
    // Fallback if fetch fails (shouldn't happen with our robust setup, but safe UI needed)
    // Convert to simple values if needed, but ShippingRule schema is mostly simple.
    // However, if we sent complex objects down (like Option), Next.js would complain.
    // The action encodes it via Schema.encode, so it SHOULD be clean JSON.
    // But let's verify if data is undefined (null is fine).
    const settings = (success && data) ? data : { id: "default", name: "default", type: "flat_rate" as const, baseCost: 10000, freeThreshold: 100000 }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Shipping Rules</CardTitle>
                <CardDescription>Configure shipping costs and thresholds.</CardDescription>
            </CardHeader>
            <CardContent>
                <ShippingForm initialData={settings} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>General settings for your store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-2">
                    <Label>Store Name</Label>
                    <Input defaultValue="Waroo Store" />
                 </div>
                 <div className="grid gap-2">
                    <Label>Support Email</Label>
                    <Input defaultValue="support@waroo.co.za" />
                 </div>
                 <Button>Save Changes</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
