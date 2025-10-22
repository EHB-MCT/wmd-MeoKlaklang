const express = require("express");
const cors = require("cors");
const entriesRouter = require("./routes/entries");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/entries", entriesRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
