"use client";

import { Megaphone, MessageSquare, Mail } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiGenerator, ContentType } from "@/providers/ai-generator-provider";

export function TypeTabs() {
  const { state, setField } = useAiGenerator();

  const handleTypeChange = (value: string) => {
    setField("activeType", value as ContentType);
  };

  return (
    <Tabs value={state.activeType} onValueChange={handleTypeChange}>
      <TabsList>
        <TabsTrigger value="Ad">
          <Megaphone className="h-4 w-4 mr-2" />
          Ad
        </TabsTrigger>
        <TabsTrigger value="Caption">
          <MessageSquare className="h-4 w-4 mr-2" />
          Caption
        </TabsTrigger>
        <TabsTrigger value="Email">
          <Mail className="h-4 w-4 mr-2" />
          Email
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
