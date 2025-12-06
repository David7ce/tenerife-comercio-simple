import fs from "fs";
import path from "path";

// Change this to your target directory
const dir = "./geojson";

fs.readdirSync(dir).forEach(file => {
  if (path.extname(file).toLowerCase() === ".geojson") {
    const filePath = path.join(dir, file);

    try {
      const data = fs.readFileSync(filePath, "utf8");
      const json = JSON.parse(data); // validate and parse
      const minified = JSON.stringify(json); // no spaces, no formatting

      fs.writeFileSync(filePath, minified);
      console.log(`✅ Minified: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to process ${file}:`, err.message);
    }
  }
});
