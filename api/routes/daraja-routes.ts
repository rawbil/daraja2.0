import express, { Router } from "express";
import {  PaybillCallbackFunc, PaybillPrompt } from "../controllers/daraja-gateway";
import { GenerateDarajaAuthorization } from "../middleware/daraja-authorization";
import { NgrokDomain } from "../middleware/ngrok-domain";
const route: Router = express.Router();

// POST /daraja/b2c
route.post("/b2c", GenerateDarajaAuthorization, NgrokDomain, PaybillPrompt);
// POST /daraja/callback
route.post("/callback", PaybillCallbackFunc);

export default route;
