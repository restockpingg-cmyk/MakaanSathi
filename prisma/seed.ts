/**
 * BEFORE RUNNING THIS SEED:
 * 1. Go to Supabase Dashboard → Authentication → Users → Add User
 * 2. Create a user with email: demo@brokerbook.in and a password of your choice
 * 3. Copy the UUID of that user from the "UID" column
 * 4. Paste it in the DEMO_SUPABASE_UID constant below
 * 5. Then run: npm run db:seed
 */

import { PrismaClient, DealStage, Purpose, BuyerStatus, PropertyType, Furnishing, PropertyStatus, VisitStatus, FollowUpType, DocOwner } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

const DEMO_SUPABASE_UID = 'PASTE_YOUR_SUPABASE_USER_UUID_HERE';

async function main() {
  console.log('🌱 Seeding BrokerBook database...');

  // Create demo broker
  const broker = await prisma.broker.upsert({
    where: { email: 'demo@brokerbook.in' },
    update: {},
    create: {
      supabase_uid: DEMO_SUPABASE_UID,
      name: 'Rajesh Mehta',
      email: 'demo@brokerbook.in',
      phone: '9820000001',
      rera_number: 'A51900012345',
      office_area: 'Andheri West',
    },
  });
  console.log(`✅ Broker created: ${broker.name}`);

  // Create 5 buyers
  const buyers = await Promise.all([
    prisma.buyer.create({
      data: {
        broker_id: broker.id,
        name: 'Suresh Nair',
        phone: '9820000011',
        email: 'suresh.nair@email.com',
        budget_min: 8000000,
        budget_max: 12000000,
        preferred_localities: ['Andheri West', 'Andheri East', 'Versova'],
        bhk_requirement: ['2BHK', '3BHK'],
        floor_preference: 'High',
        furnishing_preference: 'SEMI',
        purpose: Purpose.SELF_USE,
        notes: 'Looking for a spacious flat near metro station. Prefers societies with gym.',
        status: BuyerStatus.ACTIVE,
        last_contacted_at: subDays(new Date(), 3),
      },
    }),
    prisma.buyer.create({
      data: {
        broker_id: broker.id,
        name: 'Priya Sharma',
        phone: '9820000012',
        email: 'priya.sharma@email.com',
        budget_min: 5000000,
        budget_max: 7500000,
        preferred_localities: ['Malad West', 'Malad East', 'Goregaon West'],
        bhk_requirement: ['1BHK', '2BHK'],
        furnishing_preference: 'FURNISHED',
        purpose: Purpose.INVESTMENT,
        notes: 'First investment property. Interested in rental yield.',
        status: BuyerStatus.ACTIVE,
        last_contacted_at: subDays(new Date(), 10),
      },
    }),
    prisma.buyer.create({
      data: {
        broker_id: broker.id,
        name: 'Amit Patel',
        phone: '9820000013',
        budget_min: 6000000,
        budget_max: 9000000,
        preferred_localities: ['Borivali West', 'Dahisar', 'Kandivali West'],
        bhk_requirement: ['2BHK', '3BHK'],
        floor_preference: 'Low',
        purpose: Purpose.SELF_USE,
        notes: 'Elderly parents will be living. Ground or lower floors only.',
        status: BuyerStatus.ACTIVE,
        last_contacted_at: subDays(new Date(), 2),
      },
    }),
    prisma.buyer.create({
      data: {
        broker_id: broker.id,
        name: 'Neha Joshi',
        phone: '9820000014',
        email: 'neha.joshi@email.com',
        budget_min: 4000000,
        budget_max: 6000000,
        preferred_localities: ['Kandivali East', 'Thakur Village', 'Poisar'],
        bhk_requirement: ['2BHK'],
        furnishing_preference: 'SEMI',
        purpose: Purpose.SELF_USE,
        notes: 'Recently married. Needs schools nearby.',
        status: BuyerStatus.ACTIVE,
        last_contacted_at: subDays(new Date(), 5),
      },
    }),
    prisma.buyer.create({
      data: {
        broker_id: broker.id,
        name: 'Vikram Desai',
        phone: '9820000015',
        budget_min: 12000000,
        budget_max: 20000000,
        preferred_localities: ['Thane West', 'Hiranandani Estate', 'Ghodbunder Road'],
        bhk_requirement: ['3BHK', '4BHK'],
        furnishing_preference: 'FURNISHED',
        purpose: Purpose.SELF_USE,
        notes: 'Senior executive. Wants premium society with all amenities.',
        status: BuyerStatus.ACTIVE,
        last_contacted_at: subDays(new Date(), 1),
      },
    }),
  ]);
  console.log(`✅ ${buyers.length} buyers created`);

  // Create 8 properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Ramesh Kulkarni',
        owner_phone: '9821000001',
        locality: 'Andheri West',
        society_name: 'Lokhandwala Complex',
        address: 'Flat 502, A Wing, Lokhandwala Complex, Andheri West',
        bhk: '2BHK',
        floor: 5,
        total_floors: 12,
        area_sqft: 950,
        price: 10500000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.SEMI,
        parking: true,
        amenities: ['Gym', 'Swimming Pool', 'Clubhouse', 'Security'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Sunita Ghosh',
        owner_phone: '9821000002',
        locality: 'Malad West',
        society_name: 'Inorbit Heights',
        address: 'Flat 1201, B Wing, Inorbit Heights, Malad West',
        bhk: '2BHK',
        floor: 12,
        total_floors: 20,
        area_sqft: 890,
        price: 7200000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.FURNISHED,
        parking: true,
        amenities: ['Gym', 'Garden', 'Security', 'Power Backup'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Vijay Raut',
        owner_phone: '9821000003',
        locality: 'Borivali West',
        society_name: 'Ekta Garden',
        address: 'Flat 301, Ekta Garden, Borivali West',
        bhk: '3BHK',
        floor: 3,
        total_floors: 8,
        area_sqft: 1200,
        price: 8500000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.UNFURNISHED,
        parking: true,
        amenities: ['Garden', 'Security', 'Power Backup'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Kavita Shah',
        owner_phone: '9821000004',
        locality: 'Kandivali East',
        society_name: 'Thakur Village CHS',
        address: 'Flat 204, Thakur Village CHS, Kandivali East',
        bhk: '2BHK',
        floor: 2,
        total_floors: 6,
        area_sqft: 870,
        price: 5800000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.SEMI,
        parking: false,
        amenities: ['Garden', 'Security'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Deepak Verma',
        owner_phone: '9821000005',
        locality: 'Thane West',
        society_name: 'Hiranandani Estate',
        address: 'Flat 1804, Tower 3, Hiranandani Estate, Thane West',
        bhk: '3BHK',
        floor: 18,
        total_floors: 25,
        area_sqft: 1450,
        price: 16000000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.FURNISHED,
        parking: true,
        amenities: ['Gym', 'Swimming Pool', 'Clubhouse', 'Tennis Court', 'Security', 'Power Backup'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Anita Sawant',
        owner_phone: '9821000006',
        locality: 'Andheri East',
        society_name: 'Marol CHS',
        address: 'Flat 401, Marol CHS, Andheri East',
        bhk: '1BHK',
        floor: 4,
        total_floors: 7,
        area_sqft: 560,
        price: 65000,
        property_type: PropertyType.RENT,
        furnishing: Furnishing.FURNISHED,
        parking: false,
        amenities: ['Security', 'Power Backup'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Prakash Iyer',
        owner_phone: '9821000007',
        locality: 'Goregaon West',
        society_name: 'Aarey Colony Road CHS',
        address: 'Flat 603, Aarey Colony Rd CHS, Goregaon West',
        bhk: '2BHK',
        floor: 6,
        total_floors: 10,
        area_sqft: 820,
        price: 7000000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.SEMI,
        parking: true,
        amenities: ['Garden', 'Security', 'Parking'],
        photos: [],
        status: PropertyStatus.AVAILABLE,
      },
    }),
    prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name: 'Sanjay Bhatt',
        owner_phone: '9821000008',
        locality: 'Borivali West',
        society_name: 'IC Colony CHS',
        address: 'Flat 102, IC Colony, Borivali West',
        bhk: '2BHK',
        floor: 1,
        total_floors: 5,
        area_sqft: 800,
        price: 7800000,
        property_type: PropertyType.SALE,
        furnishing: Furnishing.SEMI,
        parking: false,
        amenities: ['Security'],
        photos: [],
        status: PropertyStatus.ON_HOLD,
      },
    }),
  ]);
  console.log(`✅ ${properties.length} properties created`);

  // Create 4 deals in different stages
  const deal1 = await prisma.deal.create({
    data: {
      buyer_id: buyers[0].id,
      property_id: properties[0].id,
      broker_id: broker.id,
      stage: DealStage.NEGOTIATION,
      expected_close_date: addDays(new Date(), 30),
      commission_amount: 210000,
      notes: 'Buyer is serious. Negotiating on price — owner has agreed to drop by 2L.',
    },
  });
  await prisma.stageHistory.createMany({
    data: [
      { deal_id: deal1.id, stage: DealStage.INQUIRY, moved_at: subDays(new Date(), 15) },
      { deal_id: deal1.id, stage: DealStage.SITE_VISIT, moved_at: subDays(new Date(), 10) },
      { deal_id: deal1.id, stage: DealStage.NEGOTIATION, moved_at: subDays(new Date(), 3) },
    ],
  });
  await prisma.document.createMany({
    data: [
      { deal_id: deal1.id, document_name: 'Aadhar Card', required_from: DocOwner.BUYER, is_received: true, received_at: subDays(new Date(), 5) },
      { deal_id: deal1.id, document_name: 'PAN Card', required_from: DocOwner.BUYER, is_received: true, received_at: subDays(new Date(), 5) },
      { deal_id: deal1.id, document_name: 'Bank Statement (6 months)', required_from: DocOwner.BUYER, is_received: false },
      { deal_id: deal1.id, document_name: 'Property Title Deed', required_from: DocOwner.SELLER, is_received: true, received_at: subDays(new Date(), 8) },
      { deal_id: deal1.id, document_name: 'NOC from Society', required_from: DocOwner.SOCIETY, is_received: false },
      { deal_id: deal1.id, document_name: 'Electricity Bill', required_from: DocOwner.SELLER, is_received: false },
    ],
  });

  const deal2 = await prisma.deal.create({
    data: {
      buyer_id: buyers[3].id,
      property_id: properties[3].id,
      broker_id: broker.id,
      stage: DealStage.SITE_VISIT,
      expected_close_date: addDays(new Date(), 45),
      notes: 'Site visit done. Buyer liked the flat but wants to bring parents for second visit.',
    },
  });
  await prisma.stageHistory.createMany({
    data: [
      { deal_id: deal2.id, stage: DealStage.INQUIRY, moved_at: subDays(new Date(), 7) },
      { deal_id: deal2.id, stage: DealStage.SITE_VISIT, moved_at: subDays(new Date(), 2) },
    ],
  });
  await prisma.document.createMany({
    data: [
      { deal_id: deal2.id, document_name: 'Aadhar Card', required_from: DocOwner.BUYER, is_received: true, received_at: subDays(new Date(), 2) },
      { deal_id: deal2.id, document_name: 'PAN Card', required_from: DocOwner.BUYER, is_received: false },
      { deal_id: deal2.id, document_name: 'Property Title Deed', required_from: DocOwner.SELLER, is_received: false },
      { deal_id: deal2.id, document_name: 'NOC from Society', required_from: DocOwner.SOCIETY, is_received: false },
    ],
  });

  const deal3 = await prisma.deal.create({
    data: {
      buyer_id: buyers[4].id,
      property_id: properties[4].id,
      broker_id: broker.id,
      stage: DealStage.AGREEMENT,
      expected_close_date: addDays(new Date(), 15),
      commission_amount: 480000,
      notes: 'Agreement draft shared. Lawyer reviewing. Stamp duty to be paid next week.',
    },
  });
  await prisma.stageHistory.createMany({
    data: [
      { deal_id: deal3.id, stage: DealStage.INQUIRY, moved_at: subDays(new Date(), 30) },
      { deal_id: deal3.id, stage: DealStage.SITE_VISIT, moved_at: subDays(new Date(), 25) },
      { deal_id: deal3.id, stage: DealStage.NEGOTIATION, moved_at: subDays(new Date(), 15) },
      { deal_id: deal3.id, stage: DealStage.AGREEMENT, moved_at: subDays(new Date(), 5) },
    ],
  });
  await prisma.document.createMany({
    data: [
      { deal_id: deal3.id, document_name: 'Aadhar Card', required_from: DocOwner.BUYER, is_received: true, received_at: subDays(new Date(), 20) },
      { deal_id: deal3.id, document_name: 'PAN Card', required_from: DocOwner.BUYER, is_received: true, received_at: subDays(new Date(), 20) },
      { deal_id: deal3.id, document_name: 'Bank Statement (6 months)', required_from: DocOwner.BUYER, is_received: true, received_at: subDays(new Date(), 10) },
      { deal_id: deal3.id, document_name: 'Property Title Deed', required_from: DocOwner.SELLER, is_received: true, received_at: subDays(new Date(), 18) },
      { deal_id: deal3.id, document_name: 'NOC from Society', required_from: DocOwner.SOCIETY, is_received: true, received_at: subDays(new Date(), 7) },
      { deal_id: deal3.id, document_name: 'Sale Agreement Draft', required_from: DocOwner.SELLER, is_received: true, received_at: subDays(new Date(), 5) },
    ],
  });

  const deal4 = await prisma.deal.create({
    data: {
      buyer_id: buyers[1].id,
      property_id: properties[1].id,
      broker_id: broker.id,
      stage: DealStage.INQUIRY,
      notes: 'Fresh lead. WhatsApp inquiry. Scheduled call tomorrow.',
    },
  });
  await prisma.stageHistory.create({
    data: { deal_id: deal4.id, stage: DealStage.INQUIRY, moved_at: subDays(new Date(), 1) },
  });

  console.log('✅ 4 deals created with documents and stage history');

  // Create site visits
  await prisma.siteVisit.createMany({
    data: [
      {
        buyer_id: buyers[0].id,
        property_id: properties[0].id,
        broker_id: broker.id,
        scheduled_at: subDays(new Date(), 10),
        status: VisitStatus.COMPLETED,
        buyer_feedback: 'Liked the flat. Negotiating price.',
        broker_notes: 'Buyer is serious. Price negotiation ongoing.',
      },
      {
        buyer_id: buyers[4].id,
        property_id: properties[4].id,
        broker_id: broker.id,
        scheduled_at: subDays(new Date(), 25),
        status: VisitStatus.COMPLETED,
        buyer_feedback: 'Perfect property. Wants to proceed.',
        broker_notes: 'Closing imminent.',
      },
      {
        buyer_id: buyers[3].id,
        property_id: properties[3].id,
        broker_id: broker.id,
        scheduled_at: subDays(new Date(), 2),
        status: VisitStatus.COMPLETED,
        buyer_feedback: 'Liked it. Wants second visit with parents.',
      },
      {
        buyer_id: buyers[2].id,
        property_id: properties[2].id,
        broker_id: broker.id,
        scheduled_at: addDays(new Date(), 2),
        status: VisitStatus.SCHEDULED,
        broker_notes: 'First visit. Buyer travelling from Thane.',
      },
    ],
  });
  console.log('✅ Site visits created');

  // Create 10 follow-ups (2 overdue)
  await prisma.followUp.createMany({
    data: [
      // 2 overdue
      {
        broker_id: broker.id,
        buyer_id: buyers[1].id,
        due_at: subDays(new Date(), 3),
        type: FollowUpType.CALL,
        note: 'Follow up on Malad property interest',
        is_done: false,
      },
      {
        broker_id: broker.id,
        buyer_id: buyers[2].id,
        due_at: subDays(new Date(), 1),
        type: FollowUpType.WHATSAPP,
        note: 'Send property photos of Borivali listings',
        is_done: false,
      },
      // Active follow-ups
      {
        broker_id: broker.id,
        buyer_id: buyers[0].id,
        due_at: addDays(new Date(), 1),
        type: FollowUpType.CALL,
        note: 'Negotiation call — confirm final price',
        is_done: false,
      },
      {
        broker_id: broker.id,
        buyer_id: buyers[3].id,
        due_at: addDays(new Date(), 2),
        type: FollowUpType.SITE_VISIT,
        note: 'Second visit with parents',
        is_done: false,
      },
      {
        broker_id: broker.id,
        buyer_id: buyers[4].id,
        due_at: addDays(new Date(), 1),
        type: FollowUpType.CALL,
        note: 'Agreement signing update',
        is_done: false,
      },
      {
        broker_id: broker.id,
        property_id: properties[5].id,
        due_at: addDays(new Date(), 3),
        type: FollowUpType.CALL,
        note: 'Check with owner on rental terms update',
        is_done: false,
      },
      {
        broker_id: broker.id,
        buyer_id: buyers[1].id,
        due_at: addDays(new Date(), 4),
        type: FollowUpType.WHATSAPP,
        note: 'Send Goregaon property details',
        is_done: false,
      },
      {
        broker_id: broker.id,
        buyer_id: buyers[2].id,
        due_at: addDays(new Date(), 5),
        type: FollowUpType.SITE_VISIT,
        note: 'Pre-visit briefing call',
        is_done: false,
      },
      // Done follow-ups
      {
        broker_id: broker.id,
        buyer_id: buyers[0].id,
        due_at: subDays(new Date(), 12),
        type: FollowUpType.CALL,
        note: 'Initial enquiry call',
        is_done: true,
      },
      {
        broker_id: broker.id,
        buyer_id: buyers[4].id,
        due_at: subDays(new Date(), 20),
        type: FollowUpType.SITE_VISIT,
        note: 'Schedule Hiranandani visit',
        is_done: true,
      },
    ],
  });
  console.log('✅ 10 follow-ups created (2 overdue)');

  console.log('\n🎉 Seed complete! Login with: demo@brokerbook.in');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
