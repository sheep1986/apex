import React from "react";
import { TrinityLogo } from "./TrinityLogo";

/**
 * AnimatedSidebarLogo
 *
 * Adapts the rotating "TRINITY GUIDE" AI trigger button visualization
 * for use in the collapsed sidebar state.
 */
export const AnimatedSidebarLogo: React.FC<{ className?: string }> = ({
  className = "w-12 h-12",
}) => {
  return (
    <div
      className={`relative flex items-center justify-center overflow-visible ${className}`}
    >
      {/* Central Static Logo - Scaled Up */}
      <div className="w-[90%] h-[90%] z-10">
        <TrinityLogo className="w-full h-full" />
      </div>
    </div>
  );
};
