import { 
  Inter, 
  Roboto, 
  Open_Sans, 
  Lato, 
  Montserrat, 
  Playfair_Display, 
  Lora, 
  Merriweather, 
  Oswald, 
  Raleway,
} from "next/font/google"
import { NextFontWithVariable } from "next/dist/compiled/@next/font"

// Sans Serif
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" })
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" })
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-lato" })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" })

// Serif
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })
const merriweather = Merriweather({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-merriweather" })

// Display
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" })

export type FontName = 
  | "inter" 
  | "roboto" 
  | "open-sans" 
  | "lato" 
  | "montserrat" 
  | "raleway" 
  | "playfair" 
  | "lora" 
  | "merriweather" 
  | "oswald"

export type FontConfig = {
  font: NextFontWithVariable
  variableName: string
}

export const fonts: Record<FontName, FontConfig> = {
  "inter": { font: inter, variableName: "--font-inter" },
  "roboto": { font: roboto, variableName: "--font-roboto" },
  "open-sans": { font: openSans, variableName: "--font-open-sans" },
  "lato": { font: lato, variableName: "--font-lato" },
  "montserrat": { font: montserrat, variableName: "--font-montserrat" },
  "raleway": { font: raleway, variableName: "--font-raleway" },
  "playfair": { font: playfair, variableName: "--font-playfair" },
  "lora": { font: lora, variableName: "--font-lora" },
  "merriweather": { font: merriweather, variableName: "--font-merriweather" },
  "oswald": { font: oswald, variableName: "--font-oswald" },
}

export function getFont(name: string): FontConfig {
  if (!name) return fonts["inter"]
  
  // Normalize input: "Playfair Display" -> "playfair", "Open Sans" -> "open-sans"
  const normalizedKey = name.toLowerCase().replace(/\s+/g, "-") as FontName
  
  // Partial matching for better UX (e.g., "playfair-display" -> match "playfair")
  const key = Object.keys(fonts).find(k => normalizedKey.includes(k)) as FontName
  
  return fonts[key || normalizedKey] || fonts["inter"]
}
