"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var clerk_auth_1 = require("../middleware/clerk-auth");
var vapi_integration_service_1 = require("../services/vapi-integration-service");
var supabase_js_1 = require("@supabase/supabase-js");
// Create supabase client directly if module not found
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
var router = (0, express_1.Router)();
// Apply authentication
router.use(clerk_auth_1.authenticateUser);
// GET /api/vapi-data/assistants - Get VAPI assistants for the user's organization
router.get('/assistants', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var organizationId, vapiService, assistants, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
                if (!organizationId) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'User not associated with an organization',
                            assistants: []
                        })];
                }
                console.log('🔍 Fetching VAPI assistants for organization:', organizationId);
                return [4 /*yield*/, vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId)];
            case 1:
                vapiService = _b.sent();
                if (!vapiService) {
                    console.log('⚠️ No VAPI service available for organization');
                    return [2 /*return*/, res.json({
                            assistants: [],
                            message: 'VAPI integration not configured. Please add your VAPI API key in Organization Settings.',
                            requiresConfiguration: true
                        })];
                }
                return [4 /*yield*/, vapiService.listAssistants()];
            case 2:
                assistants = _b.sent();
                console.log("\u2705 Retrieved ".concat(assistants.length, " assistants from VAPI"));
                res.json({
                    assistants: assistants,
                    count: assistants.length
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('❌ Error fetching VAPI assistants:', error_1);
                res.status(500).json({
                    error: 'Failed to fetch assistants',
                    assistants: []
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// GET /api/vapi-data/phone-numbers - Get VAPI phone numbers for the user's organization
router.get('/phone-numbers', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var organizationId, phoneNumbers, _a, dbPhoneNumbers, error, vapiService, error_2, vapiService, error_3;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 12, , 13]);
                organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
                if (!organizationId) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'User not associated with an organization',
                            phoneNumbers: []
                        })];
                }
                console.log('📱 Fetching phone numbers for organization:', organizationId);
                phoneNumbers = [];
                _c.label = 1;
            case 1:
                _c.trys.push([1, 7, , 11]);
                return [4 /*yield*/, supabase
                        .from('phone_numbers')
                        .select('*')
                        .eq('organization_id', organizationId)];
            case 2:
                _a = _c.sent(), dbPhoneNumbers = _a.data, error = _a.error;
                if (!(!error && dbPhoneNumbers && dbPhoneNumbers.length > 0)) return [3 /*break*/, 3];
                console.log("\u2705 Found ".concat(dbPhoneNumbers.length, " phone numbers in database"));
                // Transform to match VAPI format
                phoneNumbers = dbPhoneNumbers.map(function (phone) { return ({
                    id: phone.id,
                    number: phone.number,
                    provider: phone.provider || 'vapi',
                    country: phone.country_code || 'US',
                    name: phone.number,
                    status: phone.status
                }); });
                return [3 /*break*/, 6];
            case 3:
                console.log('📡 No phone numbers in database, trying VAPI API...');
                return [4 /*yield*/, vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId)];
            case 4:
                vapiService = _c.sent();
                if (!vapiService) {
                    console.log('⚠️ No VAPI service available for organization');
                    return [2 /*return*/, res.json({
                            phoneNumbers: [],
                            message: 'VAPI integration not configured. Please add your VAPI API key in Organization Settings.',
                            requiresConfiguration: true
                        })];
                }
                return [4 /*yield*/, vapiService.getPhoneNumbers()];
            case 5:
                // Fetch phone numbers from VAPI
                phoneNumbers = _c.sent();
                _c.label = 6;
            case 6: return [3 /*break*/, 11];
            case 7:
                error_2 = _c.sent();
                console.error('Error fetching from database, trying VAPI:', error_2);
                return [4 /*yield*/, vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId)];
            case 8:
                vapiService = _c.sent();
                if (!vapiService) return [3 /*break*/, 10];
                return [4 /*yield*/, vapiService.getPhoneNumbers()];
            case 9:
                phoneNumbers = _c.sent();
                _c.label = 10;
            case 10: return [3 /*break*/, 11];
            case 11:
                console.log("\u2705 Retrieved ".concat(phoneNumbers.length, " phone numbers from VAPI"));
                res.json({
                    phoneNumbers: phoneNumbers,
                    count: phoneNumbers.length
                });
                return [3 /*break*/, 13];
            case 12:
                error_3 = _c.sent();
                console.error('❌ Error fetching VAPI phone numbers:', error_3);
                res.status(500).json({
                    error: 'Failed to fetch phone numbers',
                    phoneNumbers: []
                });
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); });
// GET /api/vapi-data/all - Get all VAPI data (assistants and phone numbers)
router.get('/all', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var organizationId, vapiService, _a, assistants, phoneNumbers, error_4;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
                if (!organizationId) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'User not associated with an organization',
                            assistants: [],
                            phoneNumbers: []
                        })];
                }
                console.log('🔄 Fetching all VAPI data for organization:', organizationId);
                return [4 /*yield*/, vapi_integration_service_1.VAPIIntegrationService.forOrganization(organizationId)];
            case 1:
                vapiService = _c.sent();
                if (!vapiService) {
                    console.log('⚠️ No VAPI service available for organization');
                    return [2 /*return*/, res.json({
                            assistants: [],
                            phoneNumbers: [],
                            message: 'VAPI integration not configured'
                        })];
                }
                return [4 /*yield*/, Promise.all([
                        vapiService.listAssistants().catch(function () { return []; }),
                        vapiService.getPhoneNumbers().catch(function () { return []; })
                    ])];
            case 2:
                _a = _c.sent(), assistants = _a[0], phoneNumbers = _a[1];
                console.log("\u2705 Retrieved ".concat(assistants.length, " assistants and ").concat(phoneNumbers.length, " phone numbers from VAPI"));
                res.json({
                    assistants: assistants,
                    phoneNumbers: phoneNumbers,
                    assistantCount: assistants.length,
                    phoneNumberCount: phoneNumbers.length
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _c.sent();
                console.error('❌ Error fetching VAPI data:', error_4);
                res.status(500).json({
                    error: 'Failed to fetch VAPI data',
                    assistants: [],
                    phoneNumbers: []
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
