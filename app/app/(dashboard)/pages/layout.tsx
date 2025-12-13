import {
  DM_Sans,
  DM_Serif_Display,
  Inter,
  Merriweather,
  Plus_Jakarta_Sans,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  weight: ["400"],
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        inter.variable,
        plusJakarta.variable,
        dmSerifDisplay.variable,
        dmSans.variable,
        sourceSans.variable,
        spaceGrotesk.variable,
        merriweather.variable,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

