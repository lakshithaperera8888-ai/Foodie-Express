const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'frontend/src/screens/CartScreen.js',
    from: '>${(new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50).toFixed(2)}</Text>',
    to: '>Rs. {(new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/CheckoutScreen.js',
    from: '>${(new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50).toFixed(2)}</Text>',
    to: '>Rs. {(new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/DeliveryDashboard.js',
    from: '>${(stats.pendingEarnings || 0).toFixed(2)}</Text>',
    to: '>Rs. {(stats.pendingEarnings || 0).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/DeliveryDashboard.js',
    from: '>${(20 - stats.totalEarnings).toFixed(2)}</Text>',
    to: '>Rs. {(20 - stats.totalEarnings).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/ExploreScreen.js',
    from: '>${item.price}</Text>',
    to: '>Rs. {item.price}</Text>'
  },
  {
    file: 'frontend/src/screens/ExploreScreen.js',
    from: '>${cartTotal.toFixed(2)}</Text>',
    to: '>Rs. {cartTotal.toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/MenuItemDetailScreen.js',
    from: '>${currentItem.price}</Text>',
    to: '>Rs. {currentItem.price}</Text>'
  },
  {
    file: 'frontend/src/screens/MenuItemDetailScreen.js',
    from: '>${rec.price}</Text>',
    to: '>Rs. {rec.price}</Text>'
  },
  {
    file: 'frontend/src/screens/MenuItemDetailScreen.js',
    from: '>${(currentItem.price * quantity).toFixed(2)}</Text>',
    to: '>Rs. {(currentItem.price * quantity).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/OrdersHistoryScreen.js',
    from: '>${item.totalAmount.toFixed(2)}</Text>',
    to: '>Rs. {item.totalAmount.toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/OwnerDashboard.js',
    from: '<div class="item-price">$${item.price}</div>',
    to: '<div class="item-price">Rs. ${item.price}</div>'
  },
  {
    file: 'frontend/src/screens/OwnerDashboard.js',
    from: '>${item.totalAmount.toFixed(2)}</Text>',
    to: '>Rs. {item.totalAmount.toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/OwnerDashboard.js',
    from: '>${(stats?.totalEarnings || 0).toFixed(2)}</Text>',
    to: '>Rs. {(stats?.totalEarnings || 0).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/OwnerDashboard.js',
    from: '>${(stats?.lifetimeEarnings || 0).toFixed(2)}</Text>',
    to: '>Rs. {(stats?.lifetimeEarnings || 0).toFixed(2)}</Text>'
  },
  {
    file: 'frontend/src/screens/OwnerDashboard.js',
    from: 'Price ($)',
    to: 'Price (Rs.)'
  }
];

let changedCount = 0;

replacements.forEach(r => {
  const filePath = path.resolve(__dirname, r.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(r.from)) {
      // Split and join replaces all occurrences exactly
      content = content.split(r.from).join(r.to);
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + r.file);
      changedCount++;
    }
  } else {
    console.log('File not found: ' + r.file);
  }
});

console.log('Total specific changes made: ' + changedCount);
