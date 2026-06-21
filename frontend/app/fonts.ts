import { Space_Grotesk  } from "next/font/google";
import localFont from "next/font/local"


export const space_grotesk  = Space_Grotesk ({
  variable: "--space_grotesk ",
  subsets: ["latin"],
});

export const helvetica_neue = localFont({
    src: [
        { path: "./fonts/HelveticaNeueBlack.otf", weight: "900", style: "normal" },
        { path: "./fonts/HelveticaNeueBlackItalic.otf", weight: "900", style: "italic" },
        { path: "./fonts/HelveticaNeueBold.otf", weight: "700", style: "normal" },
        { path: "./fonts/HelveticaNeueBoldItalic.otf", weight: "700", style: "italic" },
        { path: "./fonts/HelveticaNeueThin.otf", weight: "100", style: "normal" },
        { path: "./fonts/HelveticaNeueThinItalic.otf", weight: "100", style: "italic" },
        { path: "./fonts/HelveticaNeueMedium.otf", weight: "500", style: "normal" },
        { path: "./fonts/HelveticaNeueMediumItalic.otf", weight: "500", style: "italic" },
        { path: "./fonts/HelveticaNeueLight.otf", weight: "300", style: "normal" },
        { path: "./fonts/HelveticaNeueLightItalic.otf", weight: "300", style: "italic" },
        // { path: "./fonts/HelveticaNeueItalic.otf", weight: "400", style: "italic" },
        { path: "./fonts/HelveticaNeueRoman.otf", weight: "400", style: "normal" },
    ],
    variable: "--helvetica_neue",
})