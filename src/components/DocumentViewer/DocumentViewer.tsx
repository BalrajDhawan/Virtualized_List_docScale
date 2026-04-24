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
      renderItem={(actualPageIndex, translateY, domIndex) => (
        // We strictly use domIndex as the key to achieve DOM Recycling (Performance Optimization)
        <Page 
          key={domIndex} 
          index={actualPageIndex} 
          translateY={translateY} 
        />
      )}
    />
  );
}
