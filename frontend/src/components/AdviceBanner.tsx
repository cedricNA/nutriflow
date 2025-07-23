import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdviceBannerProps {
  message: string;
  type?: "info" | "success" | "warning";
}

export const AdviceBanner = ({ message, type = "info" }: AdviceBannerProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariantClasses = () => {
    switch (type) {
      case "success":
        return "border-success/50 bg-success/10 text-success-foreground";
      case "warning":
        return "border-warning/50 bg-warning/10 text-warning-foreground";
      default:
        return "border-primary/50 bg-primary/10 text-primary-foreground";
    }
  };

  return (
    <Alert className={`${getVariantClasses()} shadow-soft`}>
      {getIcon()}
      <AlertDescription className="font-medium">
        {message}
      </AlertDescription>
    </Alert>
  );
};