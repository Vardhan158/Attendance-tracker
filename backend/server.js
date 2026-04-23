const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SkillBridge API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start SkillBridge API:", error.message);
    process.exit(1);
  });
