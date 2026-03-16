'use client';

import { PlatformCard } from '@/app/components/platforms/platform-card';
import type { PlatformConnection } from '@/lib/platforms';

interface PlatformListProps {
  connections: PlatformConnection[];
  onReconnect: (connection: PlatformConnection) => void;
  onDisconnect: (connection: PlatformConnection) => void;
  onDelete: (connection: PlatformConnection) => void;
}

export function PlatformList({ connections, onReconnect, onDisconnect, onDelete }: PlatformListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {connections.map((connection, index) => (
        <PlatformCard
          key={connection.id}
          connection={connection}
          index={index}
          onReconnect={onReconnect}
          onDisconnect={onDisconnect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}