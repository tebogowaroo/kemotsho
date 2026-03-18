import Link from "next/link"
import { TenantConfig } from "@kemotsho/core/config/tenant"

interface FooterProps {
    config: TenantConfig
}

export function Footer({ config }: FooterProps) {
    return (
        <footer className="w-full border-t bg-background py-12 md:py-16 lg:py-20">
             <div className="container px-4 md:px-6">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="space-y-4">
                         <h4 className="text-lg font-semibold">{config.name}</h4>
                         <p className="text-sm text-muted-foreground">
                             {config.description || "Building digital experiences that matter."}
                         </p>
                         
                         {/* Dynamic Contact Info */}
                         <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {config.contact.address && <p>{config.contact.address}</p>}
                            {config.contact.email && <a href={`mailto:${config.contact.email}`} className="hover:underline">{config.contact.email}</a>}
                            {config.contact.phone && <a href={`tel:${config.contact.phone}`} className="hover:underline">{config.contact.phone}</a>}
                         </div>
                     </div>
                     
                     <div className="space-y-4">
                         <h4 className="text-lg font-semibold">Links</h4>
                         <ul className="space-y-2 text-sm text-muted-foreground">
                             <li><Link href="/" className="hover:text-foreground">Home</Link></li>
                             <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
                             <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                             <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                         </ul>
                     </div>

                     <div className="space-y-4">
                         <h4 className="text-lg font-semibold">Legal</h4>
                         <ul className="space-y-2 text-sm text-muted-foreground">
                             <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                             <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                         </ul>
                     </div>

                     <div className="space-y-4">
                         <h4 className="text-lg font-semibold">Connect</h4>
                         <div className="flex space-x-4">
                            {config.social.twitter && (
                                <a href={config.social.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                                    X (Twitter)
                                </a>
                            )}
                            {config.social.linkedin && (
                                <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                                    LinkedIn
                                </a>
                            )}
                            {config.social.facebook && (
                                <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                                    Facebook
                                </a>
                            )}
                            {config.social.instagram && (
                                <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                                    Instagram
                                </a>
                            )}
                            {config.social.youtube && (
                                <a href={config.social.youtube} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                                    YouTube
                                </a>
                            )}
                         </div>
                     </div>
                 </div>
                 
                 <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                     <p>&copy; {new Date().getFullYear()} {config.name}. All rights reserved.</p>
                 </div>
             </div>
        </footer>
    )
}
