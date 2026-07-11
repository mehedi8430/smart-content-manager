"use client";

import { Megaphone, MessageSquare, Mail } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

interface TypeTabsProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: string;
}

export function TypeTabs<T extends FieldValues = FieldValues>({
  control,
  name,
}: TypeTabsProps<T>) {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field }) => (
        <Tabs value={field.value} onValueChange={field.onChange}>
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
      )}
    />
  );
}
