export const productIcons = {
  // Original icon mappings (kebab-case)
  'green-apple': '/icons/products/fruits/apple_green.png',
  'red-apple': '/icons/products/fruits/apple_red.png',
  'corn': '/icons/products/fruits/corn.png',
  'eggplant': '/icons/products/fruits/eggplant.png',
  'lemon': '/icons/products/fruits/lemon.png',
  'peach': '/icons/products/fruits/peach.png',
  'strawberry': '/icons/products/fruits/strawberry.png',
  'tangerine': '/icons/products/fruits/tangerine.png',
  'tomato': '/icons/products/fruits/tomato.png',
  'watermelon': '/icons/products/fruits/watermelon.png',
  
  // Subcategory mappings (exact match from categoryData)
  'Green Apple': '/icons/products/fruits/apple_green.png',
  'Red Apple': '/icons/products/fruits/apple_red.png',
  'Corn': '/icons/products/fruits/corn.png',
  'Eggplant': '/icons/products/fruits/eggplant.png',
  'Lemon': '/icons/products/fruits/lemon.png',
  'Peach': '/icons/products/fruits/peach.png',
  'Strawberry': '/icons/products/fruits/strawberry.png',
  'Tangerine': '/icons/products/fruits/tangerine.png',
  'Tomato': '/icons/products/fruits/tomato.png',
  'Watermelon': '/icons/products/fruits/watermelon.png',
  
  // Additional subcategories with fallback icons
  'Avocados': '/icons/products/fruits/apple_green.png',
  'Mango': '/icons/products/fruits/peach.png',
  'Grapes': '/icons/products/fruits/strawberry.png',
  'Banana': '/icons/products/fruits/tangerine.png',
  'Broccoli': '/icons/products/fruits/eggplant.png',
  'Capsicum': '/icons/products/fruits/tomato.png',
  'Carrot': '/icons/products/fruits/tangerine.png',
  'Onions': '/icons/products/fruits/eggplant.png',
  'Potatoes': '/icons/products/fruits/corn.png',
  'Salad Greens': '/icons/products/fruits/eggplant.png',
  
  // Category fallbacks
  'vegetables': '/icons/products/fruits/tomato.png',
  'fruits': '/icons/products/fruits/apple_green.png',
  'Fruits': '/icons/products/fruits/apple_green.png',
  'Vegetables': '/icons/products/fruits/tomato.png',
};

export const getProductIcon = (rawCategory) => {
  if (!rawCategory) {
    return '/icons/products/fruits/apple_green.png';
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
  return '/icons/products/fruits/apple_green.png';
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