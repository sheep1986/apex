exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create organizations table if it doesn't exist
  pgm.createTable('organizations', {
    id: { type: 'uuid', default: pgm.func('gen_random_uuid()'), primaryKey: true },
    name: { type: 'text', notNull: true },
    slug: { type: 'text', unique: true },
    vapi_api_key: { type: 'text' }, // Will store the API key for VAPI
    owner_id: { type: 'uuid' }, // Reference to the user who owns this org
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', default: pgm.func('now()') },
    subscription_status: { type: 'text', default: 'trial' }, // trial, active, past_due
    settings: { type: 'jsonb', default: '{}' }
  }, {
    ifNotExists: true
  });

  // Link users to organizations (if not already handled by Supabase Auth metadata)
  // We'll add an organization_id to the existing 'users' table if it's managed by us
  // Note: Previous audits showed 'users' table usage.
  
  pgm.createIndex('organizations', 'owner_id');
  pgm.createIndex('organizations', 'slug');
};

exports.down = (pgm) => {
  // We generally don't want to drop the orgs table in a rollback unless absolutely necessary
  // pgm.dropTable('organizations');
};
