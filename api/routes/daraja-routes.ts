import express, { Router } from "express";
import {  PaybillCallbackFunc, PaybillPrompt, QueryTransactionStatus } from "../controllers/daraja-gateway";
import { GenerateDarajaAuthorization } from "../middleware/daraja-authorization";
import { NgrokDomain } from "../middleware/ngrok-domain";
const route: Router = express.Router();

// POST /daraja/b2c
route.post("/b2c", GenerateDarajaAuthorization, NgrokDomain, PaybillPrompt);
route.post("/query-status", GenerateDarajaAuthorization, QueryTransactionStatus)
// POST /daraja/callback
route.post("/callback", PaybillCallbackFunc);

export default route;
