import mongoose from 'mongoose';
import Lead from '../models/Lead';
import { connectDB } from '../utils/database';

interface DuplicateInfo {
  field: 'email' | 'phone';
  value: string;
  leads: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    createdAt: Date;
  }>;
}

const findDuplicates = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    console.log('🔍 Searching for duplicate emails...');
    
    // Find duplicate emails
    const emailDuplicates = await Lead.aggregate([
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          leads: { 
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              phone: '$phone',
              company: '$company',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('🔍 Searching for duplicate phone numbers...');
    
    // Find duplicate phones
    const phoneDuplicates = await Lead.aggregate([
      {
        $group: {
          _id: '$phone',
          count: { $sum: 1 },
          leads: { 
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              phone: '$phone',
              company: '$company',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📊 DUPLICATE ANALYSIS RESULTS');
    console.log('='.repeat(50));
    
    if (emailDuplicates.length === 0 && phoneDuplicates.length === 0) {
      console.log('✅ No duplicates found! Your database is clean.');
      return;
    }

    if (emailDuplicates.length > 0) {
      console.log(`\n📧 DUPLICATE EMAILS (${emailDuplicates.length} groups):`);
      console.log('-'.repeat(50));
      
      emailDuplicates.forEach((group, index) => {
        console.log(`\n${index + 1}. Email: ${group._id} (${group.count} leads)`);
        group.leads.forEach((lead: any, leadIndex: number) => {
          console.log(`   ${leadIndex + 1}. ${lead.name} | ${lead.company || 'No company'} | ${lead.createdAt.toLocaleDateString()} | ID: ${lead._id}`);
        });
      });
    }

    if (phoneDuplicates.length > 0) {
      console.log(`\n📱 DUPLICATE PHONES (${phoneDuplicates.length} groups):`);
      console.log('-'.repeat(50));
      
      phoneDuplicates.forEach((group, index) => {
        console.log(`\n${index + 1}. Phone: ${group._id} (${group.count} leads)`);
        group.leads.forEach((lead: any, leadIndex: number) => {
          console.log(`   ${leadIndex + 1}. ${lead.name} | ${lead.email} | ${lead.createdAt.toLocaleDateString()} | ID: ${lead._id}`);
        });
      });
    }

    console.log('\n🛠️  CLEANUP RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    console.log('1. Review each duplicate group above');
    console.log('2. Decide which lead to keep (usually the oldest/most complete)');
    console.log('3. Merge important data from duplicates into the lead you want to keep');
    console.log('4. Delete the duplicate leads');
    console.log('5. Run this script again to verify cleanup');
    console.log('6. Then run: npm run create-indexes');
    
    const totalDuplicateLeads = 
      emailDuplicates.reduce((sum, group) => sum + (group.count - 1), 0) +
      phoneDuplicates.reduce((sum, group) => sum + (group.count - 1), 0);
    
    console.log(`\n📈 SUMMARY: Found ${totalDuplicateLeads} duplicate leads that need cleanup`);
    
  } catch (error) {
    console.error('❌ Error finding duplicates:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  findDuplicates();
}

export default findDuplicates;
