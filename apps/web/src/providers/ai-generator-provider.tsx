"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type ContentType = "Ad" | "Caption" | "Email";
export type ToneType =
  | "Professional"
  | "Playful"
  | "Urgent"
  | "Friendly"
  | "Bold";
export type LengthType = "Short" | "Medium" | "Long";

interface GeneratorState {
  activeType: ContentType;
  prompt: string;
  tone: ToneType;
  length: LengthType;
  keywords: string;
  isGenerating: boolean;
  streamedContent: string;
  error: string | null;
  savedOutputs: string[];
}

interface AiGeneratorContextType {
  state: GeneratorState;
  setActiveType: (type: ContentType) => void;
  setPrompt: (prompt: string) => void;
  setTone: (tone: ToneType) => void;
  setLength: (length: LengthType) => void;
  setKeywords: (keywords: string) => void;
  startGeneration: () => void;
  appendChunk: (chunk: string) => void;
  completeGeneration: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

const AiGeneratorContext = createContext<AiGeneratorContextType | undefined>(
  undefined,
);

export function AiGeneratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeneratorState>({
    activeType: "Ad",
    prompt: "",
    tone: "Professional",
    length: "Medium",
    keywords: "",
    isGenerating: false,
    streamedContent: "",
    error: null,
    savedOutputs: [],
  });

  const setActiveType = (type: ContentType) => {
    setState((prev) => ({ ...prev, activeType: type }));
  };

  const setPrompt = (prompt: string) => {
    setState((prev) => ({ ...prev, prompt }));
  };

  const setTone = (tone: ToneType) => {
    setState((prev) => ({ ...prev, tone }));
  };

  const setLength = (length: LengthType) => {
    setState((prev) => ({ ...prev, length }));
  };

  const setKeywords = (keywords: string) => {
    setState((prev) => ({ ...prev, keywords }));
  };

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

  const completeGeneration = () => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
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
      activeType: prev.activeType,
      prompt: "",
      tone: "Professional",
      length: "Medium",
      keywords: "",
      isGenerating: false,
      streamedContent: "",
      error: null,
      savedOutputs: prev.savedOutputs,
    }));
  };

  return (
    <AiGeneratorContext.Provider
      value={{
        state,
        setActiveType,
        setPrompt,
        setTone,
        setLength,
        setKeywords,
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
