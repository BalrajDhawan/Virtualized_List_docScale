import React from 'react';
import { VirtualizedList } from '../VirtualizedList/VirtualizedList';
import { Page } from '../Page/Page';

interface DocumentViewerProps {
  pageCount: number;
}

export function DocumentViewer({ pageCount }: DocumentViewerProps) {
  return (
    <VirtualizedList 
      pageCount={pageCount}
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
