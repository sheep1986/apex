/**
 * Custom ESLint rules for enforcing safe array operations
 * Add this to your main .eslintrc.js extends array
 */

module.exports = {
  rules: {
    // Warn when using .filter() on potentially unsafe values
    'no-restricted-syntax': [
      'warn',
      {
        selector: "MemberExpression[property.name='filter'][object.type='Identifier']:not([object.name=/Array$/]):not([object.name=/array$/]):not([object.name=/items$/]):not([object.name=/list$/])",
        message: 'Use safeFilter() for potentially non-array values. If you know this is an array, consider renaming the variable to end with Array/items/list.'
      },
      {
        selector: "MemberExpression[property.name='reduce'][object.type='Identifier']:not([object.name=/Array$/]):not([object.name=/array$/]):not([object.name=/items$/]):not([object.name=/list$/])",
        message: 'Use safeReduce() for potentially non-array values. If you know this is an array, consider renaming the variable to end with Array/items/list.'
      },
      {
        selector: "MemberExpression[property.name='map'][object.type='MemberExpression'][object.property.name='data']",
        message: 'API responses may not always be arrays. Consider using asArray(response.data).map() or validate the shape first.'
      }
    ],

    // Custom rule to enforce array validation on API responses
    'no-restricted-properties': [
      'warn',
      {
        object: 'response',
        property: 'data',
        message: 'response.data might not be an array. Use Array.isArray(response.data) check or asArray(response.data)'
      }
    ]
  },

  overrides: [
    {
      // Stricter rules for API service files
      files: ['**/services/**/*.ts', '**/api/**/*.ts'],
      rules: {
        'no-restricted-syntax': [
          'error', // Error level for service files
          {
            selector: "MemberExpression[property.name='filter'][object.property.name='data']",
            message: 'API data must be validated before array operations. Use asArray() or explicit Array.isArray() check.'
          },
          {
            selector: "MemberExpression[property.name='reduce'][object.property.name='data']",
            message: 'API data must be validated before array operations. Use safeReduce() or explicit Array.isArray() check.'
          },
          {
            selector: "MemberExpression[property.name='map'][object.property.name='data']",
            message: 'API data must be validated before array operations. Use asArray() or explicit Array.isArray() check.'
          }
        ]
      }
    },
    {
      // Relaxed rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
      rules: {
        'no-restricted-syntax': 'off',
        'no-restricted-properties': 'off'
      }
    }
  ]
};