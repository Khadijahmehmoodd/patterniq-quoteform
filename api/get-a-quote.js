// Vercel Serverless Function
// File location: /api/get-a-quote.js

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body:", req.body);

    const {
      fname,
      surname,
      email,
      phone,
      options,
      address,
      postcode,
      message,
    } = req.body || {};

    // Validation
    if (
      !fname ||
      !surname ||
      !email ||
      !phone ||
      !options ||
      !address ||
      !postcode ||
      !message
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: fname, surname, email, phone, options, address, postcode, message",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    const fullName = `${fname} ${surname}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PatternIQ <noreply@patterniq.co.uk>",
        to: ["operations@patterniq.co.uk"],
        reply_to: email,
        subject: `New Quote Request - ${fullName}`,
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width:1000px; margin: auto; color:#333;">

            <h2 style="color:#1F4A7C;">New Quote Request</h2>

            <table style="width:100%; border-collapse:collapse;">

              <tr>
                <td style="padding:8px 0;"><strong>First Name</strong></td>
                <td>${escapeHtml(fname)}</td>
              </tr>

              <tr>
                <td style="padding:8px 0;"><strong>Last Name</strong></td>
                <td>${escapeHtml(surname)}</td>
              </tr>

              <tr>
                <td style="padding:8px 0;"><strong>Email</strong></td>
                <td>${escapeHtml(email)}</td>
              </tr>

              <tr>
                <td style="padding:8px 0;"><strong>Phone</strong></td>
                <td>${escapeHtml(phone)}</td>
              </tr>

              <tr>
                <td style="padding:8px 0;"><strong>Interested In</strong></td>
                <td>${escapeHtml(options)}</td>
              </tr>

              <tr>
                <td style="padding:8px 0;"><strong>Address</strong></td>
                <td>${escapeHtml(address)}</td>
              </tr>

              <tr>
                <td style="padding:8px 0;"><strong>Postcode</strong></td>
                <td>${escapeHtml(postcode)}</td>
              </tr>

            </table>

            <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;">

            <h3 style="margin-bottom:10px;">Message</h3>

            <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>

            <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;">

            <div style="text-align:left;">

              <a
                href="https://www.patterniq.co.uk"
                target="_blank"
                style="display:inline-block;vertical-align:middle;text-decoration:none;"
              >
                <img
                  src="https://patterniq-quoteform.vercel.app/patterniq.svg"
                  alt="PatternIQ"
                  width="80"
                  style="display:inline-block;vertical-align:middle;margin-right:12px;border:0;"
                />
              </a>

              <span style="display:inline-block;vertical-align:middle;font-size:12px;color:#777;">
                This quote request was submitted from
                <a
                  href="https://www.patterniq.co.uk"
                  target="_blank"
                  style="color:#777;text-decoration:none;"
                >
                  www.patterniq.co.uk
                </a>
              </span>

            </div>

          </div>
        `,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend Error:", data);

      return res.status(502).json({
        error: "Failed to send email",
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Prevent HTML injection
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}