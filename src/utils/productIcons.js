export const productIcons = {
  // Original icon mappings (kebab-case)
  'green-apple': '/icons/products/apple_green.png',
  'red-apple': '/icons/products/apple_red.png',
  'corn': '/icons/products/corn.png',
  'eggplant': '/icons/products/eggplant.png',
  'lemon': '/icons/products/lemon.png',
  'peach': '/icons/products/peach.png',
  'strawberry': '/icons/products/strawberry.png',
  'tangerine': '/icons/products/tangerine.png',
  'tomato': '/icons/products/tomato.png',
  'watermelon': '/icons/products/watermelon.png',
  
  // Subcategory mappings (exact match from categoryData)
  'Green Apple': '/icons/products/apple_green.png',
  'Red Apple': '/icons/products/apple_red.png',
  'Corn': '/icons/products/corn.png',
  'Eggplant': '/icons/products/eggplant.png',
  'Lemon': '/icons/products/lemon.png',
  'Peach': '/icons/products/peach.png',
  'Strawberry': '/icons/products/strawberry.png',
  'Tangerine': '/icons/products/tangerine.png',
  'Tomato': '/icons/products/tomato.png',
  'Watermelon': '/icons/products/watermelon.png',
  
  // Additional subcategories with fallback icons
  'Avocados': '/icons/products/apple_green.png',
  'Mango': '/icons/products/peach.png',
  'Grapes': '/icons/products/strawberry.png',
  'Banana': '/icons/products/tangerine.png',
  'Broccoli': '/icons/products/eggplant.png',
  'Capsicum': '/icons/products/tomato.png',
  'Carrot': '/icons/products/tangerine.png',
  'Onions': '/icons/products/eggplant.png',
  'Potatoes': '/icons/products/corn.png',
  'Salad Greens': '/icons/products/eggplant.png',
  
  // Category fallbacks
  'vegetables': '/icons/products/tomato.png',
  'fruits': '/icons/products/apple_green.png',
  'Fruits': '/icons/products/apple_green.png',
  'Vegetables': '/icons/products/tomato.png',
};

export const getProductIcon = (rawCategory) => {
  if (!rawCategory) {
    return '/icons/products/apple_green.png';
  }

  const category = rawCategory.toString().trim();

  // Try exact match first
  if (productIcons[category]) {
    return productIcons[category];
  }

  // Try normalized (kebab-case) match
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
  
  if (productIcons[normalizedCategory]) {
    return productIcons[normalizedCategory];
  }

  // Fallback to default
  return '/icons/products/apple_green.png';
};

export const productCategories = [
  { id: 1, name: 'Green Apple', key: 'green-apple' },
  { id: 2, name: 'Red Apple', key: 'red-apple' },
  { id: 3, name: 'Corn', key: 'corn' },
  { id: 4, name: 'Eggplant', key: 'eggplant' },
  { id: 5, name: 'Lemon', key: 'lemon' },
  { id: 6, name: 'Peach', key: 'peach' },
  { id: 7, name: 'Strawberry', key: 'strawberry' },
  { id: 8, name: 'Tangerine', key: 'tangerine' },
  { id: 9, name: 'Tomato', key: 'tomato' },
  { id: 10, name: 'Watermelon', key: 'watermelon' },
];