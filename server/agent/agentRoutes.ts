import { Router } from "express";
import { agentService } from "./agentService";
import { storage } from "../storage";
import { insertAgentConversationSchema, insertAgentMessageSchema } from "@shared/schema";
import { requireAuth } from "../middleware/unifiedAuth";
import { getUserId } from "../middleware/jwtAuth";

const router = Router();

// Agent command processing endpoint
router.post("/command", requireAuth, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Command is required and must be a string."
      });
    }

    // Get user info from JWT token ONLY - no session auth
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    // Get user from database to fetch role
    const user = await storage.getUser(userId);
    const userRole = user?.role || 'employee';

    // Process the command
    const result = await agentService.processCommand({
      text: command,
      userId,
      userRole
    });

    res.json(result);

  } catch (error) {
    console.error('Agent route error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing command."
    });
  }
});

// Get available commands for user's role
router.get("/commands", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    // Get user from database to fetch role
    const user = await storage.getUser(userId);
    const userRole = user?.role || 'employee';
    const commands = agentService.getAvailableCommands(userRole);
    
    res.json({
      success: true,
      commands,
      role: userRole
    });

  } catch (error) {
    console.error('Agent commands route error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching available commands."
    });
  }
});

// Agent help endpoint
router.get("/help", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    // Get user from database to fetch role
    const user = await storage.getUser(userId);
    const userRole = user?.role || 'employee';
    const commands = agentService.getAvailableCommands(userRole);
    
    const helpText = {
      role: userRole,
      description: "AI Agent for Expense Management - Execute commands naturally",
      examples: [
        "show my pending claims",
        "approve all claims under 5000", 
        "what's my cashbox balance",
        "process payments",
        "show vendor summary"
      ],
      availableCommands: commands,
      tips: [
        "Use natural language - no special syntax needed",
        "Specify amounts with numbers: 'under 5000' or '₹5000'",
        "For IDs use: 'claim #ABC123' or 'batch #456'",
        "Ask for help anytime with 'help' or 'commands'"
      ]
    };
    
    res.json({
      success: true,
      help: helpText
    });

  } catch (error) {
    console.error('Agent help route error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching help information."
    });
  }
});

// Conversation Management Routes

// Create new conversation
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    const validatedData = insertAgentConversationSchema.parse({
      userId,
      title: req.body.title || "New Conversation"
    });

    const conversation = await storage.createConversation(validatedData);
    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: "Error creating conversation."
    });
  }
});

// Get user's conversations
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    const conversations = await storage.getConversations(userId);
    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversations."
    });
  }
});

// Get conversation with messages
router.get("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    const conversation = await storage.getConversation(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found."
      });
    }

    // Check if conversation belongs to the user
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this conversation."
      });
    }

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversation."
    });
  }
});

// Update conversation
router.put("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    // First check if conversation exists and belongs to user
    const existing = await storage.getConversation(req.params.id);
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found."
      });
    }

    const updates = {
      title: req.body.title,
      isActive: req.body.isActive
    };

    const conversation = await storage.updateConversation(req.params.id, updates);
    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({
      success: false,
      message: "Error updating conversation."
    });
  }
});

// Delete conversation
router.delete("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    // First check if conversation exists and belongs to user
    const existing = await storage.getConversation(req.params.id);
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found."
      });
    }

    await storage.deleteConversation(req.params.id);
    res.json({
      success: true,
      message: "Conversation deleted successfully."
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting conversation."
    });
  }
});

// Process command within conversation context
router.post("/conversations/:id/command", requireAuth, async (req, res) => {
  try {
    const { command } = req.body;
    const conversationId = req.params.id;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Command is required and must be a string."
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "JWT Authentication required."
      });
    }

    // Verify conversation belongs to user
    const conversation = await storage.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found."
      });
    }

    // Save user message
    await storage.createMessage({
      conversationId,
      type: 'user',
      content: command
    });

    // Get user role and process command
    const user = await storage.getUser(userId);
    const userRole = user?.role || 'employee';

    const result = await agentService.processCommand({
      text: command,
      userId,
      userRole
    });

    // Save agent response
    await storage.createMessage({
      conversationId,
      type: 'agent',
      content: result.message,
      success: result.success,
      data: result.data || null,
      actions: result.actions || null
    });

    res.json(result);

  } catch (error) {
    console.error('Conversation command error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing command."
    });
  }
});

export default router;