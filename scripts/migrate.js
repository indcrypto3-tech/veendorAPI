import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import OTP from '../src/models/OTP.js';
import RefreshToken from '../src/models/RefreshToken.js';
import Vendor from '../src/models/Vendor.js';
import Service from '../src/models/Service.js';
import Order from '../src/models/Order.js';
import Notification from '../src/models/Notification.js';
import logger from '../src/utils/logger.js';

const createIndexes = async () => {
  try {
    await connectDB();

    logger.info('Creating indexes...');

    // User indexes
    await User.createIndexes();
    logger.info('User indexes created');

    // OTP indexes
    await OTP.createIndexes();
    logger.info('OTP indexes created');

    // RefreshToken indexes
    await RefreshToken.createIndexes();
    logger.info('RefreshToken indexes created');

    // Vendor indexes
    await Vendor.createIndexes();
    logger.info('Vendor indexes created');

    // Service indexes
    await Service.createIndexes();
    logger.info('Service indexes created');

    // Order indexes
    await Order.createIndexes();
    logger.info('Order indexes created');

    // Notification indexes
    await Notification.createIndexes();
    logger.info('Notification indexes created');

    logger.info('All indexes created successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Migration failed');
    process.exit(1);
  }
};

createIndexes();
