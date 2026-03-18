import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { ContactSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Button } from "@/shared/ui/atoms/button"
import { Plus, Trash2 } from "lucide-react"

type ContactData = Schema.Schema.Encoded<typeof ContactSection>["data"]

interface ContactEditorProps {
    section: any
    onChange: (data: ContactData) => void
}

export function ContactEditor({ section, onChange }: ContactEditorProps) {
    const data = section.data as ContactData

    const update = (key: keyof ContactData, value: any) => {
        onChange({ ...data, [key]: value })
    }

    const addBranch = () => {
        const current = data.branches || []
        update("branches", [...current, { name: "New Branch", email: null, phone: null, address: null, schedules: null, mapUrl: null }])
    }
    
    const updateBranch = (index: number, patch: any) => {
        const current = [...(data.branches || [])]
        if (current[index]) {
            current[index] = { ...current[index], ...patch }
            update("branches", current)
        }
    }

    const removeBranch = (index: number) => {
         const current = [...(data.branches || [])]
         current.splice(index, 1)
         update("branches", current)
    }

    return (
        <div className="grid gap-6">
             <div className="grid gap-2">
                <Label>Section Title</Label>
                <Input 
                    value={data.title || ""} 
                    onChange={(e) => update("title", e.target.value || null)} 
                    placeholder="e.g. Get in Touch"
                />
            </div>
            
            <div className="grid gap-2">
                <Label>Subtitle / Description</Label>
                <Textarea 
                    value={data.subtitle || ""} 
                    onChange={(e) => update("subtitle", e.target.value || null)} 
                    placeholder="Short description..."
                />
            </div>
            
            <div className="space-y-4 border p-4 rounded-md">
                 <Label className="text-base font-semibold">Primary Office / Head Office</Label>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input 
                            value={data.email || ""} 
                            onChange={(e) => update("email", e.target.value || null)} 
                            placeholder="info@example.com"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label>Phone</Label>
                        <Input 
                            value={data.phone || ""} 
                            onChange={(e) => update("phone", e.target.value || null)} 
                            placeholder="+1 234 567 890"
                        />
                    </div>
                 </div>

                 <div className="grid gap-2">
                    <Label>Address</Label>
                    <Textarea 
                        value={data.address || ""} 
                        onChange={(e) => update("address", e.target.value || null)} 
                        placeholder="123 Main St, City, Country"
                    />
                </div>
                
                 <div className="grid gap-2">
                    <Label>Opening Hours / Schedules</Label>
                    <Input 
                        value={data.schedules || ""} 
                        onChange={(e) => update("schedules", e.target.value || null)} 
                        placeholder="Mon-Fri: 9am - 5pm"
                    />
                </div>
            </div>

            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                     <Label className="text-base font-semibold">Additional Branches</Label>
                     <Button type="button" intent="secondary" size="sm" onClick={addBranch}>
                        <Plus className="mr-2 h-4 w-4" /> Add Branch
                     </Button>
                 </div>

                 <div className="grid gap-4">
                     {(data.branches || []).map((branch, idx) => (
                         <div key={idx} className="border p-4 rounded-md space-y-4 relative bg-card">
                             <div className="absolute right-4 top-4">
                                 <Button intent="danger" size="icon" className="h-6 w-6" onClick={() => removeBranch(idx)}>
                                     <Trash2 className="h-3 w-3" />
                                 </Button>
                             </div>

                             <div className="grid gap-2 pr-10">
                                 <Label>Branch Name</Label>
                                 <Input 
                                    value={branch.name} 
                                    onChange={(e) => updateBranch(idx, { name: e.target.value })}
                                    placeholder="e.g. Cape Town Branch"
                                 />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input 
                                        value={branch.email || ""} 
                                        onChange={(e) => updateBranch(idx, { email: e.target.value || null })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Phone</Label>
                                    <Input 
                                        value={branch.phone || ""} 
                                        onChange={(e) => updateBranch(idx, { phone: e.target.value || null })}
                                    />
                                </div>
                             </div>

                             <div className="grid gap-2">
                                <Label>Address</Label>
                                <Input 
                                    value={branch.address || ""} 
                                    onChange={(e) => updateBranch(idx, { address: e.target.value || null })}
                                />
                             </div>
                              <div className="grid gap-2">
                                <Label>Map URL (Google Maps Link)</Label>
                                <Input 
                                    value={branch.mapUrl || ""} 
                                    onChange={(e) => updateBranch(idx, { mapUrl: e.target.value || null })}
                                    placeholder="https://maps.google.com/..."
                                />
                             </div>
                         </div>
                     ))}
                 </div>
            </div>

            <div className="flex items-center gap-2 border p-4 rounded-lg bg-muted/20">
                <input 
                    type="checkbox"
                    id="showForm"
                    checked={data.showForm ?? false}
                    onChange={(e) => update("showForm", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="showForm" className="cursor-pointer">
                    Show Contact Form in this section
                </Label>
            </div>
        </div>
    )
}
