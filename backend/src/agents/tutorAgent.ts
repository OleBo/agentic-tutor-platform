import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { 
  ProblemGenerator, 
  KnowledgeAssessor,
  ExplanationProvider 
} from "../tools";

export class TutorAgent {
  private executor: AgentExecutor;
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      model: "gpt-4",
      temperature: 0.3,
    });

    this.initializeAgent();
  }

  private async initializeAgent() {
    const tools = [
      new DynamicStructuredTool({
        name: "assess_knowledge_gap",
        description: "Assess student's understanding of a specific topic and identify knowledge gaps",
        schema: z.object({
          topic: z.string(),
          studentResponse: z.string(),
          learningObjective: z.string()
        }),
        func: async ({ topic, studentResponse, learningObjective }) => {
          return await KnowledgeAssessor.assessGap(topic, studentResponse, learningObjective);
        }
      }),

      new DynamicStructuredTool({
        name: "generate_practice_problems",
        description: "Generate personalized practice problems based on student's needs",
        schema: z.object({
          topic: z.string(),
          difficulty: z.enum(["beginner", "intermediate", "advanced"]),
          problemType: z.string(),
          count: z.number().min(1).max(10)
        }),
        func: async ({ topic, difficulty, problemType, count }) => {
          return await ProblemGenerator.generateProblems(topic, difficulty, problemType, count);
        }
      }),

      new DynamicStructuredTool({
        name: "provide_alternative_explanation",
        description: "Provide different types of explanations (visual, analogy, step-by-step)",
        schema: z.object({
          concept: z.string(),
          explanationType: z.enum(["visual", "analogy", "step-by-step", "real-world"]),
          previousAttempts: z.array(z.string())
        }),
        func: async ({ concept, explanationType, previousAttempts }) => {
          return await ExplanationProvider.getExplanation(concept, explanationType, previousAttempts);
        }
      }),

      new DynamicStructuredTool({
        name: "update_learning_path",
        description: "Update the student's learning path based on current progress",
        schema: z.object({
          studentId: z.string(),
          topic: z.string(),
          masteryLevel: z.number().min(0).max(1),
          recommendedNextSteps: z.array(z.string())
        }),
        func: async ({ studentId, topic, masteryLevel, recommendedNextSteps }) => {
          // Update student progress in database
          return await this.updateProgress(studentId, topic, masteryLevel, recommendedNextSteps);
        }
      })
    ];

    const agent = createToolCallingAgent({
      llm: this.model,
      tools,
      prompt: `
        You are an expert tutor with agentic capabilities. Your goal is to actively help students learn, not just answer questions.

        CORE PRINCIPLES:
        1. Diagnose knowledge gaps proactively
        2. Adapt teaching strategy based on student responses
        3. Generate personalized practice when needed
        4. Use multiple explanation modalities
        5. Track progress and adjust learning path

        When a student asks a question or struggles with a concept:
        - First, assess their current understanding
        - Identify any knowledge gaps
        - Choose the most effective explanation method
        - Generate targeted practice if needed
        - Update their learning path accordingly

        Always be supportive, patient, and focused on helping them achieve mastery.
      `
    });

    this.executor = new AgentExecutor({
      agent,
      tools,
      verbose: true
    });
  }

  async processQuery(sessionId: string, query: string, history: any[]) {
    const context = this.buildContext(history);
    
    const result = await this.executor.invoke({
      input: query,
      sessionId,
      context,
      timestamp: new Date().toISOString()
    });

    return {
      response: result.output,
      agentActions: this.extractAgentActions(result),
      updatedLearningPath: this.extractLearningPath(result)
    };
  }

  private buildContext(history: any[]) {
    // Analyze conversation history to build context
    return {
      recentInteractions: history.slice(-5),
      identifiedGaps: this.identifyPatterns(history),
      preferredLearningStyle: this.detectLearningStyle(history)
    };
  }

  private extractAgentActions(result: any) {
    // Parse intermediate steps to show user what the agent did
    return result.intermediateSteps?.map((step: any) => ({
      type: step.action.tool,
      input: step.action.toolInput,
      output: step.observation,
      timestamp: new Date()
    })) || [];
  }

  private identifyPatterns(history: any[]) {
    // Analyze history to identify recurring difficulties
    // This would use NLP to find patterns in student errors
    return [];
  }

  private detectLearningStyle(history: any[]) {
    // Analyze which explanation types were most effective
    return "mixed";
  }

  private async updateProgress(studentId: string, topic: string, masteryLevel: number, nextSteps: string[]) {
    // Database integration would go here
    console.log(`Updating progress for ${studentId} on ${topic}: ${masteryLevel}`);
    return { success: true };
  }
}
