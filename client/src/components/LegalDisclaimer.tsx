/**
 * Legal Disclaimer Component
 * 
 * This platform is for educational and simulation purposes only.
 * No real money trading or financial returns are involved.
 */

export function LegalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`text-xs md:text-sm text-muted-foreground ${className}`}>
      <p className="font-semibold mb-1">Educational Disclaimer:</p>
      <p>
        This platform is for educational and simulation purposes only. 
        No real money trading, financial returns, or monetary prizes are involved. 
        All trading activity is simulated using virtual currency for learning purposes.
      </p>
    </div>
  );
}

export function LegalDisclaimerInline({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground italic ${className}`}>
      For educational and simulation purposes only. No real money or prizes involved.
    </p>
  );
}


