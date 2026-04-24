const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Investor = require('./models/Investor');
const Container = require('./models/Container');
const Sale = require('./models/Sale');
const ContainerInvestment = require('./models/ContainerInvestment');
const Payout = require('./models/Payout');
const EmployeeActivity = require('./models/EmployeeActivity');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URL = process.env.MONGO_URL;

const seedData = async () => {
  try {
     if (!MONGO_URL) throw new Error("MONGO_URL is missing. Check backend/.env");
    await mongoose.connect(MONGO_URL);

    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Investor.deleteMany({});
    await Container.deleteMany({});
    await Sale.deleteMany({});
    await ContainerInvestment.deleteMany({});
    await Payout.deleteMany({});
    await EmployeeActivity.deleteMany({});

    const admin = await User.create({
      email: 'thelmhtrading@gmail.com',
      password: '123456789',
      name: 'Admin User',
      role: 'admin'
    });
    console.log('Admin user created:', admin.email);

    const financeUser = await User.create({
      email: 'finance@thelmhtrading.com',
      password: 'finance123',
      name: 'Finance Manager',
      role: 'finance'
    });
    console.log('Finance user created:', financeUser.email);

    // Create 3 employees
    const employee1 = await User.create({
      email: 'employee1@thelmhtrading.com',
      password: 'employee123',
      name: 'Ahmad Employee',
      role: 'employee'
    });

    const employee2 = await User.create({
      email: 'employee2@thelmhtrading.com',
      password: 'employee123',
      name: 'Bilal Employee',
      role: 'employee'
    });

    const employee3 = await User.create({
      email: 'employee3@thelmhtrading.com',
      password: 'employee123',
      name: 'Caleb Employee',
      role: 'employee'
    });
    console.log('Employees created: 3');

    const investors = [];
    const investor1 = await Investor.create({
      name: 'John Investor',
      email: 'john.investor@example.com',
      password: 'investor123',
      phone: '+1-555-1111',
      status: 'Active'
    });
    investors.push(investor1);

    const investor2 = await Investor.create({
      name: 'Sarah Capital',
      email: 'sarah.capital@example.com',
      password: 'investor123',
      phone: '+1-555-2222',
      status: 'Active'
    });
    investors.push(investor2);

    const investor3 = await Investor.create({
      name: 'Mike Ventures',
      email: 'mike.ventures@example.com',
      password: 'investor123',
      phone: '+1-555-3333',
      status: 'Active'
    });
    investors.push(investor3);

    console.log('Investors created:', investors.length);

    // Purchase prices are auto-calculated: sum(quantity * unitPrice)
    const containers = await Container.insertMany([
      {
        containerNo: 'TELU1234567',
        size: '40FT',
        type: 'Dry',
        purchasePrice: 500*3 + 200*5 + 300*2.5, // 2250
        purchaseDate: new Date('2024-01-15'),
        location: 'Oakland Yard',
        status: 'Available',
        paymentStatus: 'Full',
        createdBy: employee1._id,
        items: [
          { name: 'Rice', quantity: 500, unit: 'Kg', unitPrice: 3 },
          { name: 'Sugar', quantity: 200, unit: 'Bags', unitPrice: 5 },
          { name: 'Flour', quantity: 300, unit: 'Kg', unitPrice: 2.5 }
        ],
        notes: 'Good condition'
      },
      {
        containerNo: 'MAEU7654321',
        size: '20FT',
        type: 'Dry',
        purchasePrice: 100*8 + 50*4, // 1000
        purchaseDate: new Date('2024-02-10'),
        location: 'Long Beach Depot',
        status: 'Sold',
        paymentStatus: 'Full',
        createdBy: employee2._id,
        items: [
          { name: 'Cooking Oil', quantity: 0, unit: 'Ltr', unitPrice: 8 },
          { name: 'Salt', quantity: 0, unit: 'Bags', unitPrice: 4 }
        ],
        notes: 'Minor dents'
      },
      {
        containerNo: 'CSQU9876543',
        size: '40FT',
        type: 'Reefer',
        purchasePrice: 1000*4.5 + 500*6 + 100*12, // 8700
        purchaseDate: new Date('2024-03-05'),
        location: 'Oakland Yard',
        status: 'Reserved',
        paymentStatus: 'Partial',
        createdBy: employee3._id,
        items: [
          { name: 'Frozen Chicken', quantity: 1000, unit: 'Kg', unitPrice: 4.5 },
          { name: 'Frozen Fish', quantity: 500, unit: 'Kg', unitPrice: 6 },
          { name: 'Ice Cream', quantity: 100, unit: 'Box', unitPrice: 12 }
        ],
        notes: 'Excellent refrigeration unit'
      },
      {
        containerNo: 'HLCU4567890',
        size: '20FT',
        type: 'Dry',
        purchasePrice: 50*15 + 200*3.5, // 1450
        purchaseDate: new Date('2024-03-20'),
        location: 'Los Angeles Port',
        status: 'Available',
        paymentStatus: 'Pending',
        createdBy: employee1._id,
        items: [
          { name: 'Cement', quantity: 50, unit: 'Bags', unitPrice: 15 },
          { name: 'Steel Rods', quantity: 200, unit: 'Pcs', unitPrice: 3.5 }
        ]
      },
      {
        containerNo: 'MSCU3456789',
        size: '40FT',
        type: 'Dry',
        purchasePrice: 30*25 + 500*2, // 1750
        purchaseDate: new Date('2024-04-01'),
        location: 'San Diego Yard',
        status: 'Sold',
        paymentStatus: 'Full',
        createdBy: employee2._id,
        items: [
          { name: 'Textiles', quantity: 0, unit: 'Box', unitPrice: 25 },
          { name: 'Garments', quantity: 0, unit: 'Pcs', unitPrice: 2 }
        ],
        notes: 'Recently painted'
      }
    ]);
    console.log('Containers created:', containers.length);

    const soldContainer1 = containers.find(c => c.containerNo === 'MAEU7654321');
    const soldContainer2 = containers.find(c => c.containerNo === 'MSCU3456789');

    const sales = await Sale.insertMany([
      {
        containerId: soldContainer1._id,
        buyerName: 'ABC Construction',
        buyerPhone: '+1-555-0123',
        soldBy: employee1._id,
        items: [
          { itemId: soldContainer1.items[0]._id, name: 'Cooking Oil', quantity: 100, unit: 'Ltr', unitPrice: 8, sellingPrice: 1500 },
          { itemId: soldContainer1.items[1]._id, name: 'Salt', quantity: 50, unit: 'Bags', unitPrice: 4, sellingPrice: 1300 }
        ],
        sellingPrice: 2800,
        sellingDate: new Date('2024-02-20'),
        paymentStatus: 'Full',
        amountReceived: 2800,
        profit: 1800,
        remarks: 'Quick sale, cash payment'
      },
      {
        containerId: soldContainer2._id,
        buyerName: 'Storage Solutions Inc',
        buyerPhone: '+1-555-0456',
        soldBy: employee2._id,
        items: [
          { itemId: soldContainer2.items[0]._id, name: 'Textiles', quantity: 30, unit: 'Box', unitPrice: 25, sellingPrice: 2500 },
          { itemId: soldContainer2.items[1]._id, name: 'Garments', quantity: 500, unit: 'Pcs', unitPrice: 2, sellingPrice: 1500 }
        ],
        sellingPrice: 4000,
        sellingDate: new Date('2024-04-10'),
        paymentStatus: 'Partial',
        amountReceived: 2500,
        profit: 2250,
        remarks: 'Balance due in 30 days'
      }
    ]);
    console.log('Sales created:', sales.length);

    // Create employee activity logs
    await EmployeeActivity.insertMany([
      {
        employeeId: employee1._id,
        actionType: 'ADD_CONTAINER',
        containerId: containers[0]._id,
        timeSpent: 120,
        timestamp: new Date('2024-01-15T10:00:00Z')
      },
      {
        employeeId: employee2._id,
        actionType: 'ADD_CONTAINER',
        containerId: containers[1]._id,
        timeSpent: 95,
        timestamp: new Date('2024-02-10T09:30:00Z')
      },
      {
        employeeId: employee1._id,
        actionType: 'SELL_CONTAINER',
        containerId: soldContainer1._id,
        saleId: sales[0]._id,
        timeSpent: 180,
        timestamp: new Date('2024-02-20T14:00:00Z')
      },
      {
        employeeId: employee2._id,
        actionType: 'SELL_CONTAINER',
        containerId: soldContainer2._id,
        saleId: sales[1]._id,
        timeSpent: 210,
        timestamp: new Date('2024-04-10T11:00:00Z')
      },
      {
        employeeId: employee3._id,
        actionType: 'ADD_CONTAINER',
        containerId: containers[2]._id,
        timeSpent: 150,
        timestamp: new Date('2024-03-05T08:00:00Z')
      },
      {
        employeeId: employee1._id,
        actionType: 'ADD_CONTAINER',
        containerId: containers[3]._id,
        timeSpent: 110,
        timestamp: new Date('2024-03-20T10:30:00Z')
      },
      {
        employeeId: employee2._id,
        actionType: 'ADD_CONTAINER',
        containerId: containers[4]._id,
        timeSpent: 130,
        timestamp: new Date('2024-04-01T09:00:00Z')
      }
    ]);
    console.log('Employee activities created: 7');

    const investments = await ContainerInvestment.insertMany([
      {
        containerId: containers[0]._id,
        investorId: investors[0]._id,
        investmentAmount: 2000,
        profitSharePercent: 60,
        investmentDate: new Date('2024-01-15'),
        status: 'Active'
      },
      {
        containerId: soldContainer1._id,
        investorId: investors[1]._id,
        investmentAmount: 1500,
        profitSharePercent: 70,
        investmentDate: new Date('2024-02-10'),
        status: 'Completed'
      },
      {
        containerId: soldContainer2._id,
        investorId: investors[2]._id,
        investmentAmount: 2000,
        profitSharePercent: 65,
        investmentDate: new Date('2024-04-01'),
        status: 'Completed'
      }
    ]);
    console.log('Investments created:', investments.length);

    investors[0].totalInvested = 2000;
    await investors[0].save();
    investors[1].totalInvested = 1500;
    investors[1].totalReturns = 1920;
    await investors[1].save();
    investors[2].totalInvested = 2000;
    investors[2].totalReturns = 2520;
    await investors[2].save();

    const payouts = await Payout.insertMany([
      {
        investorId: investors[1]._id,
        containerId: soldContainer1._id,
        saleId: sales[0]._id,
        investmentId: investments[1]._id,
        amount: 1920,
        dueDate: new Date('2024-03-01'),
        paidDate: new Date('2024-03-05'),
        status: 'Paid',
        paymentMethod: 'Bank Transfer'
      },
      {
        investorId: investors[2]._id,
        containerId: soldContainer2._id,
        saleId: sales[1]._id,
        investmentId: investments[2]._id,
        amount: 2520,
        dueDate: new Date('2024-04-20'),
        paidDate: new Date('2024-04-25'),
        status: 'Paid',
        paymentMethod: 'Bank Transfer'
      },
      {
        investorId: investors[0]._id,
        containerId: containers[0]._id,
        investmentId: investments[0]._id,
        amount: 2400,
        dueDate: new Date('2024-12-31'),
        status: 'Pending'
      }
    ]);
    console.log('Payouts created:', payouts.length);

    console.log('\nSeed data created successfully!');
    console.log('\n=== Login Credentials ===');
    console.log('\nAdmin Login:');
    console.log('Email: thelmhtrading@gmail.com');
    console.log('Password: 123456789');
    console.log('\nFinance Manager Login:');
    console.log('Email: finance@thelmhtrading.com');
    console.log('Password: finance123');
    console.log('\nEmployee Logins:');
    console.log('1. Email: employee1@thelmhtrading.com | Password: employee123');
    console.log('2. Email: employee2@thelmhtrading.com | Password: employee123');
    console.log('3. Email: employee3@thelmhtrading.com | Password: employee123');
    console.log('\nInvestor Logins:');
    console.log('1. Email: john.investor@example.com | Password: investor123');
    console.log('2. Email: sarah.capital@example.com | Password: investor123');
    console.log('3. Email: mike.ventures@example.com | Password: investor123');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
