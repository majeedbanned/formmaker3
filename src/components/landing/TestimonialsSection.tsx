"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";

const testimonials = [
  {
    id: 1,
    content:
      "پارسا موز تحول بزرگی در مدیریت مدرسه ما ایجاد کرد. فرایندهای اداری ساده‌تر شدند و وقت بیشتری برای تمرکز بر آموزش داریم.",
    author: "محمد احمدی",
    role: "مدیر دبیرستان شهید بهشتی",
    avatar: "/images/avatar-1.jpg",
    rating: 5,
  },
  {
    id: 2,
    content:
      "با استفاده از این سیستم، ارتباط ما با والدین به‌طور چشمگیری بهبود یافته است. آنها از این که به‌سادگی می‌توانند پیشرفت فرزندانشان را پیگیری کنند، بسیار راضی هستند.",
    author: "زهرا محمدی",
    role: "معاون آموزشی دبستان ایران",
    avatar: "/images/avatar-2.jpg",
    rating: 5,
  },
  {
    id: 3,
    content:
      "داشبوردهای تحلیلی به من کمک می‌کند تا الگوهای پیشرفت دانش‌آموزان را شناسایی کنم و برنامه درسی را برای رفع نیازهای آنها تنظیم کنم.",
    author: "علی رضایی",
    role: "دبیر ریاضی دبیرستان نمونه",
    avatar: "/images/avatar-3.jpg",
    rating: 4,
  },
  {
    id: 4,
    content:
      "پشتیبانی فنی عالی، رابط کاربری ساده و قابلیت‌های گسترده. پارسا موز قطعاً بهترین سیستم مدیریتی است که تاکنون استفاده کرده‌ام.",
    author: "سارا کریمی",
    role: "مدیر فناوری مدرسه هوشمند",
    avatar: "/images/avatar-4.jpg",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" className="py-24 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            نظرات مشتریان
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            مدارس در مورد ما چه می‌گویند
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            بیش از ۲۵۰ مدرسه از سراسر کشور به پارسا موز اعتماد کرده‌اند.
          </p>
        </motion.div>

        <div className="relative">
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(${currentIndex * -100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  className="min-w-full px-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center text-center">
                    <div className="flex mb-6">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    <blockquote>
                      <p className="text-xl font-medium text-gray-900 mb-8">
                        "{testimonial.content}"
                      </p>
                    </blockquote>

                    <div className="flex items-center mt-auto">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="mr-4 text-right">
                        <div className="text-base font-medium text-gray-900">
                          {testimonial.author}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-3 w-3 rounded-full ${
                  currentIndex === index ? "bg-indigo-600" : "bg-gray-300"
                } transition-colors duration-300`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
