import axios from "axios";
import { NextFunction, Request, Response } from "express";
const BusinessShortCode = process.env.BUSINESS_SHORT_CODE as string;
const PassKey = process.env.PASSKEY as string;

// {
//   "BusinessShortCode": 174379,
//   "Password": "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMjEwNjI4MDkyNDA4", base64(Short_code + passkey + timestamp)
//   "Timestamp": "20210628092408",
//   "TransactionType": "CustomerPayBillOnline",
//   "Amount": "1",
//   "PartyA": "254722000000",
//   "PartyB": "174379",
//   "PhoneNumber": "254722111111",
//   "CallBackURL": "https://mydomain.com/path",
//   "AccountReference": "accountref",
//   "TransactionDesc": "txndesc"
// }

interface ReqBody {
  amount: number;
  phone_number: string;
}

interface PromptRespose {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function PaybillPrompt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const dtoken = req.dtoken;
    const domain = req.domain;
    if (!dtoken || dtoken == "") {
      return res
        .status(401)
        .json({ success: false, message: "auth token missing" });
    }

    if (!domain || domain == "") {
      return res
        .status(401)
        .json({ success: false, message: "ngrok domain missing" });
    }

    const { amount, phone_number } = req.body as ReqBody;
    if (!amount || !phone_number) {
      return res.status(400).json({
        success: false,
        message: "please provide both amount and phone number",
      });
    }

    if (amount < 1) {
      return res
        .status(400)
        .json({ success: false, message: "amount should be greater than 0" });
    }

    // check number length
    if (phone_number.length != 10) {
      return res.status(300).json({
        success: false,
        message: "phone number should be 10 digits long",
      });
    }

    // replace 0 with 254
    const clean_number = phone_number.replace(/^0/, "254");

    if (BusinessShortCode == "") {
      return res
        .status(400)
        .json({ success: false, message: "Business Short Code missing" });
    }
    if (PassKey == "") {
      return res
        .status(400)
        .json({ success: false, message: "Passkey missing" });
    }

    let { timestamp, password } = GeneratePassword();
    if (timestamp == "") {
      return res
        .status(400)
        .json({ success: false, message: "timestamp empty" });
    }

    // body
    let request_body = {
      BusinessShortCode: BusinessShortCode,
      Timestamp: timestamp,
      Password: password,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount.toString(),
      PartyA: clean_number,
      PartyB: BusinessShortCode,
      PhoneNumber: clean_number,
      AccountReference: "FORMETMENOT COLLECTIVE",
      TransactionDesc: "prompt sent successfully",
      CallBackURL: `${domain}/api/v1/daraja/callback`,
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      request_body,
      {
        headers: {
          Authorization: `Bearer ${dtoken}`,
        },
      },
    );

    const response_data = response.data as PromptRespose;
    res.status(200).json({ success: true, data: response_data });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Transaction status endpoint
export async function QueryTransactionStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    //     {
    //    "BusinessShortCode":"174379",
    //    "Password": "MTc0Mzc5YmZiMjc5TliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMTYwMjE2MTY1NjI3",
    //    "Timestamp":"20160216165627",
    //    "CheckoutRequestID": "ws_CO_260520211133524545",
    // }
    const dtoken = req.dtoken;
    if (!dtoken) {
      return res
        .status(401)
        .json({ success: false, message: "Auth token missing" });
    }

    const { CheckoutRequestID } = req.body;
    if (!CheckoutRequestID) {
      return res
        .status(400)
        .json({ success: false, message: "Checkout Request ID missing" });
    }

    const { timestamp, password } = GeneratePassword();
    if (!timestamp || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Timestamp or password missing" });
    }

    const query_body = {
      BusinessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID,
    };

    const query_response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      query_body,
      {
        headers: {
          Authorization: `Bearer ${dtoken}`,
        },
      },
    );

    console.log(query_response.data);

    /**
     * ResultCode: "1032" - cancelled , "0" - success, 4999 - pending, 1037- no response
     */
    const resultCode = query_response.data.ResultCode;
    if (resultCode === "0") {
      return res.status(200).json({
        success: true,
        message: query_response.data.ResultDesc,
        status: "completed",
      });
    } else if (resultCode === "4999") {
      return res.status(500).json({
        success: false,
        message: query_response.data.ResultDesc,
        status: "pending",
      });
    } else if (resultCode === "1032") {
      return res.status(500).json({
        success: false,
        message: query_response.data.ResultDesc,
        status: "cancelled",
      });
    } else if (resultCode === "1037") {
      return res.status(500).json({
        success: false,
        message: query_response.data.ResultDesc,
        status: "no_response",
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.response.data });
  }
}

// Callback
export async function PaybillCallbackFunc(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body;


  console.log("CallbackMetaData: ", req.body.Body.stkCallback.CallbackMetadata);
  //? Store info in database
  // convert date to a more readable format(database format)
  /*{
  Item: [
    { Name: 'Amount', Value: 1 },
    { Name: 'MpesaReceiptNumber', Value: 'UH3PM1V0Q0' },
    { Name: 'Balance' },
    { Name: 'TransactionDate', Value: 20260803164322 },
    { Name: 'PhoneNumber', Value: 254703981030 }
  ]
} */
  res
    .status(200)
    .json({ success: true, message: "Transaction details captured" });
}

// Generate Timestamp
const GenerateTimestamp = () => {
  const localeDate = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Nairobi",
  });

  let date = new Date(localeDate);
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  let hour = String(date.getHours()).padStart(2, "0");
  let minutes = String(date.getMinutes()).padStart(2, "0");
  let seconds = String(date.getSeconds()).padStart(2, "0");

  const timestamp = `${year}${month}${day}${hour}${minutes}${seconds}`;

  return timestamp;
};

const GeneratePassword = () => {
  const timestamp = GenerateTimestamp();

  const password = Buffer.from(
    BusinessShortCode + PassKey + timestamp,
  ).toString("base64");

  return { timestamp, password };
};
