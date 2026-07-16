import { useState, useEffect } from 'react';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

const slides = [
  { src: '/elemente/1.png', alt: 'Carousel slide 1' },
  { src: '/elemente/2.png', alt: 'Carousel slide 2' },
  { src: '/elemente/3.png', alt: 'Carousel slide 3' },
  { src: '/elemente/4.png', alt: 'Carousel slide 4' },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="w-full bg-canvas" aria-label="Atzengold Hero">
      <div className="relative w-full aspect-video overflow-hidden">
        {/* Slides */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-between px-4">
          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            className="p-2 bg-black/40 hover:bg-black/60 text-white rounded transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentSlide
                    ? 'bg-white'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            className="p-2 bg-black/40 hover:bg-black/60 text-white rounded transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
