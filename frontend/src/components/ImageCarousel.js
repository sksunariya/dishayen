import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import api from '../utils/api';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const ImageCarousel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  const fetchCarouselImages = async () => {
    try {
      const response = await api.get('/carousel');
      setImages(response.data.images);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-dark-elevated rounded-xl animate-pulse"></div>
    );
  }

  // Show default carousel if no images uploaded yet
  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="relative h-96 md:h-[500px] lg:h-[600px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-neon-blue/20 via-neon-purple/20 to-neon-pink/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
                Welcome to Dishayen Coaching Center
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-6">
                Transform Your Future with Expert Coaching
              </p>
              <a
                href="/courses"
                className="inline-block px-8 py-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
              >
                Explore Courses
              </a>
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-yellow-400 text-sm">
            Admin: Add carousel images in dashboard
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        effect="fade"
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={true}
        loop={true}
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          '--swiper-navigation-color': '#667eea',
          '--swiper-pagination-color': '#667eea',
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide key={image._id}>
            <div className="relative h-96 md:h-[500px] lg:h-[600px] w-full group">
              {/* Image */}
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-full object-cover"
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    {image.title}
                  </h2>
                  {image.description && (
                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl mb-6">
                      {image.description}
                    </p>
                  )}
                  {image.linkUrl && (
                    <a
                      href={image.linkUrl}
                      className="inline-block px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
                    >
                      Learn More
                    </a>
                  )}
                </motion.div>
              </div>

              {/* Slide number indicator */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                {index + 1} / {images.length}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.div>
  );
};

export default ImageCarousel;

