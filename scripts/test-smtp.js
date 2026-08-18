require("dotenv").config({ path: ".env.local" });

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function testSMTP() {
  console.log("=================================");
  console.log("GMAIL SMTP CONNECTION TEST");
  console.log("=================================");

  console.log("SMTP Host:", process.env.SMTP_HOST);
  console.log("SMTP Port:", process.env.SMTP_PORT);
  console.log("SMTP User:", process.env.SMTP_USER);
  console.log("SMTP Password: [HIDDEN]");

  try {
    console.log("\nTesting SMTP connection...");

    await transporter.verify();

    console.log("✅ SMTP CONNECTION SUCCESSFUL!");

    console.log("\nSending test email...");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER,
      subject: "Online Store - SMTP Test",
      text: "Congratulations! Your Gmail SMTP configuration is working correctly.",
      html: `
        <h2>Online Store SMTP Test</h2>
        <p>Congratulations!</p>
        <p>Your Gmail SMTP configuration is working correctly.</p>
      `,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY!");
    console.log("Message ID:", info.messageId);

  } catch (error) {
    console.error("\n❌ SMTP TEST FAILED");
    console.error("Error Code:", error.code);
    console.error("Error Command:", error.command);
    console.error("Error Message:", error.message);
  }
}

testSMTP();