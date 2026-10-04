const app = require("./app");
const { port } = require("./config");
require("./db");

app.listen(port, "0.0.0.0", () => {
  console.log(`TaskFlow API démarrée sur http://localhost:${port}`);
});

