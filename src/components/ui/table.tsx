import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-xl border border-border/40 shadow-lg bg-background backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-collapse", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 backdrop-blur-sm border-b border-border/30",
      "[&_tr]:border-b-0 sticky top-0 z-10",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0 divide-y divide-border/20",
      className
    )}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border/40 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30",
      "font-medium [&>tr]:last:border-b-0 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => {
  const baseClassName = cn(
    "border-b border-border/30 transition-all duration-300 ease-out",
    "hover:bg-gradient-to-r hover:from-muted/40 hover:via-muted/20 hover:to-transparent",
    "hover:shadow-sm hover:scale-[1.005] hover:z-10 relative",
    "data-[state=selected]:bg-gradient-to-r data-[state=selected]:from-primary/10 data-[state=selected]:to-primary/5",
    "data-[state=selected]:border-primary/30 data-[state=selected]:shadow-sm",
    "focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-1",
    className
  )
  
  if (animated) {
    // Extract only the safe props for motion.tr
    const {
      children,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      id,
      style,
      ...restProps
    } = props
    
    return (
      <motion.tr
        ref={ref}
        className={baseClassName}
        id={id}
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ 
          y: -1,
          transition: { duration: 0.2 }
        }}
      >
        {children}
      </motion.tr>
    )
  }
  
  return (
    <tr
      ref={ref}
      className={baseClassName}
      {...props}
    />
  )
})
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sortDirection?: 'asc' | 'desc' | null
  }
>(({ className, sortable, sortDirection, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-16 px-6 py-4 text-left align-middle font-semibold text-foreground/90",
      "tracking-tight leading-none text-sm uppercase",
      "[&:has([role=checkbox])]:pr-3 [&:has([role=checkbox])]:pl-3",
      sortable && "cursor-pointer select-none hover:text-foreground hover:bg-muted/50 transition-colors duration-200",
      sortable && "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded-md",
      className
    )}
    {...props}
  >
    <div className={cn(
      "flex items-center gap-2",
      sortable && "group"
    )}>
      {children}
      {sortable && (
        <motion.div
          className="text-muted-foreground group-hover:text-foreground transition-colors"
          animate={{
            rotate: sortDirection === 'desc' ? 180 : 0,
            scale: sortDirection ? 1 : 0.8,
            opacity: sortDirection ? 1 : 0.5
          }}
          transition={{ duration: 0.2 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 2L9 6H3L6 2Z" />
          </svg>
        </motion.div>
      )}
    </div>
  </th>
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    truncate?: boolean
  }
>(({ className, truncate, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-6 py-4 align-middle text-foreground/90",
      "[&:has([role=checkbox])]:pr-3 [&:has([role=checkbox])]:pl-3",
      "text-sm leading-relaxed",
      truncate && "max-w-[200px] truncate",
      className
    )}
    {...props}
  >
    {truncate && typeof children === 'string' ? (
      <div className="truncate" title={children}>
        {children}
      </div>
    ) : (
      children
    )}
  </td>
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-6 text-sm text-muted-foreground font-medium leading-relaxed",
      className
    )}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// New utility component for responsive table wrapper
const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full overflow-hidden rounded-xl border border-border/40 shadow-lg",
      "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}
    {...props}
  >
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
))
ResponsiveTable.displayName = "ResponsiveTable"

// New component for table loading state
const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <Table>
    <TableHeader>
      <TableRow animated={false}>
        {Array.from({ length: columns }).map((_, i) => (
          <TableHead key={i}>
            <div className="h-4 bg-muted animate-pulse rounded" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} animated={false}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-4 bg-muted/50 animate-pulse rounded" style={{
                animationDelay: `${(i * columns + j) * 100}ms`
              }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  ResponsiveTable,
  TableSkeleton,
}
