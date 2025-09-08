"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;

const supabase_js_1 = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);

exports.default = exports.supabase;