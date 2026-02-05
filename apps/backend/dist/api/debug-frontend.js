"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend is reachable from frontend',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        userAgent: req.get('User-Agent')
    });
});
router.get('/vapi-test', async (req, res) => {
    try {
        const testCorpOrgId = '0f88ab8a-b760-4c2a-b289-79b54d7201cf';
        const { VAPIIntegrationService } = await Promise.resolve().then(() => __importStar(require('../services/vapi-integration-service')));
        const vapiService = await VAPIIntegrationService.forOrganization(testCorpOrgId);
        if (!vapiService) {
            return res.json({
                success: false,
                message: 'No VAPI service available for Test Corp',
                organizationId: testCorpOrgId
            });
        }
        const [assistants, phoneNumbers] = await Promise.all([
            vapiService.getAssistants().catch(err => ({ error: err.message })),
            vapiService.getPhoneNumbers().catch(err => ({ error: err.message }))
        ]);
        res.json({
            success: true,
            message: 'VAPI test completed',
            organizationId: testCorpOrgId,
            data: {
                assistants: Array.isArray(assistants) ? assistants : assistants,
                phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : phoneNumbers,
                assistantCount: Array.isArray(assistants) ? assistants.length : 0,
                phoneNumberCount: Array.isArray(phoneNumbers) ? phoneNumbers.length : 0
            }
        });
    }
    catch (error) {
        console.error('Debug VAPI test error:', error);
        res.json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});
exports.default = router;
