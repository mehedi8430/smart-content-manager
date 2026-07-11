"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AiOutput } from "@/types/ai-output.type";

interface GeneratorState {
  isGenerating: boolean;
  streamedContent: string;
  error: string | null;
  savedOutputs: string[];
  completedOutput: AiOutput | null;
}

interface AiGeneratorContextType {
  state: GeneratorState;
  startGeneration: () => void;
  appendChunk: (chunk: string) => void;
  completeGeneration: (output: AiOutput) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const AiGeneratorContext = createContext<AiGeneratorContextType | undefined>(
  undefined,
);

export function AiGeneratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeneratorState>({
    isGenerating: false,
    streamedContent: "",
    error: null,
    savedOutputs: [],
    completedOutput: null,
  });

  const startGeneration = () => {
    setState((prev) => ({
      ...prev,
      isGenerating: true,
      streamedContent: "",
      error: null,
    }));
  };

  const appendChunk = (chunk: string) => {
    setState((prev) => ({
      ...prev,
      streamedContent: prev.streamedContent + chunk,
    }));
  };

  const completeGeneration = (output: AiOutput) => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      completedOutput: output,
      savedOutputs: [...prev.savedOutputs, prev.streamedContent],
    }));
  };

  const setError = (error: string) => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      error,
    }));
  };

  const reset = () => {
    setState((prev) => ({
      isGenerating: false,
      streamedContent: "",
      error: null,
      savedOutputs: prev.savedOutputs,
      completedOutput: null,
    }));
  };

  return (
    <AiGeneratorContext.Provider
      value={{
        state,
        startGeneration,
        appendChunk,
        completeGeneration,
        setError,
        reset,
      }}
    >
      {children}
    </AiGeneratorContext.Provider>
  );
}

export function useAiGenerator() {
  const context = useContext(AiGeneratorContext);
  if (!context) {
    throw new Error("useAiGenerator must be used within AiGeneratorProvider");
  }
  return context;
}
