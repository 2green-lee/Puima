import { Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface GridItemProps {
  key?: string | number;
  title: string;
  titleEn?: string;
  lang?: "KOR" | "ENG";
  image: string;
  naverUrl: string;
  index: number;
  imageUrl?: string;
  category?: string;
  isSoldOut?: boolean;
  originalPrice?: string;
  price?: string;
  uniform?: boolean;
}

export default function GridItem({ 
  title, 
  titleEn,
  lang = "KOR",
  image, 
  naverUrl, 
  index, 
  imageUrl, 
  category, 
  isSoldOut, 
  originalPrice, 
  price, 
  uniform = false 
}: GridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Create an editorial feel by varying the layout based on index (disable if uniform)
  const isLarge = !uniform && index % 5 === 0; // Every 5th item is larger
  const isWide = !uniform && (index + 1) % 7 === 0;  // Every 7th item is wider
  
  const displayImage = imageUrl || image;
  const displayTitle = lang === "ENG" && titleEn ? titleEn : title;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.05, duration: 0.8 }}
      className={`relative group bg-white cursor-pointer overflow-hidden pb-4 md:pb-12 ${
        isLarge ? "md:col-span-2 md:row-span-2" : isWide ? "md:col-span-2" : ""
      }`}
      onClick={() => window.open(naverUrl, "_blank")}
    >
      <div className="w-full h-full flex flex-col">
        {/* Visual Image Container */}
        <div className={`relative w-full overflow-hidden bg-zinc-50 ${
          uniform ? "aspect-square" : (isLarge ? "md:aspect-[4/5] aspect-[3/4]" : isWide ? "md:aspect-[21/9] aspect-[3/4]" : "aspect-[3/4]")
        }`}>
          {!isLoaded && (
            <div className="absolute inset-0 bg-zinc-50 animate-pulse" />
          )}
          
          <img 
            src={displayImage} 
            alt={displayTitle} 
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            referrerPolicy="no-referrer"
          />
          
          {isSoldOut && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="text-black font-black text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] uppercase border border-black px-2 md:px-4 py-1 md:py-2">Sold Out</span>
            </div>
          )}

          {/* Hover Overlay - Minimalist */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors duration-500" />
        </div>

        {/* Info - Editorial Style */}
        <div className="mt-3 md:mt-6 px-1">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-4">
            <div className="space-y-1 flex-1">
              {category && (
                <span className="block text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">
                  {category}
                </span>
              )}
              <h3 className="text-[10px] md:text-[14px] font-bold leading-tight tracking-tight text-zinc-900 group-hover:text-zinc-500 transition-colors">
                {displayTitle}
              </h3>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <p className="text-[9px] md:text-[13px] font-semibold md:font-bold text-zinc-900">{price}</p>
              {originalPrice && (
                <p className="text-[8px] md:text-[12px] text-zinc-600 line-through font-medium mt-0.5">{originalPrice}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
