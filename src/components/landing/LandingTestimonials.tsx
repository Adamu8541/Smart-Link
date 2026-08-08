/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TestimonialItem {
  id: string;
  name: string;
  business: string;
  location: string;
  avatar: string;
  review: string;
  rating: number;
  serviceUsed: string;
}

export const LandingTestimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: TestimonialItem[] = [
    {
      id: "t1",
      name: "Chidi Ezenwa",
      business: "CEO, PayTech Solutions Nigeria",
      location: "Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
      review: "SmartLink has completely transformed how our fintech application verifies user identity during onboarding. Their sub-second NIN and BVN API responses reduced customer drop-off by over 35%. Highly reliable infrastructure!",
      rating: 5,
      serviceUsed: "NIN & BVN Verification APIs",
    },
    {
      id: "t2",
      name: "Amina Bello",
      business: "Managing Director, Apex Business Consult",
      location: "Abuja, FCT",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
      review: "Filing corporate registrations with the CAC used to take weeks of back-and-forth. With SmartLink's integrated corporate search and automated dispatch, we file business names in record time for our corporate clients.",
      rating: 5,
      serviceUsed: "CAC Business Registrations",
    },
    {
      id: "t3",
      name: "Tunde Bakare",
      business: "Founder, SmartEdu Cyber Cafe Network",
      location: "Ibadan, Oyo State",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
      review: "During WAEC and NECO registration seasons, we order hundreds of result checker scratch cards daily. SmartLink's instant serial PIN dispatch is 100% accurate and our wallet auto-funds without hiccups.",
      rating: 5,
      serviceUsed: "Educational Scratch Cards",
    },
    {
      id: "t4",
      name: "Grace Kalu",
      business: "Head of Operations, HorizonPay Mobile Money",
      location: "Port Harcourt, Rivers State",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=250&q=80",
      review: "The wholesale agent discounts on VTU airtime, data bundles, and zero fee utility payments give our agency network the highest profit margins in the market. Customer support is always responsive 24/7.",
      rating: 5,
      serviceUsed: "VTU & Utility Bill Payments",
    },
    {
      id: "t5",
      name: "Ibrahim Usman",
      business: "Principal Tech Lead, KAD Enterprise Solutions",
      location: "Kaduna, Nigeria",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
      review: "SmartLink's API documentation is hands down the best we've integrated. Clear endpoints, interactive sandbox environment, and instant webhook notifications. Our engineering team loves it!",
      rating: 5,
      serviceUsed: "Enterprise Developer APIs",
    },
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonials-section" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Customer Reviews & Case Studies
          </span>
          <h2 className="text-3xl sm:text-4.5xl font-black text-slate-900 dark:text-white tracking-tight">
            What Our Users Say About SmartLink
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-lg mx-auto">
            Trusted by over 500,000 businesses, developers, cafe owners, and individuals across Nigeria.
          </p>
        </div>

        {/* Testimonial Interactive Slider */}
        <div className="max-w-4xl mx-auto relative">
          
          <div className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden backdrop-blur-md">
            
            <Quote className="absolute top-6 right-6 h-20 w-20 text-blue-500/10 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={testimonials[currentIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="space-y-6 relative z-10"
              >
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2 font-mono">
                    5.0 / 5.0 Rating
                  </span>
                </div>

                {/* Review Text */}
                <blockquote className="text-base sm:text-xl text-slate-800 dark:text-slate-100 font-medium leading-relaxed italic">
                  "{testimonials[currentIndex].review}"
                </blockquote>

                {/* Author Info */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-blue-500 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {testimonials[currentIndex].name}
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      </h3>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {testimonials[currentIndex].business}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {testimonials[currentIndex].location}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {testimonials[currentIndex].serviceUsed}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-between mt-8 px-2">
            
            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((t, idx) => (
                <button
                  key={t.id}
                  id={`testimonial-dot-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? "w-8 bg-blue-600" : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev/Next Buttons */}
            <div className="flex items-center gap-3">
              <button
                id="testimonial-prev-btn"
                onClick={handlePrev}
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors cursor-pointer shadow-xs"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                id="testimonial-next-btn"
                onClick={handleNext}
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors cursor-pointer shadow-xs"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default LandingTestimonials;
