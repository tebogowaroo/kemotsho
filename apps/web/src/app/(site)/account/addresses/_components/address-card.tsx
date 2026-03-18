import { Button } from "@/shared/ui/atoms/button"
import { Badge } from "@/shared/ui/atoms/badge"
import { MapPin, Phone, Trash2, Edit2, Check } from "lucide-react"
import { setDefaultAddressAction, deleteAddressAction } from "@/app/actions/customer" // Assuming these exist or will exist
import { toast } from "sonner"
// Note: We need to import client deps in client components, but card can be server rendered with form actions?
// Ideally AddressCard is a Client Component to handle optimistic updates or toast feedback easily.

export interface AddressCardProps {
    address: any // Typed properly in usage
    isDefaultShipping: boolean
    isDefaultBilling: boolean
}

export function AddressCard({ address, isDefaultShipping, isDefaultBilling }: AddressCardProps) {
    
    // Server Actions used in forms for simplicity
    const setDefaultShipping = setDefaultAddressAction.bind(null, address.id, "shipping")
    const setDefaultBilling = setDefaultAddressAction.bind(null, address.id, "billing")
    const deleteAddress = deleteAddressAction.bind(null, address.id)

    return (
        <div className="bg-card border rounded-lg p-6 shadow-sm flex flex-col justify-between h-full relative group">
             <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Actions */}
                 <form action={async () => {
                    // Need a way to confirm delete?
                    "use server"
                    await deleteAddress()
                 }}>
                     <Button size="icon" intent="ghost" className="h-8 w-8 text-destructive">
                         <Trash2 className="h-4 w-4" />
                     </Button>
                 </form>
             </div>

            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">{address.firstName} {address.lastName}</h3>
                        {address.company && <p className="text-sm text-muted-foreground">{address.company}</p>}
                    </div>
                </div>

                <div className="text-sm space-y-1 text-muted-foreground flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p>{address.line1}</p>
                        {address.line2 && <p>{address.line2}</p>}
                        <p>{address.city}, {address.state} {address.postalCode}</p>
                        <p>{address.country}</p>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-2">
                     <Phone className="h-4 w-4" />
                     <span>{address.phone}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {isDefaultShipping && <Badge variant="default">Default Shipping</Badge>}
                    {isDefaultBilling && <Badge variant="secondary">Default Billing</Badge>}
                </div>
            </div>
            <div className="pt-6 border-t mt-6 grid grid-cols-2 gap-2">
                {!isDefaultShipping && (
                    <form action={async () => {
                        "use server"
                        await setDefaultShipping()
                    }}>
                        <Button intent="outline" size="sm" className="w-full">Set Shipping</Button>
                    </form>
                )}
                 {!isDefaultBilling && (
                    <form action={async () => {
                        "use server"
                        await setDefaultBilling()
                    }}>
                        <Button intent="outline" size="sm" className="w-full">Set Billing</Button>
                    </form>
                )}
                 {address.id ? (
                    <Button intent="outline" size="sm" asChild className="col-span-2">
                        <a href={`/account/addresses/${address.id}/edit`}>Edit Details</a>
                    </Button>
                 ) : (
                     <Button intent="outline" size="sm" disabled className="col-span-2">
                        Edit Details
                    </Button>
                 )}
            </div>
        </div>
    )
}
