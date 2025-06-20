import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientAvatarProps {
  /** The URL of the patient's profile picture */
  avatarUrl?: string | null;
  /** The patient's name for alt text */
  name: string;
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** AI data hint for the image */
  dataAiHint?: string;
  /** Shape of the avatar */
  shape?: 'circle' | 'rounded';
}

const sizeMap = {
  sm: { container: 'w-8 h-8', icon: 'h-4 w-4', image: { width: 32, height: 32 } },
  md: { container: 'w-12 h-12', icon: 'h-6 w-6', image: { width: 48, height: 48 } },
  lg: { container: 'w-16 h-16', icon: 'h-8 w-8', image: { width: 64, height: 64 } },
  xl: { container: 'w-[100px] h-[100px]', icon: 'h-12 w-12', image: { width: 100, height: 100 } },
};

const shapeMap = {
  circle: {
    container: 'rounded-full',
    image: 'rounded-full',
  },
  rounded: {
    container: 'rounded-lg',
    image: 'rounded-lg',
  },
};

/**
 * A reusable patient avatar component that displays a profile picture or falls back to a user icon.
 * Automatically handles placeholder URLs and missing avatars.
 */
export function PatientAvatar({ 
  avatarUrl, 
  name, 
  size = 'md', 
  className = '',
  dataAiHint,
  shape = 'circle'
}: PatientAvatarProps) {
  const sizeConfig = sizeMap[size];
  const shapeConfig = shapeMap[shape];
  
  // Check if we have a valid avatar URL (not null, undefined, or placeholder)
  const hasValidAvatar = avatarUrl && 
    !avatarUrl.includes('placehold.co') && 
    !avatarUrl.includes('placeholder');

  if (hasValidAvatar) {
    return (
      <div className={cn("relative", className)}>
        <Image
          src={avatarUrl}
          alt={`${name}'s profile picture`}
          width={sizeConfig.image.width}
          height={sizeConfig.image.height}
          className={cn(
            "border-2 border-primary/20 object-cover",
            shapeConfig.image
          )}
          data-ai-hint={dataAiHint}
        />
      </div>
    );
  }

  // Fallback to user icon
  return (
    <div className={cn(
      "bg-primary/10 flex items-center justify-center border-2 border-primary/20",
      sizeConfig.container,
      shapeConfig.container,
      className
    )}>
      <User className={cn("text-primary", sizeConfig.icon)} />
    </div>
  );
}
