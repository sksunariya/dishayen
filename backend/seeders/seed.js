const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Course = require('../models/Course');
const Testimonial = require('../models/Testimonial');
const CarouselImage = require('../models/CarouselImage');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education-platform';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@educationplatform.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'student',
    isVerified: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'student',
    isVerified: true
  }
];

const courses = [
  {
    title: 'Complete Web Development Bootcamp 2025',
    description: 'Master modern web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, MongoDB, and deploy full-stack applications. This comprehensive course covers everything you need to become a professional web developer.',
    shortDescription: 'Learn full-stack web development from beginner to advanced level',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
    category: 'Web Development',
    level: 'Beginner',
    duration: '40 hours',
    instructor: 'Dr. Sarah Johnson',
    featured: true,
    whatYouWillLearn: [
      'Build modern responsive websites',
      'Master React.js and Node.js',
      'Create full-stack MERN applications',
      'Deploy applications to production'
    ],
    requirements: [
      'Basic computer skills',
      'No prior coding experience needed'
    ],
    sampleVideos: [
      {
        title: 'Course Introduction',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '10:30'
      }
    ]
  },
  {
    title: 'Python for Data Science & Machine Learning',
    description: 'Dive into the world of data science and machine learning with Python. Learn pandas, numpy, scikit-learn, TensorFlow, and build real-world ML projects.',
    shortDescription: 'Master data science and machine learning with Python',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop',
    category: 'AI & Machine Learning',
    level: 'Intermediate',
    duration: '35 hours',
    instructor: 'Prof. Michael Chen',
    featured: true,
    whatYouWillLearn: [
      'Data analysis with pandas and numpy',
      'Build machine learning models',
      'Deep learning with TensorFlow',
      'Real-world data science projects'
    ],
    requirements: [
      'Basic Python knowledge recommended',
      'Understanding of mathematics helpful'
    ],
    sampleVideos: [
      {
        title: 'Introduction to Data Science',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '12:45'
      }
    ]
  },
  {
    title: 'React Native - Build Mobile Apps',
    description: 'Create beautiful mobile applications for iOS and Android using React Native. Learn to build cross-platform apps with a single codebase.',
    shortDescription: 'Build cross-platform mobile apps with React Native',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop',
    category: 'Mobile Development',
    level: 'Intermediate',
    duration: '30 hours',
    instructor: 'Emily Rodriguez',
    featured: true,
    whatYouWillLearn: [
      'Build iOS and Android apps',
      'Master React Native fundamentals',
      'Work with native device features',
      'Publish apps to app stores'
    ],
    requirements: [
      'JavaScript and React knowledge',
      'Basic mobile development concepts'
    ],
    sampleVideos: []
  },
  {
    title: 'AWS Cloud Computing Masterclass',
    description: 'Master Amazon Web Services and cloud computing. Learn EC2, S3, Lambda, RDS, and how to architect scalable cloud solutions.',
    shortDescription: 'Complete guide to AWS cloud computing and architecture',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    category: 'Cloud Computing',
    level: 'Intermediate',
    duration: '28 hours',
    instructor: 'David Kumar',
    featured: false,
    whatYouWillLearn: [
      'AWS core services and architecture',
      'Deploy scalable applications',
      'Cloud security best practices',
      'Cost optimization strategies'
    ],
    requirements: [
      'Basic understanding of web applications',
      'No prior cloud experience needed'
    ],
    sampleVideos: []
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Learn essential cybersecurity concepts, ethical hacking, network security, and how to protect systems from cyber threats.',
    shortDescription: 'Master cybersecurity and ethical hacking fundamentals',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop',
    category: 'Cybersecurity',
    level: 'Beginner',
    duration: '25 hours',
    instructor: 'Alex Thompson',
    featured: false,
    whatYouWillLearn: [
      'Network security fundamentals',
      'Ethical hacking techniques',
      'Threat detection and prevention',
      'Security best practices'
    ],
    requirements: [
      'Basic networking knowledge helpful',
      'Interest in security and hacking'
    ],
    sampleVideos: []
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Create stunning user interfaces and exceptional user experiences. Learn Figma, design thinking, prototyping, and modern design principles.',
    shortDescription: 'Master UI/UX design with Figma and design thinking',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    category: 'Design',
    level: 'Beginner',
    duration: '22 hours',
    instructor: 'Sophie Martinez',
    featured: false,
    whatYouWillLearn: [
      'User-centered design principles',
      'Figma for UI design',
      'Create wireframes and prototypes',
      'Conduct user research'
    ],
    requirements: [
      'No prior design experience needed',
      'Creativity and attention to detail'
    ],
    sampleVideos: []
  }
];

const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Testimonial.deleteMany({});
    await CarouselImage.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create courses
    console.log('📚 Creating courses...');
    const createdCourses = await Course.insertMany(courses);
    console.log(`✅ Created ${createdCourses.length} courses`);

    // Create sample testimonials
    console.log('💬 Creating testimonials...');
    const testimonials = [
      {
        user: createdUsers[1]._id,
        content: 'This platform has transformed my career! The courses are well-structured and the instructors are amazing. Highly recommended!',
        rating: 5,
        status: 'approved'
      },
      {
        user: createdUsers[2]._id,
        content: 'Best investment I\'ve made in my education. The quality of content is top-notch and the learning experience is fantastic.',
        rating: 5,
        status: 'approved'
      }
    ];
    await Testimonial.insertMany(testimonials);
    console.log(`✅ Created ${testimonials.length} testimonials`);

    // Create carousel images
    console.log('🎨 Creating carousel images...');
    const carouselImages = [
      {
        title: 'Transform Your Future',
        description: 'Join thousands of students achieving their dreams',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=600&fit=crop',
        linkUrl: '/courses',
        isActive: true,
        order: 1
      },
      {
        title: 'Expert Coaching',
        description: 'Learn from industry professionals with years of experience',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop',
        linkUrl: '/courses',
        isActive: true,
        order: 2
      },
      {
        title: 'Flexible Learning',
        description: 'Study at your own pace, anywhere, anytime',
        imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop',
        linkUrl: '/courses',
        isActive: true,
        order: 3
      }
    ];
    await CarouselImage.insertMany(carouselImages);
    console.log(`✅ Created ${carouselImages.length} carousel images`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📝 Sample Credentials:');
    console.log('Admin:');
    console.log('  Email: admin@educationplatform.com');
    console.log('  Password: admin123');
    console.log('\nStudent:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

