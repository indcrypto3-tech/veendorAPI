import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Vendor from '../src/models/Vendor.js';
import Service from '../src/models/Service.js';
import logger from '../src/utils/logger.js';

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Vendor.deleteMany({});
    await Service.deleteMany({});

    logger.info('Cleared existing data');

    // Create vendor user
    const user = await User.create({
      phone: '+1234567890',
      role: 'vendor',
      name: 'John Doe',
      phoneVerified: true,
    });

    logger.info({ userId: user._id }, 'Created user');

    // Create vendor profile
    const vendor = await Vendor.create({
      userId: user._id,
      businessName: 'Acme Services',
      description: 'Professional home services provider',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      },
      phone: '+1234567890',
      email: 'contact@acmeservices.com',
      status: 'active',
    });

    logger.info({ vendorId: vendor._id }, 'Created vendor');

    // Create services
    const services = [
      {
        vendorId: vendor._id,
        title: 'House Cleaning',
        slug: 'house-cleaning',
        description: 'Professional house cleaning service with eco-friendly products',
        price: 99.99,
        currency: 'USD',
        durationMinutes: 120,
        category: 'Cleaning',
        status: 'active',
      },
      {
        vendorId: vendor._id,
        title: 'Lawn Maintenance',
        slug: 'lawn-maintenance',
        description: 'Complete lawn care including mowing, edging, and fertilizing',
        price: 75.0,
        currency: 'USD',
        durationMinutes: 90,
        category: 'Landscaping',
        status: 'active',
      },
      {
        vendorId: vendor._id,
        title: 'Plumbing Repair',
        slug: 'plumbing-repair',
        description: 'Expert plumbing repair and installation services',
        price: 150.0,
        currency: 'USD',
        durationMinutes: 60,
        category: 'Plumbing',
        status: 'active',
      },
    ];

    await Service.insertMany(services);

    logger.info('Created services');

    logger.info('Seed data created successfully');
    logger.info('Test credentials:');
    logger.info('  Phone: +1234567890');
    logger.info('  OTP (dummy mode): 123456');

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Seed failed');
    process.exit(1);
  }
};

seedData();
