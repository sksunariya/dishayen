import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const GRID_CLASSES = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4'
};

const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([^#&?]{11})/);
  return match ? match[1] : null;
};

const isYouTubeUrl = (url) => Boolean(getYouTubeId(url));

const Results = () => {
  const [results, setResults] = useState([]);
  const [gridCols, setGridCols] = useState(3);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // index of the image open in lightbox

  // Only images participate in the lightbox
  const imageResults = results.filter(r => r.fileType === 'image');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/results');
        setResults(res.data.results);
        setGridCols(res.data.gridCols);
      } catch {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const openLightbox = (result) => {
    const idx = imageResults.findIndex(r => r._id === result._id);
    if (idx !== -1) setLightbox(idx);
  };

  const closeLightbox = () => setLightbox(null);

  const prevImage = useCallback(() => {
    setLightbox(i => (i - 1 + imageResults.length) % imageResults.length);
  }, [imageResults.length]);

  const nextImage = useCallback(() => {
    setLightbox(i => (i + 1) % imageResults.length);
  }, [imageResults.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prevImage, nextImage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const gridClass = GRID_CLASSES[gridCols] || GRID_CLASSES[3];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Our Results</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            See the achievements and success stories of our students
          </p>
          <div className="w-24 h-1 bg-gradient-primary mx-auto mt-4 rounded-full" />
        </motion.div>

        {/* Grid */}
        {results.length === 0 ? (
          <div className="text-center py-24">
            <FiImage className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">No results posted yet</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Check back soon!</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`grid ${gridClass} gap-4`}
          >
            {results.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl overflow-hidden bg-white dark:bg-dark-elevated border border-gray-200 dark:border-dark-border shadow-md hover:shadow-xl transition-shadow group"
              >
                {item.fileType === 'image' ? (
                  <div
                    className="relative cursor-zoom-in overflow-hidden"
                    onClick={() => openLightbox(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ) : (
                  <div className="relative pt-[56.25%] bg-gray-900">
                    {isYouTubeUrl(item.url) ? (
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}`}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        src={item.url}
                        controls
                        preload="metadata"
                      />
                    )}
                  </div>
                )}

                {/* Caption */}
                <div className="p-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.title}</p>
                  {item.caption && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.caption}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && imageResults[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={closeLightbox}
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Prev */}
            {imageResults.length > 1 && (
              <button
                className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <FiChevronLeft className="w-7 h-7" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageResults[lightbox].url}
                alt={imageResults[lightbox].title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <p className="text-white font-semibold text-lg">{imageResults[lightbox].title}</p>
                {imageResults[lightbox].caption && (
                  <p className="text-gray-300 text-sm mt-1">{imageResults[lightbox].caption}</p>
                )}
                {imageResults.length > 1 && (
                  <p className="text-gray-500 text-xs mt-2">{lightbox + 1} / {imageResults.length}</p>
                )}
              </div>
            </motion.div>

            {/* Next */}
            {imageResults.length > 1 && (
              <button
                className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <FiChevronRight className="w-7 h-7" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Results;
