"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

// Enhanced color palette for modern charts
export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  success: "hsl(142, 76%, 45%)", // Modern green
  warning: "hsl(38, 92%, 50%)", // Modern amber
  error: "hsl(0, 84%, 60%)", // Modern red
  info: "hsl(217, 91%, 60%)", // Modern blue
  purple: "hsl(262, 83%, 65%)", // Modern purple
  teal: "hsl(173, 80%, 40%)", // Modern teal
  orange: "hsl(25, 95%, 53%)", // Modern orange
  pink: "hsl(336, 84%, 57%)", // Modern pink
  indigo: "hsl(231, 48%, 48%)", // Modern indigo
} as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

// Enhanced chart container with animations and improved styling
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
    animated?: boolean
    variant?: "default" | "minimal" | "elevated"
  }
>(({ id, className, children, config, animated = true, variant = "default", ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const variantClasses = {
    default: "rounded-xl border bg-card shadow-sm",
    minimal: "rounded-lg bg-transparent",
    elevated: "rounded-xl border bg-card shadow-lg ring-1 ring-border/5"
  }

  const ChartContent = (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs p-6",
        variantClasses[variant],
        // Enhanced chart styling with modern colors and animations
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-axis-tick_text]:text-xs [&_.recharts-cartesian-axis-tick_text]:font-medium [&_.recharts-cartesian-axis-tick_text]:transition-colors",
        "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/20 [&_.recharts-cartesian-grid_line]:transition-opacity",
        "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border/50",
        "[&_.recharts-dot[stroke='#fff']]:stroke-background [&_.recharts-dot]:transition-all [&_.recharts-dot]:duration-200",
        "[&_.recharts-layer]:outline-none [&_.recharts-layer]:transition-all",
        "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border/20",
        "[&_.recharts-radial-bar-background-sector]:fill-muted/30",
        "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/10 [&_.recharts-rectangle.recharts-tooltip-cursor]:transition-all",
        "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border/40",
        "[&_.recharts-sector[stroke='#fff']]:stroke-background [&_.recharts-sector]:outline-none [&_.recharts-sector]:transition-all [&_.recharts-sector]:duration-200",
        "[&_.recharts-surface]:outline-none",
        // Hover effects for interactive elements
        "[&_.recharts-bar]:transition-all [&_.recharts-bar]:duration-200 [&_.recharts-bar:hover]:brightness-110",
        "[&_.recharts-line]:transition-all [&_.recharts-line]:duration-200",
        "[&_.recharts-area]:transition-all [&_.recharts-area]:duration-200",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      <RechartsPrimitive.ResponsiveContainer>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  )

  if (animated) {
    return (
      <ChartContext.Provider value={{ config }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {ChartContent}
        </motion.div>
      </ChartContext.Provider>
    )
  }

  return (
    <ChartContext.Provider value={{ config }}>
      {ChartContent}
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

// Enhanced tooltip with improved animations and styling
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
      animated?: boolean
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      animated = true,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-semibold text-sm text-foreground", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-semibold text-sm text-foreground", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    const tooltipVariants = {
      hidden: { opacity: 0, scale: 0.95, y: 5 },
      visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: { 
          duration: 0.15,
          ease: "easeOut" 
        }
      }
    }

    const TooltipContent = (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-3 rounded-xl border border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 text-sm shadow-xl ring-1 ring-border/5",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-2.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded border-[--color-border] bg-[--color-bg] transition-all duration-200",
                            {
                              "h-3.5 w-3.5 rounded-full shadow-sm": indicator === "dot",
                              "w-1 rounded-full": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground font-medium">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-semibold tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )

    if (animated) {
      return (
        <AnimatePresence>
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {TooltipContent}
          </motion.div>
        </AnimatePresence>
      )
    }

    return TooltipContent
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

// Enhanced legend with improved styling and animations
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
      variant?: "default" | "pills" | "minimal"
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, variant = "default" },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    const variantClasses = {
      default: "flex items-center justify-center gap-6",
      pills: "flex items-center justify-center gap-2 flex-wrap",
      minimal: "flex items-center justify-center gap-4"
    }

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          verticalAlign === "top" ? "pb-4" : "pt-4",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-2 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-muted-foreground font-medium text-sm transition-colors hover:text-foreground",
                variant === "pills" && "px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted",
                variant === "minimal" && "text-xs"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className={cn(
                    "shrink-0 rounded shadow-sm transition-all duration-200",
                    variant === "pills" ? "h-2.5 w-2.5" : "h-3 w-3"
                  )}
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
