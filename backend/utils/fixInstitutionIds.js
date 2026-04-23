require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");

const fixInstitutionIds = async () => {
  await connectDB();

  const institutions = await User.find({ role: "institution" });
  const operations = institutions
    .filter((institution) => !institution.institutionId || !institution.institutionId.equals(institution._id))
    .map((institution) => ({
      updateOne: {
        filter: { _id: institution._id },
        update: { $set: { institutionId: institution._id } }
      }
    }));

  if (operations.length > 0) {
    await User.bulkWrite(operations);
  }

  console.log(`Fixed ${operations.length} institution user(s).`);
  process.exit(0);
};

fixInstitutionIds().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
