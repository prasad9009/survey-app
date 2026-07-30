import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { connectMongo } from '../config/db.js'
import '../models/index.js'
import Company from '../models/Company.js'
import User from '../models/User.js'
import Instrument from '../models/Instrument.js'
import InstrumentAssignment from '../models/InstrumentAssignment.js'
import AccountManager from '../models/AccountManager.js'
import Client from '../models/Client.js'
import Site from '../models/Site.js'
import SiteVisit from '../models/SiteVisit.js'
import Transaction from '../models/Transaction.js'
import Subscription from '../models/Subscription.js'

const pwd = env.seedPassword

async function run() {
  if (!env.mongodbUri) {
    console.error('Set MONGO_URI or MONGODB_URI in backend/.env')
    process.exit(1)
  }
  await connectMongo(env.mongodbUri)
  await Company.deleteMany({})
  await User.deleteMany({})
  await Instrument.deleteMany({})
  await InstrumentAssignment.deleteMany({})
  await AccountManager.deleteMany({})
  await Client.deleteMany({})
  await Site.deleteMany({})
  await SiteVisit.deleteMany({})
  await Transaction.deleteMany({})
  await Subscription.deleteMany({})

  // 1. Company (1 Record)
  const company = await Company.create({
    name: 'Samarth Land Surveyors',
    ownerName: 'Er. Shubham Bhoi',
    contactPhone: '+91 8643001010',
    email: 'samarthlandsurveyors@gmail.com',
    settings: { currency: 'INR', dateFormat: 'DD/MM/YYYY', defaultInstrumentTypeLabel: 'Total Station' },
  })

  await Subscription.create({
    companyId: company._id,
    planName: 'Standard',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 864e5),
  })

  // 2. Users (1 Super Admin & 2 Admins)
  const passwordHash = await bcrypt.hash(pwd, 12)
  const superUser = await User.create({
    companyId: company._id,
    email: 'admin@samarth.local',
    passwordHash,
    role: 'super_admin',
    profile: { fullName: 'Super Admin', phone: '+91 9990000001' },
  })

  const adminUser1 = await User.create({
    companyId: company._id,
    email: 'shubham@samarth.local',
    passwordHash,
    role: 'admin',
    profile: { fullName: 'Er. Shubham Bhoi', phone: '+91 8643001010' },
  })

  const adminUser2 = await User.create({
    companyId: company._id,
    email: 'sanket@samarth.local',
    passwordHash,
    role: 'admin',
    profile: { fullName: 'Er. Sanket Katakar', phone: '+91 7026016077' },
  })

  // 3. Instrument (1 Record)
  const inst1 = await Instrument.create({
    companyId: company._id,
    name: 'Total Station TS-01',
    category: 'Total Station',
    serialNumber: 'TS-2024-001',
    status: 'operational',
  })

  // 4. Instrument Assignments (Assigned to both Admin Users)
  await InstrumentAssignment.insertMany([
    {
      companyId: company._id,
      adminId: adminUser1._id,
      instrumentId: inst1._id,
      assignedByUserId: superUser._id,
      isActive: true,
    },
    {
      companyId: company._id,
      adminId: adminUser2._id,
      instrumentId: inst1._id,
      assignedByUserId: superUser._id,
      isActive: true,
    },
  ])

  // 5. Account Managers (2 Records for the 2 Admin Users)
  const am1 = await AccountManager.create({
    companyId: company._id,
    adminId: adminUser1._id,
    instrumentId: inst1._id,
    slug: 'shubham-bhoi',
    fullName: 'Er. Shubham Bhoi',
    shortName: 'Shubham Bhoi',
    phone: '+91 8643001010',
  })

  const am2 = await AccountManager.create({
    companyId: company._id,
    adminId: adminUser2._id,
    instrumentId: inst1._id,
    slug: 'sanket-katkar',
    fullName: 'Er. Sanket Katakar',
    shortName: 'Sanket Katakar',
    phone: '+91 7026016077',
  })

  // 6. Operational Data (Client, Site, Visit, Transactions)
  const client1 = await Client.create({
    companyId: company._id,
    adminId: adminUser1._id,
    instrumentId: inst1._id,
    name: 'Amit Developers',
    phone: '9876543210',
  })

  const site1 = await Site.create({
    companyId: company._id,
    adminId: adminUser1._id,
    instrumentId: inst1._id,
    clientId: client1._id,
    name: 'Sai Residency',
    locationLabel: 'Pune',
    status: 'active',
    lastVisitAt: new Date(),
  })

  await SiteVisit.create({
    companyId: company._id,
    adminId: adminUser1._id,
    instrumentId: inst1._id,
    clientId: client1._id,
    siteId: site1._id,
    visitCode: 'SV-4001',
    visitDate: new Date(),
    workDescription: 'Topographic survey for layout planning and road alignment.',
    machineLabel: 'Total Station',
    amount: mongoose.Types.Decimal128.fromString('15000.00'),
    paymentMode: 'Cash',
    paymentStatus: 'paid',
    notes: 'Completed boundary points and levels.',
    photoUrls: [],
  })

  await Transaction.insertMany([
    {
      companyId: company._id,
      adminId: adminUser1._id,
      accountManagerId: am1._id,
      instrumentId: inst1._id,
      type: 'credit',
      amount: mongoose.Types.Decimal128.fromString('15000.00'),
      occurredOn: new Date(),
      reason: 'Client payment for survey',
      clientId: client1._id,
      siteId: site1._id,
    },
    {
      companyId: company._id,
      adminId: adminUser2._id,
      accountManagerId: am2._id,
      instrumentId: inst1._id,
      type: 'debit',
      amount: mongoose.Types.Decimal128.fromString('1500.00'),
      occurredOn: new Date(),
      reason: 'Site travel & fuel expense',
      clientId: client1._id,
      siteId: site1._id,
    },
  ])

  console.info('Seed complete.')
  console.info('Super Admin: admin@samarth.local /', pwd)
  console.info('Admin 1:     shubham@samarth.local /', pwd)
  console.info('Admin 2:     sanket@samarth.local /', pwd)
  await mongoose.connection.close()
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
