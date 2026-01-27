import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Navigation2, 
  MapPin, 
  Clock,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  CornerDownRight,
  RotateCcw,
  Flag,
  Play
} from "lucide-react";
import { NavigationStep, getManeuverIcon } from "@/hooks/useNavigationInstructions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavigationInstructionsProps {
  steps: NavigationStep[];
  totalDistance: string;
  totalDuration: string;
  currentStepIndex?: number;
  isLoading?: boolean;
  className?: string;
}

const getStepIcon = (type: string, modifier?: string) => {
  switch (type) {
    case "depart":
      return <Play className="w-5 h-5" />;
    case "arrive":
      return <Flag className="w-5 h-5" />;
    case "turn":
      if (modifier === "left") return <CornerDownLeft className="w-5 h-5" />;
      if (modifier === "right") return <CornerDownRight className="w-5 h-5" />;
      if (modifier === "slight left") return <ArrowUpLeft className="w-5 h-5" />;
      if (modifier === "slight right") return <ArrowUpRight className="w-5 h-5" />;
      if (modifier === "sharp left") return <ArrowLeft className="w-5 h-5" />;
      if (modifier === "sharp right") return <ArrowRight className="w-5 h-5" />;
      if (modifier === "uturn") return <RotateCcw className="w-5 h-5" />;
      return <ArrowUp className="w-5 h-5" />;
    case "continue":
    case "new name":
      return <ArrowUp className="w-5 h-5" />;
    case "roundabout":
    case "rotary":
      return <RotateCcw className="w-5 h-5" />;
    case "fork":
      if (modifier === "left") return <ArrowUpLeft className="w-5 h-5" />;
      return <ArrowUpRight className="w-5 h-5" />;
    case "end of road":
      if (modifier === "left") return <CornerDownLeft className="w-5 h-5" />;
      return <CornerDownRight className="w-5 h-5" />;
    case "merge":
      return <Navigation2 className="w-5 h-5" />;
    default:
      return <ArrowUp className="w-5 h-5" />;
  }
};

const getStepColor = (type: string, isActive: boolean) => {
  if (isActive) {
    return "bg-primary text-primary-foreground";
  }
  switch (type) {
    case "arrive":
      return "bg-green-500/20 text-green-600 dark:text-green-400";
    case "depart":
      return "bg-primary/20 text-primary";
    default:
      return "bg-secondary text-muted-foreground";
  }
};

const NavigationInstructions: React.FC<NavigationInstructionsProps> = ({
  steps,
  totalDistance,
  totalDuration,
  currentStepIndex = 0,
  isLoading = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Current Step - Always Visible */}
      <CardHeader className="p-0">
        <div className="bg-gradient-to-r from-primary to-accent p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Navigation2 className="w-4 h-4" />
              <span className="text-sm font-medium">Turn-by-Turn Navigation</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/80 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {totalDistance}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {totalDuration}
              </span>
            </div>
          </div>

          {currentStep && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary-foreground/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-primary-foreground">
                {getStepIcon(currentStep.type, currentStep.modifier)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-primary-foreground leading-tight">
                  {currentStep.instruction}
                </p>
                <div className="flex items-center gap-3 mt-1 text-primary-foreground/70 text-sm">
                  <span>{currentStep.distance}</span>
                  {currentStep.streetName && (
                    <>
                      <span>•</span>
                      <span className="truncate">{currentStep.streetName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Next Step Preview */}
          {nextStep && (
            <div className="mt-3 pt-3 border-t border-primary-foreground/20">
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <span className="text-xs">Then</span>
                <div className="w-6 h-6 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  {getStepIcon(nextStep.type, nextStep.modifier)}
                </div>
                <span className="text-sm truncate flex-1">
                  {nextStep.instruction}
                </span>
                <span className="text-xs">{nextStep.distance}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full rounded-none border-b h-10 flex items-center justify-center gap-2 text-muted-foreground"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide all steps
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show all {steps.length} steps
          </>
        )}
      </Button>

      {/* All Steps List */}
      {isExpanded && (
        <ScrollArea className="max-h-64">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isPast = index < currentStepIndex;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors",
                      isActive && "bg-primary/5",
                      isPast && "opacity-50"
                    )}
                  >
                    {/* Step Number & Icon */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          getStepColor(step.type, isActive)
                        )}
                      >
                        {getStepIcon(step.type, step.modifier)}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {index + 1}/{steps.length}
                      </span>
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0 py-1">
                      <p
                        className={cn(
                          "text-sm font-medium leading-tight",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.instruction}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{step.distance}</span>
                        <span>•</span>
                        <span>{step.duration}</span>
                        {step.streetName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{step.streetName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </ScrollArea>
      )}
    </Card>
  );
};

export default NavigationInstructions;
