export function Spinner({ className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-12 h-12 border-3'
  }
  return (
    <div
      className={`${sizeClasses[size]} border-sky-500 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  )
}
