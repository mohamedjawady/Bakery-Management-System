#!/usr/bin/env node

/**
 * Test script to validate delivery user assignments
 * This script checks if orders are assigned to valid delivery users
 */

const fetch = require('node-fetch');

const ORDERS_API = '/orders';
const USERS_API = 'http://localhost:3000/api/users';

async function testDeliveryValidation() {
  console.log('🚀 Starting Delivery Assignment Validation Test\n');

  try {
    // Fetch orders
    console.log('📦 Fetching orders from backend...');
    const ordersResponse = await fetch(ORDERS_API);
    
    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }
    
    const orders = await ordersResponse.json();
    console.log(`✅ Found ${orders.length} orders\n`);

    // Fetch users
    console.log('👥 Fetching users from API...');
    const usersResponse = await fetch(USERS_API);
    
    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status}`);
    }
    
    const users = await usersResponse.json();
    const deliveryUsers = users.filter(user => user.role === 'delivery' && user.isActive);
    console.log(`✅ Found ${deliveryUsers.length} active delivery users\n`);

    // Validate assignments
    console.log('🔍 Validating delivery assignments...\n');
    
    let validAssignments = 0;
    let invalidAssignments = 0;
    let issues = [];

    for (const order of orders) {
      if (order.deliveryUserId) {
        const assignedUser = deliveryUsers.find(user => user._id === order.deliveryUserId);
        
        if (!assignedUser) {
          issues.push({
            orderId: order.orderId || order._id,
            issue: 'INVALID_USER',
            message: `Order assigned to non-existent user ID: ${order.deliveryUserId}`
          });
          invalidAssignments++;
        } else if (!assignedUser.isActive) {
          issues.push({
            orderId: order.orderId || order._id,
            issue: 'INACTIVE_USER',
            message: `Order assigned to inactive user: ${assignedUser.firstName} ${assignedUser.lastName}`
          });
          invalidAssignments++;
        } else {
          // Check if the name matches
          const expectedName = `${assignedUser.firstName} ${assignedUser.lastName}`;
          if (order.deliveryUserName && order.deliveryUserName !== expectedName) {
            issues.push({
              orderId: order.orderId || order._id,
              issue: 'NAME_MISMATCH',
              message: `Order shows "${order.deliveryUserName}" but user is "${expectedName}"`
            });
          }
          validAssignments++;
        }
      }
    }

    // Print results
    console.log('📊 VALIDATION RESULTS:');
    console.log('='.repeat(50));
    console.log(`✅ Valid assignments: ${validAssignments}`);
    console.log(`❌ Invalid assignments: ${invalidAssignments}`);
    console.log(`📋 Total orders checked: ${orders.length}`);
    console.log(`👥 Active delivery users: ${deliveryUsers.length}\n`);

    if (issues.length > 0) {
      console.log('🚨 ISSUES FOUND:');
      console.log('-'.repeat(50));
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.issue} - Order ${issue.orderId}`);
        console.log(`   ${issue.message}\n`);
      });
    } else {
      console.log('🎉 No issues found! All delivery assignments are valid.\n');
    }

    // Print delivery users summary
    console.log('👥 DELIVERY USERS SUMMARY:');
    console.log('-'.repeat(50));
    deliveryUsers.forEach(user => {
      const assignedOrders = orders.filter(order => order.deliveryUserId === user._id);
      console.log(`• ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Assigned orders: ${assignedOrders.length}`);
      console.log(`  Active: ${user.isActive ? '✅' : '❌'}\n`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testDeliveryValidation();
