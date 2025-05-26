import { Button } from "@/components/ui/button";
import { RotateCw, X, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionButtonsProps {
  containerId: string;
  handleAction: (id: string, action: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  containerId,
  handleAction,
}) => {
  const actions = [
    { type: "Restart", icon: <RotateCw /> },
    { type: "Stop", icon: <X /> },
    { type: "Kill", icon: <Zap /> },
  ];

  return (
    <div className="flex space-x-1">
      {actions.map(({ type, icon }) => (
        <TooltipProvider key={type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                key={type}
                onClick={() => handleAction(containerId, type)}
                className="w-7 h-7 px-1"
                variant="outline"
                size="icon"
              >
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{type}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default ActionButtons;
