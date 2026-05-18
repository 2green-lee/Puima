import { Star } from "lucide-react";
import { motion } from "motion/react";

interface GridItemProps {
  key?: string | number;
  title: string;
  image: string;
  naverUrl: string;
  index: number;
  imageUrl?: string;
  visuals?: string;
  category?: string;
  isSoldOut?: boolean;
  originalPrice?: string;
  price?: string;
  rating?: string;
  reviews?: string;
}

export default function GridItem({ title, visuals, image, naverUrl, index, imageUrl, category, isSoldOut, originalPrice, price, rating, reviews }: GridItemProps) {
  // Determine border classes based on index to mimic the grid look
  const borderClasses = "border-zinc-200 " + 
    (index % 3 !== 2 ? "md:border-r " : "") + 
    (index >= 3 ? "border-t " : "max-md:border-t");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.8 }}
      className={`relative group ${borderClasses} bg-zinc-200 cursor-pointer overflow-hidden`}
    >
      <div className="w-full h-full bg-white p-6 pb-4 md:p-10 transition-all duration-700 ease-in-out group-hover:bg-zinc-50/80 group-hover:rounded-[32px] group-hover:z-10 group-hover:shadow-2xl group-hover:shadow-zinc-200/50 overflow-hidden flex flex-col items-center">
        {/* Visual Image Container - Fixed Square */}
        <div className="relative w-full aspect-square mb-5 md:mb-6 overflow-hidden bg-zinc-100 flex items-center justify-center">
          <img 
            src={imageUrl || image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <span className="text-white font-black text-xl tracking-[0.3em] uppercase border-2 border-white px-6 py-2">Sold Out</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center px-2 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-[16px] font-medium leading-tight mb-2 h-10 line-clamp-2">{title}</h3>
            
            {rating && (
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star size={10} fill="currentColor" className="text-black" />
                <span className="text-[10px] font-bold tracking-widest">{rating}</span>
                {reviews && <span className="text-[10px] text-zinc-400 font-medium ml-1">({reviews})</span>}
              </div>
            )}

            {originalPrice && (
              <p className="text-[11px] text-zinc-300 line-through font-mono uppercase tracking-wider mb-1">{originalPrice}</p>
            )}
            
            <div className="mt-1">
              {price && (
                <div className="flex flex-col items-center">
                  <span className="text-[15px] font-bold text-black font-mono">
                    {price}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
