import express from "express";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to run agent-email commands
  const runAgentEmail = async (command: string) => {
    try {
      // Use npx to ensure we use the local installation
      const { stdout, stderr } = await execAsync(`npx agent-email ${command}`);
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      try {
        return JSON.parse(stdout);
      } catch (e) {
        return { raw: stdout };
      }
    } catch (error: any) {
      console.error(`Error running agent-email ${command}:`, error);
      throw error;
    }
  };

  // API Routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const result = await runAgentEmail("accounts list");
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts/create", async (req, res) => {
    try {
      const result = await runAgentEmail("create");
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts/use", async (req, res) => {
    const { email } = req.body;
    try {
      const result = await runAgentEmail(`use ${email}`);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/:email", async (req, res) => {
    const { email } = req.params;
    const { full } = req.query;
    try {
      const command = `read ${email}${full === 'true' ? ' --full' : ''}`;
      const result = await runAgentEmail(command);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/:email/:id", async (req, res) => {
    const { email, id } = req.params;
    try {
      const result = await runAgentEmail(`show ${email} ${id}`);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/messages/:email/:id", async (req, res) => {
    const { email, id } = req.params;
    try {
      const result = await runAgentEmail(`delete ${email} ${id}`);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
