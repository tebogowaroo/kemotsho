import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/atoms/card"
import { Button } from "@/shared/ui/atoms/button"

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your password and account security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Password</label>
                        <Button intent="outline" className="w-full sm:w-auto justify-start">
                            Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
