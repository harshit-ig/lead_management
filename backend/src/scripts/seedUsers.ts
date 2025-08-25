import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../utils/database';
import User from '../models/User';

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seeding...');
    
    // Connect to database
    await connectDatabase();
    
    // Clear existing users (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    
    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@leadmanager.com',
      password: 'admin123456',
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);
    
    // Create regular user
    const regularUser = new User({
      name: 'Regular User',
      email: 'user@leadmanager.com',
      password: 'user123456',
      role: 'user'
    });
    
    await regularUser.save();
    console.log('✅ Regular user created:', regularUser.email);
    
    // Create additional test users
    const testUsers = [
      {
        name: 'John Sales',
        email: 'john@leadmanager.com',
        password: 'password123',
        role: 'user' as const
      },
      {
        name: 'Sarah Manager',
        email: 'sarah@leadmanager.com',
        password: 'password123',
        role: 'admin' as const
      },
      {
        name: 'Mike Agent',
        email: 'mike@leadmanager.com',
        password: 'password123',
        role: 'user' as const
      }
    ];
    
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Test user created: ${user.email} (${user.role})`);
    }
    
    console.log('\n🎉 User seeding completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('Admin: admin@leadmanager.com / admin123456');
    console.log('User:  user@leadmanager.com / user123456');
    console.log('\n🔗 Additional test users:');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

// Run the seed function
seedUsers();
