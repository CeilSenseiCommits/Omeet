import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface CarouselProps {
  children: ReactNode[];
  cardWidth?: number;
}

function Carousel({ children, cardWidth = 320 }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = cardWidth + 14; // Include gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-white text-[#242427] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#FAF9F6] shadow-xs"
          aria-label="Scroll left"
        >
          ←
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1"
        onScroll={checkScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children.map((child, index) => (
          <div key={index} className="snap-start shrink-0" style={{ width: cardWidth }}>
            {child}
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-white text-[#242427] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#FAF9F6] shadow-xs"
          aria-label="Scroll right"
        >
          →
        </button>
      )}
    </div>
  );
}

export default Carousel;
