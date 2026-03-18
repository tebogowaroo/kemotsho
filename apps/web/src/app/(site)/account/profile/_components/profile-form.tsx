"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { updateProfileAction } from "@/app/actions/customer"
import { toast } from "sonner"

interface ProfileFormProps {
    initialData: {
        firstName: string
        lastName: string
        phone: string
        email: string
    }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await updateProfileAction(data)
            if (res.success) {
                toast.success("Profile updated successfully")
            } else {
                toast.error(res.error || "Failed to update")
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                        id="firstName" 
                        value={data.firstName} 
                        onChange={e => setData({...data, firstName: e.target.value})} 
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                        id="lastName" 
                        value={data.lastName} 
                        onChange={e => setData({...data, lastName: e.target.value})} 
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    value={data.email} 
                    onChange={e => setData({...data, email: e.target.value})} 
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                    id="phone" 
                    type="tel" 
                    value={data.phone} 
                    onChange={e => setData({...data, phone: e.target.value})} 
                />
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
            </Button>
        </form>
    )
}
