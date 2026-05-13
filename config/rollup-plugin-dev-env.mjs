import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

/**
 * Rollup plugin to generate dev-env-loader.js from .env.local
 */
export default function generateDevEnv() {
  return {
    name: "generate-dev-env",
    buildStart() {
      try {
        // Read .env.local
        const envPath = resolve(process.cwd(), ".env.local");
        const envContent = readFileSync(envPath, "utf-8");

        // Parse env variables
        const env = {};
        envContent.split("\n").forEach(line => {
          line = line.trim();
          if (line && !line.startsWith("#")) {
            const [key, ...valueParts] = line.split("=");
            if (key && valueParts.length > 0) {
              env[key.trim()] = valueParts.join("=").trim();
            }
          }
        });

        // Create config object
        const config = {
          scheme: env.SCHEME || "https",
          host: env.HOST || "",
          applicationKey: env.APPLICATION_KEY || "",
          hmacKey: env.HMAC_KEY || ""
        };

        // Read template
        const templatePath = resolve(process.cwd(), "examples/dev-env-loader.js");
        let template = readFileSync(templatePath, "utf-8");

        // Replace placeholder with actual config
        template = template.replace(
          "__ENV_CONFIG__",
          JSON.stringify(config, null, 2)
        );

        // Write generated file
        const outputPath = resolve(process.cwd(), "examples/dev-env-loader.generated.js");
        writeFileSync(outputPath, template);

        console.log("✅ Generated dev-env-loader.generated.js from .env.local");
        console.log("   Host:", config.host);
        console.log("   Scheme:", config.scheme);
        console.log("   Application Key:", config.applicationKey ? config.applicationKey.substring(0, 8) + "..." : "(empty)");
      } catch (error) {
        console.warn("⚠️  Could not generate dev-env-loader.generated.js:", error.message);
        console.warn("   Development environment variables will not be auto-loaded");
      }
    }
  };
}
