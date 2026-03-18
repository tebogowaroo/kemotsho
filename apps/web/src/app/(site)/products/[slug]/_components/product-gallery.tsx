"use client"

import { useState } from "react"
import { cn } from "@kemotsho/core/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/atoms/dialog"
import { ZoomIn } from "lucide-react"

interface ProductGalleryProps {
    images: string[]
    title: string
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(images[0] || null)

    if (!selectedImage) {
        return (
            <div className="aspect-square flex items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                No Image Available
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <Dialog>
                <DialogTrigger asChild>
                    <div className="group aspect-square relative overflow-hidden rounded-xl border bg-muted cursor-zoom-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={selectedImage} 
                            alt={title} 
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                            <ZoomIn className="text-white w-10 h-10 drop-shadow-md" />
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <div className="w-full h-full flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={selectedImage} 
                            alt={title} 
                            className="object-contain max-h-[90vh] max-w-[90vw] rounded-md"
                        />
                    </div>
                </DialogContent>
            </Dialog>
           
            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    {images.map((img, i) => (
                        <button 
                            key={i} 
                            onClick={() => setSelectedImage(img)}
                            className={cn(
                                "relative w-24 aspect-square shrink-0 rounded-lg border overflow-hidden cursor-pointer transition-all hover:opacity-100",
                                selectedImage === img ? "ring-2 ring-primary ring-offset-2 opacity-100" : "opacity-70 hover:ring-2 hover:ring-primary/50"
                            )}
                        >
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`${title} ${i+1}`} className="object-cover w-full h-full" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
