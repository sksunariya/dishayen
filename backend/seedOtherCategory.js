const mongoose = require('mongoose');
const Category = require('./models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const seedOtherCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected');

    // Check if "Other" category exists
    const otherCategory = await Category.findOne({ name: 'Other', isSystemCategory: true });

    if (otherCategory) {
      console.log('ℹ️  "Other" category already exists');
    } else {
      await Category.create({
        name: 'Other',
        description: 'Miscellaneous courses',
        icon: '',
        isFeatured: false,
        isSystemCategory: true,
        isActive: true,
        order: 9999
      });
      console.log('✅ "Other" category created successfully');
    }

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedOtherCategory();

