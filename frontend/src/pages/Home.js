import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiPlay, FiStar, FiTrendingUp, FiAward, FiMessageSquare, FiX } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import ImageCarousel from '../components/ImageCarousel';
import AddTestimonialModal from '../components/AddTestimonialModal';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/pagination';

const Home = () => {
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [videoTestimonials, setVideoTestimonials] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddTestimonial = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add a testimonial');
      navigate('/login', { state: { from: '/', message: 'Login to share your experience with us!' } });
      return;
    }
    setShowTestimonialModal(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, testimonialsRes, videoTestimonialsRes, settingsRes, newsRes] = await Promise.all([
        api.get('/categories/featured'),
        api.get('/testimonials'),
        api.get('/video-testimonials').catch(() => ({ data: { videoTestimonials: [] } })),
        api.get('/settings/demoVideoUrl').catch(() => ({ data: { value: '' } })),
        api.get('/news').catch(() => ({ data: { news: [] } }))
      ]);

      setFeaturedCategories(categoriesRes.data.categories || []);
      setTestimonials(testimonialsRes.data.testimonials);
      setVideoTestimonials(videoTestimonialsRes.data.videoTestimonials || []);
      setDemoVideoUrl(settingsRes.data.value || '');
      setNews(newsRes.data.news || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(demoVideoUrl);

  const handleWatchDemo = () => {
    if (demoVideoUrl) {
      setShowVideoModal(true);
    }
  };

  const handleGoToYouTube = () => {
    if (demoVideoUrl) {
      window.open(demoVideoUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && videoId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl bg-dark-elevated rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <FiX className="w-6 h-6 text-white" />
              </button>
              <div className="relative pt-[56.25%]">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  title="Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6 bg-dark-elevated">
                <button
                  onClick={handleGoToYouTube}
                  className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
                >
                  Watch on YouTube
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Carousel and News Section */}
      <section className="py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Carousel - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 min-w-0 overflow-hidden">
              <ImageCarousel />
            </div>

            {/* News Column - Takes 1 column on large screens */}
            <div className="lg:col-span-1 min-w-0 overflow-hidden">
              <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border shadow-lg overflow-hidden flex flex-col h-96 md:h-[500px] lg:h-[600px]">
                <div className="bg-gradient-primary p-4 flex-shrink-0">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiMessageSquare className="w-5 h-5" />
                    Latest News
                  </h2>
                </div>
                <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
                  {news.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center">
                      <div>
                        <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No news available</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                      {news.map((newsItem, index) => (
                        <motion.div
                          key={newsItem._id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-gray-200 dark:border-dark-border pb-4 last:border-b-0 last:pb-0"
                        >
                          {newsItem.link ? (
                            <a
                              href={newsItem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group"
                            >
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-neon-blue transition-colors line-clamp-2">
                                {newsItem.title}
                              </h3>
                            </a>
                          ) : (
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {newsItem.title}
                            </h3>
                          )}
                          {newsItem.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {newsItem.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(newsItem.createdAt).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 via-transparent to-neon-purple/20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Transform Your Future</span>
                <br />
                <span className="text-white">with Cutting-Edge Courses</span>
              </h1>
              <p className="text-gray-400 text-lg mb-8">
                Join thousands of learners mastering new skills with our futuristic education platform.
                Learn from industry experts and get certified in the most in-demand technologies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/courses"
                  className="px-8 py-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all flex items-center justify-center space-x-2"
                >
                  <span>Explore Courses</span>
                  <FiArrowRight className="w-5 h-5" />
                </Link>
                {demoVideoUrl && (
                  <button
                    onClick={handleWatchDemo}
                    className="px-8 py-4 border-2 border-neon-blue text-neon-blue font-semibold rounded-lg hover:bg-neon-blue hover:text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <FiPlay className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative animate-float">
                {videoId ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative pt-[56.25%]">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="Demo Video"
                        frameBorder="0"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=600&fit=crop"
                    alt="Learning"
                    className="rounded-2xl shadow-2xl"
                  />
                )}
                <div className="absolute -bottom-6 -left-6 bg-gradient-primary p-6 rounded-xl shadow-neon">
                  <div className="flex items-center space-x-3">
                    <FiAward className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-white font-bold text-xl">10,000+</p>
                      <p className="text-white/80 text-sm">Students Enrolled</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse"></div>
      </section>

      {/* Featured Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Explore Categories</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose from our diverse range of course categories
            </p>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-64 rounded-xl"></div>
              ))}
            </div>
          ) : featuredCategories.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredCategories.map((category, index) => (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Link
                      to={`/courses?category=${category._id}`}
                      className="block bg-white dark:bg-dark-elevated p-8 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center mb-4">
                        {category.icon && (
                          <span className="text-5xl mr-4">{category.icon}</span>
                        )}
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-neon-blue transition-colors">
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center text-neon-blue font-semibold group-hover:gap-2 transition-all">
                        <span>Explore Courses</span>
                        <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  to="/courses"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
                >
                  <span>View All Courses</span>
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No featured categories available</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-dark-surface/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">What Our Students Say</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-6">
                Real feedback from our community of learners
              </p>
              <button
                onClick={handleAddTestimonial}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
              >
                <FiMessageSquare className="w-5 h-5" />
                <span>Share Your Experience</span>
              </button>
            </motion.div>

            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="pb-12"
              style={{ minHeight: '320px' }}
            >
              {testimonials.filter(testimonial => testimonial.user).map((testimonial) => (
                <SwiperSlide key={testimonial._id} style={{ height: 'auto' }}>
                  <div className="bg-white dark:bg-dark-elevated p-8 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-shadow flex flex-col min-h-[280px] h-full">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed flex-grow line-clamp-4">"{testimonial.content}"</p>
                    <div className="flex items-center space-x-3 mt-auto">
                      <Avatar
                        name={testimonial.user?.name || 'Anonymous'}
                        src={testimonial.user?.avatar}
                        size="md"
                      />
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold">{testimonial.user?.name || 'Anonymous'}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Student</p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Video Testimonials */}
      {videoTestimonials.length > 0 && (
        <section className="py-20 bg-dark-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Student Success Stories</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                Hear directly from our students about their learning journey
              </p>
            </motion.div>

            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              autoplay={{ delay: 6000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="pb-12"
            >
              {videoTestimonials.map((vt) => (
                <SwiperSlide key={vt._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {/* Video */}
                    <div className="relative pt-[56.25%] bg-gray-900">
                      {vt.type === 'youtube' ? (
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(vt.youtubeUrl)}`}
                          title={vt.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          src={vt.videoUrl}
                          controls
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {vt.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-semibold">{vt.studentName}</span>
                      </p>
                      {vt.course && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {vt.course}
                        </p>
                      )}
                      {vt.duration && (
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          Duration: {vt.duration}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* CTA Section - Only visible when user is not logged in */}
      {!isAuthenticated && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-primary p-12 rounded-2xl text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of students and begin your journey to success today
              </p>
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-neon-blue font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                <span>Get Started Free</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Add Testimonial Modal */}
      <AddTestimonialModal
        isOpen={showTestimonialModal}
        onClose={() => setShowTestimonialModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Home;

