import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  forceColor?: 'violet' | 'blue' | 'emerald' | 'semantic';
}

export function ScoreRing({
  score,
  label,
  sublabel,
  size = 120,
  strokeWidth = 9,
  forceColor = 'semantic',
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimatedScore(clamped);
    });
    return () => cancelAnimationFrame(timer);
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (animatedScore / 100) * circumference;

  let strokeColor = '#10B981';
  let textColor = 'text-emerald-700';
  let statusText = 'Strong Match';

  if (forceColor === 'violet') {
    strokeColor = '#7C3AED';
    textColor = 'text-slate-900';
  } else if (forceColor === 'blue') {
    strokeColor = '#4F46E5';
    textColor = 'text-slate-900';
  } else if (forceColor === 'emerald') {
    strokeColor = '#10B981';
    textColor = 'text-slate-900';
  } else {
    if (clamped < 60) {
      strokeColor = '#EF4444';
      textColor = 'text-red-600';
      statusText = 'Needs Work';
    } else if (clamped < 80) {
      strokeColor = '#F59E0B';
      textColor = 'text-amber-600';
      statusText = 'Good';
    } else {
      strokeColor = '#10B981';
      textColor = 'text-emerald-600';
      statusText = 'Strong';
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${textColor}`}
          >
            {animatedScore}
          </span>
          <span className="font-mono text-[11px] font-medium text-slate-400 tabular-nums">
            / 100
          </span>
        </div>
      </div>

      <span className="mt-2.5 text-sm font-semibold text-slate-800">
        {label}
      </span>
      {forceColor === 'semantic' && (
        <span className={`mt-0.5 text-xs font-medium ${textColor}`}>
          {sublabel || statusText}
        </span>
      )}
    </div>
  );
}
