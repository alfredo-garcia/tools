/**
 * Iconos desde Lucide React (librería estándar).
 * Re-exportamos con la misma API: size, className, strokeWidth; por defecto shrink-0 y strokeWidth 2.
 * Los iconos que no existen en Lucide se mantienen como SVG custom (poop, heart-fire, saint, devil, etc.).
 */
import {
  Menu,
  Home,
  Target,
  CheckSquare,
  Circle,
  Settings,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Monitor,
  Star,
  Play,
  Flame,
  User,
  Tag,
  Trash2,
  BarChart3,
  Search,
  X,
  MoreVertical,
  ShoppingCart,
  BookOpen,
  UtensilsCrossed,
  Coffee,
  Cake,
  Martini,
  Wine,
  Drumstick,
  Cherry,
  Sparkles,
  Filter,
  Skull,
  Heart,
  ArrowUpNarrowWide,
} from 'lucide-react'

const iconClass = 'shrink-0'
const defaultStroke = 2

function wrapLucide(LucideIcon, defaultFill = false) {
  return function Icon({ className = '', size = 24, strokeWidth = defaultStroke, ...rest }) {
    return (
      <LucideIcon
        size={size}
        strokeWidth={strokeWidth}
        className={`${iconClass} ${className}`.trim()}
        aria-hidden
        {...(defaultFill ? { fill: 'currentColor' } : {})}
        {...rest}
      />
    )
  }
}

// Re-exportar con mismo nombre y API que antes
export const IconMenu = wrapLucide(Menu)
export const IconHome = wrapLucide(Home)
export const IconTarget = wrapLucide(Target)
export const IconCheckSquare = wrapLucide(CheckSquare)
export const IconCircle = wrapLucide(Circle)
export const IconSettings = wrapLucide(Settings)
export const IconCalendar = wrapLucide(Calendar)
export const IconRefresh = wrapLucide(RefreshCw)
export const IconChevronLeft = wrapLucide(ChevronLeft)
export const IconChevronRight = wrapLucide(ChevronRight)
export const IconChevronDown = wrapLucide(ChevronDown)
export const IconChevronUp = wrapLucide(ChevronUp)
export const IconChevronsLeft = wrapLucide(ChevronsLeft)
export const IconChevronsRight = wrapLucide(ChevronsRight)
export const IconSun = wrapLucide(Sun)
export const IconMoon = wrapLucide(Moon)
export const IconMonitor = wrapLucide(Monitor)
export const IconStar = wrapLucide(Star, true)
export const IconPlay = wrapLucide(Play, true)
export const IconFlame = wrapLucide(Flame)
export const IconUser = wrapLucide(User)
export const IconTag = wrapLucide(Tag)
export const IconTrash = wrapLucide(Trash2)
export const IconPriority = wrapLucide(ArrowUpNarrowWide)
export const IconHeart = wrapLucide(Heart)
export const IconChartBar = wrapLucide(BarChart3)
export const IconSearch = wrapLucide(Search)
export const IconX = wrapLucide(X)
export const IconMoreVertical = wrapLucide(MoreVertical)
export const IconCart = wrapLucide(ShoppingCart)
export const IconBook = wrapLucide(BookOpen)
export const IconUtensils = wrapLucide(UtensilsCrossed)
export const IconCoffee = wrapLucide(Coffee)
export const IconChickenLeg = wrapLucide(Drumstick)
export const IconTapa = wrapLucide(Cherry)
export const IconCake = wrapLucide(Cake)
export const IconBottle = wrapLucide(Wine)
export const IconMartini = wrapLucide(Martini)
export const IconMagicBall = wrapLucide(Sparkles)
export const IconFilter = wrapLucide(Filter)
export const IconSkull = wrapLucide(Skull)

/** Flame relleno (Lucide Flame no tiene variante filled; usamos el mismo con fill). */
export function IconFlameFilled({ className = '', size = 24 }) {
  return (
    <Flame
      size={size}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={defaultStroke}
      className={`${iconClass} ${className}`.trim()}
      aria-hidden
    />
  )
}

// ——— Iconos custom (no hay equivalente en Lucide o se prefiere el dibujo actual) ———

/** Santo: aureola y figura. */
export function IconSaint({ className = '', size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconClass} ${className}`} aria-hidden>
      <circle cx="12" cy="3.5" r="2.2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M12 13v1a3 3 0 0 1-3 3 2 2 0 0 1-2-2v-1h10v1a2 2 0 0 1-2 2 3 3 0 0 1-3-3v-1" />
    </svg>
  )
}

/** Demonio: cuernos y figura. */
export function IconDevil({ className = '', size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconClass} ${className}`} aria-hidden>
      <path d="M7 5C6 4 5 3 4 4c-1 1 0 2 1 3l2 1" />
      <path d="M17 5c1-1 2-1 3 0 1 1 0 2-1 3l-2 1" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 17v4" />
      <path d="M9 21h6" />
    </svg>
  )
}

/** Corazón en llamas (5+ good habits). */
export function IconHeartFire({ className = '', size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={`${iconClass} ${className}`} aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />
      <g transform="translate(12, 5) scale(0.38)" fill="currentColor">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </g>
    </svg>
  )
}

/** Poop (estilo emoji). */
export function IconPoop({ className = '', size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} ${className}`} aria-hidden>
      <path d="M12 3.2c-3 0-5.5 2.2-6 5.2-.3 2 0 4.2.9 5.8 1 1.6 2.4 2.8 4 3.2 1.7.4 3.4.1 4.8-1 .9-.8 1.5-1.9 1.8-3.2.3-1.5-.1-3.1-.8-4.4C16.2 5.2 14.3 3.2 12 3.2z" />
      <ellipse cx="11.5" cy="5.8" rx="2.8" ry="2.4" />
      <circle cx="9" cy="11" r="1" />
      <circle cx="15" cy="11" r="1" />
      <path d="M9.2 14.5c.9.5 2.1.5 3 0" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

/** Poop con moscas (5+ bad habits). */
export function IconPoopFlies({ className = '', size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" className={`${iconClass} ${className}`} aria-hidden>
      <path d="M12 5c-2.5 0-4 1.8-4.5 4-.5 2.2-.3 4.5.5 6.5.8 2 2 3 3.5 3.5s3 0 4-.5c1-.5 1.8-1.5 2.2-2.5.6-1.5.6-3.5 0-5.5C16 6.8 14.5 5 12 5z" fill="currentColor" />
      <ellipse cx="12" cy="19" rx="5" ry="2.2" fill="currentColor" />
      <circle cx="7.5" cy="6" r="1.1" fill="currentColor" />
      <circle cx="16.5" cy="6.5" r="1.1" fill="currentColor" />
      <circle cx="10" cy="4" r="0.85" fill="currentColor" />
    </svg>
  )
}

/** Calavera con moscas (5+ bad habits). */
export function IconSkullFlies({ className = '', size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} ${className}`} aria-hidden>
      <circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5 10c0-1.5 1-3 3-3h8c2 0 3 1.5 3 3v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="10" r="1.5" />
      <circle cx="15" cy="10" r="1.5" />
      <path d="M8 14h2M14 14h2M10 17h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="5" r="1" />
      <circle cx="17" cy="6" r="1" />
      <circle cx="12" cy="3" r="0.8" />
    </svg>
  )
}
