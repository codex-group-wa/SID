import { Button } from "@/components/ui/button";
import { RotateCw, X, Zap, Play, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionButtonsProps {
  containerId: string;
  handleAction: (id: string, action: string) => void;
  containerStatus: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  containerId,
  handleAction,
  containerStatus,
}) => {
  const runningActions = [
    { type: "Restart", icon: <RotateCw /> },
    { type: "Stop", icon: <X /> },
    { type: "Kill", icon: <Zap /> },
  ];

  const stoppedActions = [
    { type: "Start", icon: <Play /> },
    { type: "Delete", icon: <Trash2 /> },
  ];

  const actions =
    containerStatus === "running" ? runningActions : stoppedActions;

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
