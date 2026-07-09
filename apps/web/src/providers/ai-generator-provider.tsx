"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

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

type GeneratorAction =
  | { type: "SET_FIELD"; field: keyof GeneratorState; value: any }
  | { type: "START_GENERATION" }
  | { type: "APPEND_CHUNK"; chunk: string }
  | { type: "COMPLETE_GENERATION" }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" };

const initialState: GeneratorState = {
  activeType: "Ad",
  prompt: "",
  tone: "Professional",
  length: "Medium",
  keywords: "",
  isGenerating: false,
  streamedContent: "",
  error: null,
  savedOutputs: [],
};

function generatorReducer(
  state: GeneratorState,
  action: GeneratorAction,
): GeneratorState {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "START_GENERATION":
      return {
        ...state,
        isGenerating: true,
        streamedContent: "",
        error: null,
      };
    case "APPEND_CHUNK":
      return {
        ...state,
        streamedContent: state.streamedContent + action.chunk,
      };
    case "COMPLETE_GENERATION":
      return {
        ...state,
        isGenerating: false,
        savedOutputs: [...state.savedOutputs, state.streamedContent],
      };
    case "SET_ERROR":
      return {
        ...state,
        isGenerating: false,
        error: action.error,
      };
    case "RESET":
      return {
        ...initialState,
        activeType: state.activeType,
        savedOutputs: state.savedOutputs,
      };
    default:
      return state;
  }
}

interface AiGeneratorContextType {
  state: GeneratorState;
  dispatch: React.Dispatch<GeneratorAction>;
  setField: (field: keyof GeneratorState, value: any) => void;
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
  const [state, dispatch] = useReducer(generatorReducer, initialState);

  const setField = (field: keyof GeneratorState, value: any) => {
    dispatch({ type: "SET_FIELD", field, value });
  };

  const startGeneration = () => {
    dispatch({ type: "START_GENERATION" });
  };

  const appendChunk = (chunk: string) => {
    dispatch({ type: "APPEND_CHUNK", chunk });
  };

  const completeGeneration = () => {
    dispatch({ type: "COMPLETE_GENERATION" });
  };

  const setError = (error: string) => {
    dispatch({ type: "SET_ERROR", error });
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };

  return (
    <AiGeneratorContext.Provider
      value={{
        state,
        dispatch,
        setField,
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
