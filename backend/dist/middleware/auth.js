"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
exports.requireAdmin = (0, clerk_sdk_node_1.ClerkExpressRequireAuth)();
//# sourceMappingURL=auth.js.map