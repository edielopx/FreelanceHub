import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a simple user avatar from initials
 */
export function getInitialsAvatar(name: string, size = 100): string {
  if (!name) return '';
  
  // Extract initials
  const initials = name
    .split(' ')
    .map(part => part[0]?.toUpperCase() || '')
    .filter(Boolean)
    .slice(0, 2)
    .join('');
    
  // Generate a deterministic color based on the name
  const colors = [
    '#4F46E5', '#7C3AED', '#EC4899', '#F97316', '#10B981',
    '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'
  ];
  
  const colorIndex = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
  const backgroundColor = colors[colorIndex];
  
  // Create an SVG
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${encodeURIComponent(backgroundColor)}" />
    <text x="50%" y="50%" dy=".1em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}px" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
}

/**
 * Get optimized image URL from original URL
 * If no image URL is provided, returns an avatar with user initials
 */
export function getOptimizedImageUrl(imageUrl: string | null | undefined, name: string = '', size = 100): string {
  if (!imageUrl) {
    return getInitialsAvatar(name, size);
  }
  
  return imageUrl;
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if it's today
  const today = new Date();
  if (dateObj.toDateString() === today.toDateString()) {
    return `Hoje, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateObj.toDateString() === yesterday.toDateString()) {
    return `Ontem, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Format as date
  return dateObj.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate distance between two sets of coordinates in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Simplified version of the Haversine formula
  const R = 6371; // Radius of earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Format price in Brazilian currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Truncate text with ellipsis if it exceeds max length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Group messages by date for chat display
 */
export function groupMessagesByDate(messages: any[]): { [key: string]: any[] } {
  if (!messages || !messages.length) return {};
  
  const grouped: { [key: string]: any[] } = {};
  
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString('pt-BR');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(msg);
  });
  
  return grouped;
}
