const pool = require("./connect");
const express = require("express");
const app = express();
const PORT = 7000

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


app.get("/expenses", (req, res) => {
    pool.query("SELECT * FROM transactions ORDER BY id DESC LIMIT 1", (error, result) => {
      if (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).send("Internal Server Error");
      } else {
        res.json(result[0]);
      }
    });
  });



app.get("/payment.html", (req, res) => {
  res.sendFile(__dirname + "/payment.html");
});

app.post("/payment.html", (req, res) => {
  const amount = req.body.amount;
  const remark1 = req.body.remark1;
  const remark2 = req.body.remark2;
  const paymentMethod = req.body.paymentMethod;

   // Check if 'amount' is a valid number
   if (isNaN(amount)) {
    return res.status(400).send("Amount should be a number");
  }

  pool.getConnection((error, con) => {
    if (error) throw error;

    const sql = "SELECT * FROM transactions ORDER BY id DESC LIMIT 1";

    con.query(sql, (err, result) => {
      if (err) {
        con.release()
        throw err
      }

      let currentAmountInBank = result[0].amount_in_bank;
      let currentCashInHand = result[0].cash_in_hand;
      let currentTotalAmount = result[0].total_amount;


      if (paymentMethod === "online") {
        currentAmountInBank -= amount;
        currentTotalAmount -= amount;
      } else if (paymentMethod === "cash") {
        currentCashInHand -= amount;
        currentTotalAmount -= amount;
      }

      // Updated values-----
      const insertSql = `
        INSERT INTO transactions (amount_in_bank, cash_in_hand, total_amount, remark_one, remark_two, payment_method)
        VALUES (${currentAmountInBank}, ${currentCashInHand}, ${currentTotalAmount}, "${remark1}", "${remark2}", "${paymentMethod}");
      `;

      con.query(insertSql, (err, result) => {
        if (err) {
          con.release()
          throw err
        }

        con.release();

        // res.send("Expense added successfully");

        res.redirect(`/?amount=${amount}`);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});