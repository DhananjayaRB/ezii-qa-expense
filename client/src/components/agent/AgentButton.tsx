import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Zap } from "lucide-react";
import { AgentInterface } from "./AgentInterface";

export function AgentButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg z-50 transition-all duration-300 hover:scale-110"
        data-testid="button-open-agent"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
            <Zap className="w-2 h-2 text-white" />
          </div>
        </div>
      </Button>

      <AgentInterface isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}