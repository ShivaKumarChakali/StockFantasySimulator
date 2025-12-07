import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

interface College {
  id: string;
  name: string;
  city: string | null;
}

export default function CollegeSelection() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: colleges = [], isLoading } = useQuery<College[]>({
    queryKey: ["/api/colleges"],
  });

  const handleSelect = (collegeId: string) => {
    setSelected(collegeId);
  };

  const handleContinue = () => {
    if (selected) {
      setLocation(`/signup?college=${selected}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold">Select Your College</h1>
        <p className="text-sm text-muted-foreground mt-1">This will help us rank your college</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <div className="text-center py-12">Loading colleges...</div>
        ) : (
          <div className="space-y-3">
            {colleges.map((college) => (
              <Card
                key={college.id}
                className={`p-4 cursor-pointer transition-all hover-elevate ${
                  selected === college.id ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => handleSelect(college.id)}
                data-testid={`card-college-${college.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{college.name}</h3>
                    {college.city && <p className="text-sm text-muted-foreground">{college.city}</p>}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed left-0 right-0 p-4 border-t border-border bg-background z-40 pb-safe" style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          disabled={!selected}
          data-testid="button-continue-college"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
