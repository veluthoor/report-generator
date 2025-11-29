'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { ProgressRing, BarChart, ComparisonGrid, StatCard, Leaderboard } from './ChartComponents';

type ReportSlide = {
  type: 'intro' | 'stat' | 'comparison' | 'achievement' | 'closing' | 'chart' | 'grid' | 'leaderboard';
  title?: string;
  subtitle?: string;
  mainStat?: string;
  statLabel?: string;
  comparison?: string;
  icon?: string;
  gradient: string;
  textColor?: string;
  chartData?: any;
};

type VisualReportProps = {
  customerName: string;
  businessName: string;
  slides: ReportSlide[];
  logoUrl?: string;
  onClose: () => void;
};

export default function VisualReport({ customerName, businessName, slides, logoUrl, onClose }: VisualReportProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const downloadCurrentSlide = async () => {
    if (!slideRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(slideRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
      });
      
      const link = document.createElement('a');
      link.download = `${customerName}-slide-${currentSlide + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading slide:', error);
      alert('Failed to download slide');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAllSlides = async () => {
    setIsDownloading(true);
    for (let i = 0; i < slides.length; i++) {
      setCurrentSlide(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
      await downloadCurrentSlide();
    }
    setIsDownloading(false);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
        >
          ✕
        </button>

        {/* Slide counter */}
        <div className="absolute -top-12 left-0 text-white text-sm">
          {currentSlide + 1} / {slides.length}
        </div>

        {/* Main card */}
        <div
          ref={slideRef}
          className={`relative aspect-[9/16] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${slide.gradient}`}
          onClick={nextSlide}
        >
          {/* Logo watermark */}
          {logoUrl && (
            <div className="absolute top-6 left-6 z-10">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-12 w-auto object-contain drop-shadow-lg"
                style={{ 
                  mixBlendMode: 'screen',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            {slide.type === 'intro' && (
              <>
                <div className="text-6xl mb-6 animate-bounce">{slide.icon || '🎉'}</div>
                <h1 className={`text-4xl font-bold mb-4 ${slide.textColor || 'text-white'}`}>
                  {slide.title}
                </h1>
                <p className={`text-xl ${slide.textColor || 'text-white'} opacity-90`}>
                  {slide.subtitle}
                </p>
                <div className="absolute bottom-8 text-white opacity-50 text-sm animate-pulse">
                  Tap to continue →
                </div>
              </>
            )}

            {slide.type === 'stat' && (
              <>
                <div className="text-7xl mb-6">{slide.icon || '📊'}</div>
                <div className={`text-8xl font-black mb-4 ${slide.textColor || 'text-white'}`}>
                  {slide.mainStat}
                </div>
                <p className={`text-2xl font-semibold ${slide.textColor || 'text-white'} opacity-90`}>
                  {slide.statLabel}
                </p>
              </>
            )}

            {slide.type === 'comparison' && (
              <>
                <div className="text-6xl mb-6">{slide.icon || '🔥'}</div>
                <p className={`text-3xl font-bold mb-6 ${slide.textColor || 'text-white'}`}>
                  {slide.title}
                </p>
                <div className={`text-6xl font-black ${slide.textColor || 'text-white'}`}>
                  {slide.mainStat}
                </div>
                <p className={`text-xl mt-6 ${slide.textColor || 'text-white'} opacity-80`}>
                  {slide.comparison}
                </p>
              </>
            )}

            {slide.type === 'achievement' && (
              <>
                <div className="text-8xl mb-8 animate-pulse">{slide.icon || '🏆'}</div>
                <h2 className={`text-4xl font-bold mb-4 ${slide.textColor || 'text-white'}`}>
                  {slide.title}
                </h2>
                <p className={`text-xl ${slide.textColor || 'text-white'} opacity-90`}>
                  {slide.subtitle}
                </p>
              </>
            )}

            {slide.type === 'chart' && slide.chartData && (
              <>
                <h2 className={`text-3xl font-bold mb-8 ${slide.textColor || 'text-white'}`}>
                  {slide.title}
                </h2>
                {slide.chartData.type === 'progress' && (
                  <ProgressRing
                    percentage={slide.chartData.percentage}
                    label={slide.chartData.label}
                  />
                )}
                {slide.chartData.type === 'bars' && (
                  <BarChart data={slide.chartData.data} />
                )}
              </>
            )}

            {slide.type === 'grid' && slide.chartData && (
              <>
                <h2 className={`text-2xl font-bold mb-6 ${slide.textColor || 'text-white'}`}>
                  {slide.title}
                </h2>
                <ComparisonGrid items={slide.chartData.items} />
              </>
            )}

            {slide.type === 'leaderboard' && slide.chartData && (
              <>
                <Leaderboard
                  position={slide.chartData.position}
                  total={slide.chartData.total}
                  category={slide.chartData.category}
                />
              </>
            )}

            {slide.type === 'closing' && (
              <>
                <div className="text-6xl mb-6">{slide.icon || '💪'}</div>
                <h2 className={`text-4xl font-bold mb-6 ${slide.textColor || 'text-white'}`}>
                  {slide.title}
                </h2>
                <p className={`text-2xl ${slide.textColor || 'text-white'} opacity-90 mb-8`}>
                  {slide.subtitle}
                </p>
                <div className={`text-lg ${slide.textColor || 'text-white'} opacity-70`}>
                  {businessName}
                </div>
              </>
            )}
          </div>

          {/* Progress dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white opacity-40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            disabled={currentSlide === 0}
            className="flex-1 bg-white bg-opacity-20 text-white py-3 rounded-xl font-semibold hover:bg-opacity-30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            disabled={currentSlide === slides.length - 1}
            className="flex-1 bg-white bg-opacity-20 text-white py-3 rounded-xl font-semibold hover:bg-opacity-30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={downloadCurrentSlide}
            disabled={isDownloading}
            className="flex-1 bg-white text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {isDownloading ? '⏳ Downloading...' : '📸 Download This Slide'}
          </button>
          <button
            onClick={downloadAllSlides}
            disabled={isDownloading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            📤 Download All
          </button>
        </div>
      </div>
    </div>
  );
}
