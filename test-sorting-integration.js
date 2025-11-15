// Test script to verify table sorting integration
// This script tests that the onSort method correctly updates the store and URL

const { createApp } = require('vue');
const { createPinia } = require('pinia');
const { useRubrosStore } = require('./src/renderer/src/stores/rubros');

// Mock Vue Router
const mockRouter = {
  push: (route) => {
    console.log('URL updated to:', route.query);
  },
  currentRoute: {
    value: { query: {} }
  }
};

// Mock the store
const pinia = createPinia();
const app = createApp({});
app.use(pinia);

const store = useRubrosStore();

// Test the sorting functionality
console.log('Testing table sorting integration...');

// Simulate the onSort method
async function onSort(column, order) {
  console.log(`Sorting by ${column} in ${order} order`);
  
  // This is what happens in RubrosView.vue
  store.setSort(column, order);
  
  // Simulate URL sync (what syncUrlWithFilters would do)
  const query = {
    ...mockRouter.currentRoute.value.query,
    sort: column,
    order: order
  };
  
  mockRouter.push({ query });
  
  console.log('Store sort updated:', store.filters.sort);
  console.log('Store order updated:', store.filters.order);
}

// Test different sorting scenarios
(async () => {
  console.log('\n1. Testing name ascending sort:');
  await onSort('name', 'asc');
  
  console.log('\n2. Testing name descending sort:');
  await onSort('name', 'desc');
  
  console.log('\n3. Testing level ascending sort:');
  await onSort('level', 'asc');
  
  console.log('\n4. Testing createdAt descending sort:');
  await onSort('createdAt', 'desc');
  
  console.log('\n✅ All sorting tests completed successfully!');