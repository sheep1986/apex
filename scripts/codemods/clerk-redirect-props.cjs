/**
 * JSCodeshift transform for migrating Clerk deprecated props
 * Migrates deprecated Clerk props to the new API
 */

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Map of deprecated props to new props
  const propMappings = {
    afterSignInUrl: 'fallbackRedirectUrl',
    afterSignUpUrl: 'fallbackRedirectUrl',
    afterSignOutUrl: 'fallbackRedirectUrl',
    redirectUrl: 'fallbackRedirectUrl',
  };

  // Components to check
  const clerkComponents = [
    'SignIn',
    'SignUp',
    'SignOut',
    'UserButton',
    'RedirectToSignIn',
    'RedirectToSignUp',
  ];

  // Find JSX elements with Clerk components
  root
    .find(j.JSXElement)
    .filter(path => {
      const elementName = path.value.openingElement.name;
      if (elementName.type === 'JSXIdentifier') {
        return clerkComponents.includes(elementName.name);
      }
      return false;
    })
    .forEach(path => {
      const attributes = path.value.openingElement.attributes;
      
      attributes.forEach((attr, index) => {
        if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
          const oldPropName = attr.name.name;
          const newPropName = propMappings[oldPropName];
          
          if (newPropName) {
            // Replace the prop name
            attr.name.name = newPropName;
            hasChanges = true;
            
            console.log(
              `📝 ${fileInfo.path}: Replaced ${oldPropName} with ${newPropName}`
            );
          }
        }
      });
    });

  // Handle ClerkProvider navigate prop
  root
    .find(j.JSXElement, {
      openingElement: {
        name: { name: 'ClerkProvider' }
      }
    })
    .forEach(path => {
      const attributes = path.value.openingElement.attributes;
      
      attributes.forEach((attr, index) => {
        if (attr.type === 'JSXAttribute' && attr.name.name === 'navigate') {
          // Replace navigate with routerPush
          attr.name.name = 'routerPush';
          hasChanges = true;
          
          console.log(
            `📝 ${fileInfo.path}: Replaced ClerkProvider navigate with routerPush`
          );
        }
      });
    });

  // Handle useSignIn/useSignUp hook calls
  root
    .find(j.CallExpression, {
      callee: { name: 'signIn' }
    })
    .forEach(path => {
      if (path.value.arguments.length > 0) {
        const firstArg = path.value.arguments[0];
        
        if (firstArg.type === 'ObjectExpression') {
          firstArg.properties.forEach(prop => {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              const oldKey = prop.key.name;
              const newKey = propMappings[oldKey];
              
              if (newKey) {
                prop.key.name = newKey;
                hasChanges = true;
                
                console.log(
                  `📝 ${fileInfo.path}: Replaced signIn({ ${oldKey} }) with signIn({ ${newKey} })`
                );
              }
            }
          });
        }
      }
    });

  // Handle signOut calls
  root
    .find(j.CallExpression, {
      callee: { name: 'signOut' }
    })
    .forEach(path => {
      if (path.value.arguments.length > 0) {
        const firstArg = path.value.arguments[0];
        
        if (firstArg.type === 'ObjectExpression') {
          firstArg.properties.forEach(prop => {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              if (prop.key.name === 'redirectUrl') {
                // Keep redirectUrl for signOut (it's still valid)
                return;
              }
              const oldKey = prop.key.name;
              const newKey = propMappings[oldKey];
              
              if (newKey) {
                prop.key.name = newKey;
                hasChanges = true;
                
                console.log(
                  `📝 ${fileInfo.path}: Replaced signOut({ ${oldKey} }) with signOut({ ${newKey} })`
                );
              }
            }
          });
        }
      }
    });

  return hasChanges ? root.toSource() : null;
};