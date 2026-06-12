const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

console.log(
  "PAGE_ACCESS_TOKEN loaded:",
  !!PAGE_ACCESS_TOKEN,
  PAGE_ACCESS_TOKEN
    ? PAGE_ACCESS_TOKEN.substring(0, 15) + "..."
    : "NOT FOUND"
);

console.log(
  "VERIFY_TOKEN loaded:",
  !!VERIFY_TOKEN,
  VERIFY_TOKEN
    ? VERIFY_TOKEN.substring(0, 15) + "..."
    : "NOT FOUND"
);

/*
-----------------------------------
Webhook Verification
-----------------------------------
*/

app.get("/webhook", (req, res) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/*
-----------------------------------
Webhook Receiver
-----------------------------------
*/

app.post("/webhook", async (req, res) => {

  try {

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    const body = req.body;

    if (body.object !== "instagram") {
      return res.sendStatus(404);
    }

    for (const entry of body.entry || []) {

      for (const change of entry.changes || []) {

        /*
        COMMENTS
        */

        if (
          change.field === "comments"
        ) {

          const comment =
            change.value.text || "";

          const commentId =
            change.value.id;

          console.log(
            "Comment:",
            comment
          );

          await replyToComment(
            commentId,
            "Thanks for your comment ❤️"
          );
        }
      }

      for (const messaging of entry.messaging || []) {

        /*
        DMs
        */

        const senderId =
          messaging.sender?.id;

        const messageText =
          messaging.message?.text || "";

        if (!senderId) continue;

        let reply =
          "Thanks for messaging us ❤️";

        const text =
          messageText.toLowerCase();

        if (
          text.includes("price")
        ) {
          reply =
            "Please visit our website for latest pricing.";
        }

        if (
          text.includes("order")
        ) {
          reply =
            "Send your order ID and we'll help you.";
        }

        await sendDM(
          senderId,
          reply
        );
      }
    }

    res.sendStatus(200);

  } catch (err) {

    console.error(err);

    res.sendStatus(500);
  }
});

/*
-----------------------------------
Send DM
-----------------------------------
*/

async function sendDM(
  recipientId,
  message
) {

  try {

  console.log(
    "Using token for DM:",
    PAGE_ACCESS_TOKEN
      ? PAGE_ACCESS_TOKEN.substring(0, 15) + "..."
      : "NOT FOUND"
  );

  await axios.post(
      `https://graph.instagram.com/v25.0/me/messages`,
      {
        recipient: {
          id: recipientId
        },
        message: {
          text: message
        }
      },
      {
        params: {
          access_token:
            PAGE_ACCESS_TOKEN
        }
      }
    );

  } catch (err) {

    console.error(
      "DM Error:",
      err.response?.data || err.message
    );
  }
}

/*
-----------------------------------
Reply Comment
-----------------------------------
*/

async function replyToComment(
  commentId,
  message
) {

  try {

  console.log(
    "Using token for comment reply:",
    PAGE_ACCESS_TOKEN
      ? PAGE_ACCESS_TOKEN.substring(0, 15) + "..."
      : "NOT FOUND"
  );

  await axios.post(
      `https://graph.facebook.com/v23.0/${commentId}/replies`,
      {},
      {
        params: {
          message,
          access_token:
            PAGE_ACCESS_TOKEN
        }
      }
    );

  } catch (err) {

    console.error(
      "Comment Error:",
      err.response?.data || err.message
    );
  }
}

app.listen(
  process.env.PORT || 10000,
  () => {
    console.log("Running");
  }
);
