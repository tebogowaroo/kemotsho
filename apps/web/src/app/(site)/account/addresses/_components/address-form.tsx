"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/atoms/select"
import { addAddressAction, updateAddressAction } from "@/app/actions/customer"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Zod schema matching Address domain (roughly)
const addressSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    company: z.string().optional(),
    line1: z.string().min(5, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().min(3, "Zip code is required"),
    country: z.string().min(2, "Country is required"),
    phone: z.string().min(5, "Phone is required"),
    email: z.string().email().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof addressSchema>

interface AddressFormProps {
    initialData?: FormValues
    onSuccess?: () => void
}

export function AddressForm({ initialData, onSuccess }: AddressFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const form = useForm<FormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: initialData || {
            firstName: "",
            lastName: "",
            company: "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "ZA",
            phone: "",
            email: ""
        }
    })

    const onSubmit = async (data: FormValues) => {
        setLoading(true)
        try {
            // Fill required Schema fields if missing/optional in Zod
            const payload = {
                ...data,
                // Ensure nulls for Schema.Option
                company: data.company || null,
                line2: data.line2 || null,
                state: data.state || null,
                email: data.email || "no-email@provided.com" // Fallback matching Domain requirement if user leaves blank
            }
            
            let res
            if (initialData?.id) {
                 res = await updateAddressAction(payload)
            } else {
                 res = await addAddressAction(payload)
            }

            if (res.success) {
                toast.success(initialData?.id ? "Address updated" : "Address added")
                router.refresh()
                router.push("/account/addresses")
                onSuccess?.()
            } else {
                toast.error("Operation failed")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...form.register("firstName")} />
                    {form.formState.errors.firstName && <p className="text-destructive text-xs">{form.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...form.register("lastName")} />
                    {form.formState.errors.lastName && <p className="text-destructive text-xs">{form.formState.errors.lastName.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input id="company" {...form.register("company")} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="line1">Address Line 1</Label>
                <Input id="line1" {...form.register("line1")} />
                {form.formState.errors.line1 && <p className="text-destructive text-xs">{form.formState.errors.line1.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                <Input id="line2" {...form.register("line2")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...form.register("city")} />
                    {form.formState.errors.city && <p className="text-destructive text-xs">{form.formState.errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" {...form.register("state")} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="postalCode">Zip / Postal Code</Label>
                    <Input id="postalCode" {...form.register("postalCode")} />
                    {form.formState.errors.postalCode && <p className="text-destructive text-xs">{form.formState.errors.postalCode.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select onValueChange={(val) => form.setValue("country", val)} defaultValue={form.getValues("country")}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ZA">South Africa</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            {/* Add more as needed */}
                        </SelectContent>
                    </Select>
                </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...form.register("phone")} />
                    {form.formState.errors.phone && <p className="text-destructive text-xs">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                </div>
            </div>

            <div className="pt-4 flex gap-4">
                <Button type="button" intent="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Address"}
                </Button>
            </div>
        </form>
    )
}
