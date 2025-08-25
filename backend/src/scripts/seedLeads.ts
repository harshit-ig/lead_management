import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../utils/database';
import Lead from '../models/Lead';
import User from '../models/User';
import type { LeadSource, LeadStatus, LeadPriority } from '../types';

// Load environment variables
dotenv.config();

const sampleLeads = [
  {
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1-555-0101',
    company: 'TechCorp Solutions',
    position: 'CTO',
    source: 'Website' as LeadSource,
    status: 'New' as LeadStatus,
    priority: 'High' as LeadPriority
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@innovate.io',
    phone: '+1-555-0102',
    company: 'Innovate.io',
    position: 'VP of Marketing',
    source: 'Social Media' as LeadSource,
    status: 'Contacted' as LeadStatus,
    priority: 'Medium' as LeadPriority
  },
  {
    name: 'Michael Chen',
    email: 'mchen@dataworks.com',
    phone: '+1-555-0103',
    company: 'DataWorks Inc',
    position: 'Lead Developer',
    source: 'Referral' as LeadSource,
    status: 'Interested' as LeadStatus,
    priority: 'High' as LeadPriority
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@startup.co',
    phone: '+1-555-0104',
    company: 'Startup Co',
    position: 'Founder & CEO',
    source: 'Cold Call' as LeadSource,
    status: 'Follow-up' as LeadStatus,
    priority: 'High' as LeadPriority
  },
  {
    name: 'David Wilson',
    email: 'dwilson@enterprise.org',
    phone: '+1-555-0105',
    company: 'Enterprise Solutions',
    position: 'IT Director',
    source: 'Website' as LeadSource,
    status: 'Qualified' as LeadStatus,
    priority: 'Medium' as LeadPriority
  },
  {
    name: 'Lisa Anderson',
    email: 'landerson@consulting.net',
    phone: '+1-555-0106',
    company: 'Anderson Consulting',
    position: 'Senior Consultant',
    source: 'Email Campaign' as LeadSource,
    status: 'Proposal Sent' as LeadStatus,
    priority: 'High' as LeadPriority
  },
  {
    name: 'Robert Taylor',
    email: 'rtaylor@manufacturing.com',
    phone: '+1-555-0107',
    company: 'Taylor Manufacturing',
    position: 'Operations Manager',
    source: 'Manual' as LeadSource,
    status: 'Negotiating' as LeadStatus,
    priority: 'High' as LeadPriority
  },
  {
    name: 'Jennifer Brown',
    email: 'jbrown@healthtech.com',
    phone: '+1-555-0108',
    company: 'HealthTech Solutions',
    position: 'Product Manager',
    source: 'Social Media' as LeadSource,
    status: 'Closed-Won' as LeadStatus,
    priority: 'Medium' as LeadPriority
  },
  {
    name: 'Christopher Lee',
    email: 'clee@fintech.io',
    phone: '+1-555-0109',
    company: 'FinTech Innovations',
    position: 'Head of Technology',
    source: 'Referral' as LeadSource,
    status: 'New' as LeadStatus,
    priority: 'Low' as LeadPriority
  },
  {
    name: 'Amanda Garcia',
    email: 'agarcia@retail.com',
    phone: '+1-555-0110',
    company: 'Garcia Retail Group',
    position: 'Digital Marketing Director',
    source: 'Website' as LeadSource,
    status: 'Contacted' as LeadStatus,
    priority: 'Medium' as LeadPriority
  },
  {
    name: 'James Miller',
    email: 'jmiller@logistics.org',
    phone: '+1-555-0111',
    company: 'Miller Logistics',
    position: 'COO',
    source: 'Import' as LeadSource,
    status: 'Not Interested' as LeadStatus,
    priority: 'Low' as LeadPriority
  },
  {
    name: 'Michelle Rodriguez',
    email: 'mrodriguez@education.edu',
    phone: '+1-555-0112',
    company: 'Rodriguez Educational Services',
    position: 'Technology Coordinator',
    source: 'Cold Call' as LeadSource,
    status: 'Closed-Lost' as LeadStatus,
    priority: 'Low' as LeadPriority
  }
];

const seedLeads = async () => {
  try {
    console.log('🌱 Starting lead seeding...');
    
    // Connect to database
    await connectDatabase();
    
    // Get users for assignment
    const users = await User.find({ role: 'user' });
    const adminUsers = await User.find({ role: 'admin' });
    
    if (users.length === 0) {
      console.log('⚠️  No users found. Please run user seeding first.');
      process.exit(1);
    }
    
    // Clear existing leads (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing leads...');
    await Lead.deleteMany({});
    
    // Create leads
    console.log('📝 Creating sample leads...');
    
    const createdLeads = [];
    
    for (let i = 0; i < sampleLeads.length; i++) {
      const leadData = sampleLeads[i];
      
      // Randomly assign leads to users (some unassigned)
      const shouldAssign = Math.random() > 0.3; // 70% chance of assignment
      const assignedUser = shouldAssign ? users[Math.floor(Math.random() * users.length)] : null;
      const assignedByUser = assignedUser ? adminUsers[Math.floor(Math.random() * adminUsers.length)] : null;
      
      const lead = new Lead({
        ...leadData,
        assignedTo: assignedUser?._id,
        assignedBy: assignedByUser?._id
      });
      
      // Add some random notes to some leads
      if (Math.random() > 0.6) { // 40% chance of having notes
        const noteCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < noteCount; j++) {
          const noteTexts = [
            'Initial contact made via phone',
            'Sent follow-up email with product information',
            'Scheduled demo for next week',
            'Client expressed interest in enterprise plan',
            'Waiting for decision from procurement team',
            'Requested additional references',
            'Discussed pricing and implementation timeline'
          ];
          
          const randomNote = noteTexts[Math.floor(Math.random() * noteTexts.length)];
          lead.notes.push({
            id: lead._id.toString() + j,
            content: randomNote,
            createdBy: assignedUser?._id || adminUsers[0]._id,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
          });
        }
      }
      
      await lead.save();
      createdLeads.push(lead);
      
      console.log(`✅ Lead created: ${lead.name} (${lead.company}) - Status: ${lead.status}`);
    }
    
    // Show assignment summary
    const assignedCount = createdLeads.filter(lead => lead.assignedTo).length;
    const unassignedCount = createdLeads.length - assignedCount;
    
    console.log('\n📊 Lead Seeding Summary:');
    console.log(`Total leads created: ${createdLeads.length}`);
    console.log(`Assigned leads: ${assignedCount}`);
    console.log(`Unassigned leads: ${unassignedCount}`);
    
    // Show status distribution
    const statusCounts = createdLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📈 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
    console.log('\n🎉 Lead seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding leads:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

// Run the seed function
seedLeads();
