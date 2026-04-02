export type ContentGenerationRequest = {
  taskDescription: string;
  assignedAgent: string;
  prompt: string;
};

export type ContentGenerationResponse = {
  content: string;
};

export type ContentLLMProvider = {
  generateContent: (
    request: ContentGenerationRequest,
  ) => Promise<ContentGenerationResponse>;
};
