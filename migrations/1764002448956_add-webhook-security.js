exports.shorthands = undefined;

exports.up = (pgm) => {
  // Webhook Events Table - Log of all received events
  pgm.createTable("webhook_events", {
    id: {
      type: "uuid",
      default: pgm.func("gen_random_uuid()"),
      primaryKey: true,
    },
    event_id: { type: "text", notNull: true }, // VAPI Event ID
    event_type: { type: "text", notNull: true },
    payload: { type: "jsonb", notNull: true }, // Redacted payload
    processed_at: { type: "timestamptz", default: pgm.func("now()") },
    status: { type: "text", default: "processed" }, // processed, failed, ignored
  });

  // Idempotency Keys Table - For preventing duplicate processing
  pgm.createTable("idempotency_keys", {
    id: {
      type: "uuid",
      default: pgm.func("gen_random_uuid()"),
      primaryKey: true,
    },
    key: { type: "text", notNull: true, unique: true }, // The Idempotency-Key header
    request_hash: { type: "text", notNull: true }, // Hash of method + path + body
    response_body: { type: "jsonb" }, // Cached response
    response_status: { type: "integer" }, // Cached status code
    created_at: { type: "timestamptz", default: pgm.func("now()") },
    expires_at: { type: "timestamptz", notNull: true },
  });

  // Index for fast lookups
  pgm.createIndex("idempotency_keys", "key");
  pgm.createIndex("webhook_events", "event_id");

  // Cleanup Function for expired keys
  pgm.createFunction(
    "cleanup_expired_idempotency_keys",
    [],
    {
      returns: "void",
      language: "plpgsql",
      replace: true,
    },
    `
    BEGIN
      DELETE FROM idempotency_keys WHERE expires_at < NOW();
    END;
    `
  );

  // Optional: Create a cron job if pg_cron is available (commented out for safety)
  // pgm.sql("SELECT cron.schedule('0 * * * *', 'SELECT cleanup_expired_idempotency_keys()')");
};

exports.down = (pgm) => {
  pgm.dropFunction("cleanup_expired_idempotency_keys", []);
  pgm.dropTable("idempotency_keys");
  pgm.dropTable("webhook_events");
};
