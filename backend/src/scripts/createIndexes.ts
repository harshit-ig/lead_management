import mongoose from 'mongoose';
import Lead from '../models/Lead';
import { connectDB } from '../utils/database';

const createIndexes = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    console.log('📊 Creating indexes...');
    
    // Create unique indexes for email and phone
    await Lead.collection.createIndex({ email: 1 }, { unique: true, background: true });
    console.log('✅ Email index created');
    
    await Lead.collection.createIndex({ phone: 1 }, { unique: true, background: true });
    console.log('✅ Phone index created');
    
    // Create other useful indexes
    await Lead.collection.createIndex({ assignedTo: 1 }, { background: true });
    console.log('✅ AssignedTo index created');
    
    await Lead.collection.createIndex({ status: 1 }, { background: true });
    console.log('✅ Status index created');
    
    await Lead.collection.createIndex({ source: 1 }, { background: true });
    console.log('✅ Source index created');
    
    await Lead.collection.createIndex({ createdAt: -1 }, { background: true });
    console.log('✅ CreatedAt index created');
    
    console.log('🎉 All indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    
    // If unique constraint fails due to existing duplicates, show helpful message
    if (error instanceof Error && error.message.includes('E11000')) {
      console.log('\n⚠️  Duplicate constraint error detected!');
      console.log('This means there are existing duplicate emails or phone numbers in your database.');
      console.log('You need to clean up duplicates before creating unique indexes.');
      console.log('\nTo find duplicates, run:');
      console.log('  npm run find-duplicates');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  createIndexes();
}

export default createIndexes;
