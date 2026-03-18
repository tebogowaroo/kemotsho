"use client"

import { ContactSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react"
import { Option } from "effect"
import { useState, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { submitContactForm } from "@/app/actions/contact"
import { Button } from "@/shared/ui/atoms/button"
import { Input } from "@/shared/ui/atoms/input"
import { Textarea } from "@/shared/ui/atoms/textarea"
import { Label } from "@/shared/ui/atoms/label"

type ContactData = Schema.Schema.Type<typeof ContactSection>["data"]

// Helper to safely unwrap Option-like objects after JSON serialization
const getVal = <T,>(opt: any, fallback: T | null = null): T | null => {
    if (!opt) return fallback
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return fallback
    // If we call getVal for a string, and receive an object that isn't matched above, it's likely a malformed Option or wrong type
    if (typeof opt === 'object' && opt !== null) return fallback
    return opt 
}

export function ContactBlock({ data }: { data: ContactData }) {
    const title = getVal<string>(data.title) || "Get in Touch"
    const subtitle = getVal<string>(data.subtitle)
    const email = getVal<string>(data.email)
    const phone = getVal<string>(data.phone)
    const address = getVal<string>(data.address)
    const schedules = getVal<string>(data.schedules)
    
    // Safely verify branches array. Schema decodeUnknown might turn arrays into weird chunks if misused, but usually it's just an array of option-heavy objects.
    // The key issue is that `branches` elements have Option fields (address, phone, etc). We need to unwrap them!
    const rawBranches = (data.branches && Array.isArray(data.branches)) ? data.branches : []
    const branches = rawBranches.map(b => ({
        name: b.name,
        email: getVal<string>(b.email),
        phone: getVal<string>(b.phone),
        address: getVal<string>(b.address),
        schedules: getVal<string>(b.schedules),
        mapUrl: getVal<string>(b.mapUrl)
    }))
    
    // Check if showForm is wrapped in an Option (Effect < 3.x style) or direct boolean
    const rawShowForm = data.showForm
    const showForm = (rawShowForm && typeof rawShowForm === 'object' && '_tag' in rawShowForm) 
        ? (rawShowForm as any).value 
        : (rawShowForm ?? false)

    // Form State
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const formRef = useRef<HTMLFormElement>(null)
    const recaptchaRef = useRef<ReCAPTCHA>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setStatus("loading")
        setErrorMessage("")

        const formData = new FormData(e.currentTarget)
        const captchaToken = recaptchaRef.current?.getValue()

        if (!captchaToken) {
            setStatus("error")
            setErrorMessage("Please complete the captcha verification.")
            return
        }

        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
            token: captchaToken
        }

        const result = await submitContactForm(payload)

        if (result.success) {
            setStatus("success")
            formRef.current?.reset()
            recaptchaRef.current?.reset()
        } else {
            setStatus("error")
            setErrorMessage(result.error || "Something went wrong")
            recaptchaRef.current?.reset()
        }
    }

    return (
        <section className="py-16 md:py-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className=" w-full px-4  md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center  mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="max-w-[700px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full  mx-auto items-start">
                     {/* Contact Form - Swapped to Left (lg:order-1) */}
                    {showForm && (
                        <div className="lg:col-span-8 lg:order-1 bg-background p-8 md:p-10 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-2xl font-semibold mb-6">Send us a message</h3>
                             {status === "success" ? (
                                <div className="bg-green-50 text-green-700 p-6 rounded-lg text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                            <Send className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-lg mb-2">Message Sent!</h4>
                                    <p>Thank you for reaching out. We'll get back to you shortly.</p>
                                    <Button 
                                        onClick={() => setStatus("idle")} 
                                        intent="outline" 
                                        className="mt-6"
                                    >
                                        Send another message
                                    </Button>
                                </div>
                            ) : (
                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" name="name" required placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" name="subject" required placeholder="How can we help?" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea 
                                            id="message" 
                                            name="message" 
                                            required 
                                            placeholder="Tell us about your project..." 
                                            className="min-h-[120px]"
                                        />
                                    </div>

                                    <div className="py-2">
                                        <ReCAPTCHA
                                            ref={recaptchaRef}
                                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"} // Use Test Key if missing
                                        />
                                    </div>

                                    {status === "error" && (
                                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={status === "loading"} className="w-full">
                                        {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Message
                                    </Button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Contact Info - Swapped to Right (lg:order-2) */}
                    <div className="lg:col-span-4 lg:order-2 flex flex-col gap-5  pt-2 max-w-md">
                        {email && (
                            <a href={`mailto:${email}`} className="flex items-center gap-3 group transition-all">
                                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
                                    <p className="text-sm font-medium break-all">{email}</p>
                                </div>
                            </a>
                        )}

                        {phone && (
                            <a href={`tel:${phone}`} className="flex items-center gap-3 group transition-all">
                                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p>
                                    <p className="text-sm font-medium">{phone}</p>
                                </div>
                            </a>
                        )}

                        {address && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Office</p>
                                    <p className="text-sm font-medium whitespace-pre-line leading-snug">{address}</p>
                                </div>
                            </div>
                        )}

                        {schedules && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Hours</p>
                                    <p className="text-sm font-medium whitespace-pre-line leading-snug">{schedules}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Branches */}
                {branches && branches.length > 0 && (
                     <div className="mt-16 md:mt-24 border-t pt-12 md:pt-16">
                         <h3 className="text-2xl font-bold text-center mb-12">Our Branches</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                             {branches.map((branch, i) => (
                                 <div key={i} className="bg-background rounded-lg p-6 shadow-sm border flex flex-col space-y-4">
                                     <h4 className="font-semibold text-lg">{branch.name}</h4>
                                     
                                     <div className="space-y-3 text-sm text-muted-foreground">
                                         {branch.address && (
                                             <div className="flex items-start gap-3">
                                                 <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                                 <span className="whitespace-pre-line">{branch.address}</span>
                                             </div>
                                         )}
                                          {branch.phone && (
                                             <div className="flex items-center gap-3">
                                                 <Phone className="h-4 w-4 shrink-0" />
                                                 <a href={`tel:${branch.phone}`} className="hover:text-primary transition-colors">{branch.phone}</a>
                                             </div>
                                         )}
                                          {branch.email && (
                                             <div className="flex items-center gap-3">
                                                 <Mail className="h-4 w-4 shrink-0" />
                                                  <a href={`mailto:${branch.email}`} className="hover:text-primary break-all transition-colors">{branch.email}</a>
                                             </div>
                                         )}
                                         {branch.schedules && (
                                             <div className="flex items-start gap-3">
                                                 <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                                                 <span>{branch.schedules}</span>
                                             </div>
                                         )}
                                     </div>

                                     {branch.mapUrl && (
                                         <div className="pt-2 mt-auto">
                                             <Button intent="outline" size="sm" asChild className="w-full">
                                                <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer">
                                                    View on Map
                                                </a>
                                            </Button>
                                         </div>
                                     )}
                                 </div>
                             ))}
                         </div>
                     </div>
                )}
            </div>
        </section>
    )
}
