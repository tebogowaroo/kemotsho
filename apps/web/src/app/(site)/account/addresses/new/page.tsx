import { AddressForm } from "@/app/(site)/account/addresses/_components/address-form"

export default function NewAddressPage() {
    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Add New Address</h1>
            <AddressForm />
        </div>
    )
}
