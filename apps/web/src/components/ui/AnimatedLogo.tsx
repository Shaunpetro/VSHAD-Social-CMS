// apps/web/src/components/ui/AnimatedLogo.tsx
'use client'

import { useEffect, useRef } from 'react'

interface AnimatedLogoProps {
  size?: number
  className?: string
  duration?: number
}

export default function AnimatedLogo({ 
  size = 120, 
  className = '',
  duration = 1.5
}: AnimatedLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const paths = svgRef.current.querySelectorAll('.animate-path')
    
    paths.forEach((path, index) => {
      const element = path as SVGPathElement | SVGPolygonElement
      
      if ('getTotalLength' in element) {
        const length = element.getTotalLength()
        element.style.strokeDasharray = `${length}`
        element.style.strokeDashoffset = `${length}`
        
        const delay = index * 0.02
        element.style.animation = `
          drawPath ${duration * 0.6}s ease-out ${delay}s forwards,
          fillGradient ${duration * 0.4}s ease-out ${duration * 0.5 + delay}s forwards
        `
      }
    })

    return () => {
      paths.forEach((path) => {
        (path as SVGPathElement).style.animation = ''
      })
    }
  }, [duration])

  return (
    <div className={`relative ${className}`}>
      <svg 
        ref={svgRef}
        viewBox="0 0 1024 1024" 
        width={size} 
        height={size}
        className="animated-logo"
      >
        <defs>
          <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E879F9">
              <animate attributeName="stop-color" values="#E879F9;#38BDF8;#E879F9" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#A855F7">
              <animate attributeName="stop-color" values="#A855F7;#E879F9;#A855F7" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#38BDF8">
              <animate attributeName="stop-color" values="#38BDF8;#A855F7;#38BDF8" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes drawPath { to { stroke-dashoffset: 0; } }
          @keyframes fillGradient { from { fill-opacity: 0; } to { fill: url(#animatedGradient); fill-opacity: 1; } }
          .animated-logo .animate-path {
            fill: var(--logo-unfilled, #D1D5DB);
            fill-opacity: 0.15;
            stroke: url(#strokeGradient);
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .dark .animated-logo .animate-path { --logo-unfilled: #374151; }
        `}</style>
        
        <path className="animate-path" d="M54.73,706.08H917.85c23.54,0,42.68-30.29,42.68-67.52V557.22c0-37.23-19.14-67.52-42.68-67.52H619L611.28,462H917.85C951,462,978,504.74,978,557.22v81.34c0,52.48-27,95.18-60.17,95.18H54.73c-4.83,0-8.75-6.19-8.75-13.83S49.9,706.08,54.73,706.08Z"/>
        <polygon className="animate-path" points="538.98 489.69 562.5 489.69 555.8 462.04 532.28 462.04 538.98 489.69"/>
        <polygon className="animate-path" points="501.94 489.69 525.47 489.69 518.77 462.04 495.25 462.04 501.94 489.69"/>
        <polygon className="animate-path" points="465.09 489.69 488.61 489.69 481.91 462.04 458.39 462.04 465.09 489.69"/>
        <path className="animate-path" d="M336.37,642.1l-3.57-14.86c-2.38-8.32-5.87-12.28-9.6-12.28H311.06v47.16H290.34V520.23h47.78c15.24,0,24,16.45,24,45,0,21.2-6,36.06-16.43,41v.19c1.9,1.79,3.65,5.55,5,10.71l4,15.25c1,3.57,2.38,6,4.6,6,1.35,0,3.25-1.78,4.21-4.56L367,654.59c-3.1,6.74-9.29,11.49-14.53,11.49C343.91,666.08,339.63,653.8,336.37,642.1Zm-4.44-56.28c5.95,0,9.44-6.53,9.44-17.43,0-11.1-3.49-17.64-9.44-17.64H311.06v35.07Z"/>
        <path className="animate-path" d="M366.84,611c0-32.89,13-54.49,32.86-54.49s32.93,21.6,32.93,54.49-13,54.3-32.93,54.3S366.84,643.89,366.84,611Zm47,0c0-16.25-5.55-27-14.12-27s-14.13,10.7-14.13,27,5.56,27,14.13,27S413.82,627.24,413.82,611Z"/>
        <path className="animate-path" d="M456.28,635.76h-.08l-2.46,26.36H437.55V514.29h18.81V586h.07c3.18-17.83,11.91-29.52,22.15-29.52,14.6,0,24.12,21.6,24.12,54.49s-9.52,54.3-24.12,54.3C468.26,665.29,459.45,653.8,456.28,635.76ZM483.89,611c0-14.07-5.55-23.38-14.12-23.38s-14.13,9.31-14.13,23.38,5.64,23.19,14.13,23.19S483.89,625.06,483.89,611Z"/>
        <path className="animate-path" d="M506.34,611c0-32.89,13-54.49,32.86-54.49s32.93,21.6,32.93,54.49-13,54.3-32.93,54.3S506.34,643.89,506.34,611Zm47,0c0-16.25-5.56-27-14.13-27s-14.13,10.7-14.13,27,5.56,27,14.13,27S553.33,627.24,553.33,611Z"/>
        <path className="animate-path" d="M593.79,641.51l7.14-30.72c6.59,13.08,18.89,22.6,29.76,22.6,8,0,13.1-4.76,13.1-12.09,0-6.15-3.65-9.91-12.3-12.29L621,606c-17.93-4.76-25.63-17.24-25.63-42.41,0-30.52,13.81-47.76,34-47.76,12,0,23.26,7.14,30.24,18.43L653.87,564c-6.19-10.31-15.56-16.85-24.29-16.65-8.09.2-14,5-14.12,12.49,0,5.35,3.17,8.71,10.47,10.5l10.56,2.77c19.2,5,27.46,18,27.46,43.8.08,29.32-13.42,49.34-34.29,49.34C616,666.28,601.41,656.17,593.79,641.51Z"/>
        <path className="animate-path" d="M736.71,611c0-32.89,12.7-54.49,31.74-54.49,15.87,0,27.54,15.85,29.68,40l-17.46,7.13c-1-11.3-5.23-18.43-11.43-18.43-8.41,0-13.8,9.71-13.8,25.76,0,15.86,5.63,25.76,14.92,25.76,8,0,13.8-9.11,15.07-24l17.38,6.73c-2.3,27.55-15.23,45.78-32.69,45.78C749.88,665.29,736.63,643.89,736.71,611Z"/>
        <path className="animate-path" d="M806.22,526c0-13.48,4.37-22.79,10.4-22.79S827,512.5,827,526s-4.36,23-10.39,23S806.22,539.45,806.22,526Zm1,33.89H826V662.12H807.25Z"/>
        <path className="animate-path" d="M831.06,637.15c0-20.41,9.92-34.28,26.9-38.25l15.64-3.56a3.78,3.78,0,0,0,2.77-4c0-5-4.52-8.72-11.42-8.72-9.92,0-21,7.93-28.81,20.42l-4.92-24.38C839.15,565.22,852,556.5,865,556.5c18,0,29.92,14.26,29.92,39.43v66.19H878.6l-2.54-22.2H876c-4.05,15.66-13,25.37-24.29,25.37C838.68,665.29,831.06,655,831.06,637.15Zm45-20.61v-.4l-16.83,3.77c-6.11,1.19-9.36,4.16-9.36,9.51,0,5.15,2.93,8.13,8.49,8.13C869,637.55,876.06,629,876.06,616.54Z"/>
        <path className="animate-path" d="M900.49,514.29H919.3V662.12H900.49Z"/>
        <path className="animate-path" d="M302.57,429.32A35,35,0,0,0,323,435.86V424.32a20.56,20.56,0,0,1-10.85-6.22,20.56,20.56,0,0,1-9.37-13.85H292.11v58.56a12.41,12.41,0,0,1-22.28,7.47,12.4,12.4,0,0,1,9.34-22.89V435.72a27.09,27.09,0,0,0-18.81,46,27.12,27.12,0,0,0,42.21-22.52Z"/>
        <path className="animate-path" d="M661.44,649.76,667,629a38.49,38.49,0,1,1,15.33,15.19Zm21.94-13.39,1.31.78A31.28,31.28,0,1,0,674,626.56l.8,1.33L671.7,639.5Z"/>
        <path className="animate-path" d="M714.87,615.76c-1.58-1-3.64-2-5.5-1.24-1.43.58-2.34,2.82-3.27,4a1.37,1.37,0,0,1-1.77.39,24.89,24.89,0,0,1-12.42-10.65,1.53,1.53,0,0,1,.19-2.08,8.52,8.52,0,0,0,2.26-3.67,8.13,8.13,0,0,0-1-4.34c-.75-1.61-1.59-3.91-3.21-4.82a4.37,4.37,0,0,0-4.76.71,9.66,9.66,0,0,0-3.36,7.66,10.44,10.44,0,0,0,.31,2.43,20.08,20.08,0,0,0,2.33,5.38,43.11,43.11,0,0,0,2.44,3.71A37.56,37.56,0,0,0,697.66,623a32.09,32.09,0,0,0,6.59,3.13c2.58.85,4.88,1.74,7.67,1.21a9.29,9.29,0,0,0,7-5.17,4.54,4.54,0,0,0,.32-2.64C718.8,617.72,716.34,616.64,714.87,615.76Z"/>
        <path className="animate-path" d="M213.48,426.24a4.58,4.58,0,1,0,4.57,4.57A4.57,4.57,0,0,0,213.48,426.24Z"/>
        <path className="animate-path" d="M193.15,432.11a19.21,19.21,0,1,0,19.21,19.2A19.23,19.23,0,0,0,193.15,432.11Zm0,31.51a12.31,12.31,0,1,1,12.3-12.31A12.31,12.31,0,0,1,193.15,463.62Z"/>
        <path className="animate-path" d="M208.4,490.31H177.26a23.46,23.46,0,0,1-23.43-23.43V435.74a23.45,23.45,0,0,1,23.43-23.42H208.4a23.45,23.45,0,0,1,23.43,23.42v31.14A23.46,23.46,0,0,1,208.4,490.31Zm-31.14-70.66a16.11,16.11,0,0,0-16.09,16.09v31.14A16.1,16.1,0,0,0,177.26,483H208.4a16.1,16.1,0,0,0,16.09-16.09V435.74a16.11,16.11,0,0,0-16.09-16.09Z"/>
        <path className="animate-path" d="M350.6,427.86h16.09v51.68H350.6Zm8-25.68a9.32,9.32,0,1,1-9.32,9.31,9.31,9.31,0,0,1,9.32-9.31"/>
        <path className="animate-path" d="M376.77,427.86h15.4v7.07h.21c2.15-4.07,7.39-8.35,15.22-8.35,16.26,0,19.26,10.7,19.26,24.62v28.34H410.81V454.42c0-6-.12-13.71-8.35-13.71s-9.64,6.53-9.64,13.27v25.56H376.77Z"/>
      </svg>
    </div>
  )
}