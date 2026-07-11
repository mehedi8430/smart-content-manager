"use client";

import { Megaphone, MessageSquare, Mail } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiGenerator, ContentType } from "@/providers/ai-generator-provider";

export function TypeTabs() {
  const { state, setActiveType } = useAiGenerator();

  const handleTypeChange = (value: string) => {
    setActiveType(value as ContentType);
  };

  return (
    <Tabs value={state.activeType} onValueChange={handleTypeChange}>
      <TabsList>
        <TabsTrigger value="Ad" className="cursor-pointer">
          <Megaphone className="h-4 w-4 mr-2" />
          Ad
        </TabsTrigger>
        <TabsTrigger value="Caption" className="cursor-pointer">
          <MessageSquare className="h-4 w-4 mr-2" />
          Caption
        </TabsTrigger>
        <TabsTrigger value="Email" className="cursor-pointer">
          <Mail className="h-4 w-4 mr-2" />
          Email
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
