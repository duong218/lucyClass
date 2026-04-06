const { google } = require("googleapis");
const path = require("path");

/**
 * Service to handle Google Sheets operations
 */
async function appendToSheet(data) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT, 'base64').toString());
    // 1. Setup Auth using credentials.json
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    // 2. Prepare data for the row
    // Order: Time | Parent Name | Phone | Child Name | Child Age | Course | Email | Message | Status
    const row = [
      new Date().toISOString(), // Time
      data.parentName || "",
      data.phone || "",
      data.childName || "",
      data.childAge || "",
      data.course || "", // Course name string
      data.email || "",
      data.message || "",
      "NEW", // Default Status
    ];

    // 3. Append to the sheet
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = `${process.env.GOOGLE_SHEET_NAME || "Sheet1"}!A:I`;

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [row],
      },
    });
    console.log("🚀 appendToSheet CALLED");
    console.log("📄 Sheet Name: LucyClass");
    console.log("📤 Data đã được gửi đi");
    console.log("✅ Google Sheets: Row appended successfully", response.data.updates.updatedRange);
  } catch (error) {
    console.error("❌ Google Sheets Error");
  }
}

module.exports = { appendToSheet };
