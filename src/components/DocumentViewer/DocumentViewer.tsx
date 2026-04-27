import React from 'react';
import { VirtualizedList } from '../VirtualizedList/VirtualizedList';
import { Page } from '../Page/Page';

interface DocumentViewerProps {
  pageCount: number;
  showDebug?: boolean;
}

export function DocumentViewer({ pageCount, showDebug }: DocumentViewerProps) {
  return (
    <VirtualizedList
      pageCount={pageCount}
      showDebug={showDebug}
      renderItem={(actualPageIndex, translateY, domIndex, scrollVelocity) => (
        <Page
          key={domIndex}
          index={actualPageIndex}
          translateY={translateY}
          scrollVelocity={scrollVelocity}
        />
      )}
    />
  );
}
