import React from 'react';

interface PageProps {
  index: number;
  translateY: number;
}

export const Page = React.memo(({ index, translateY }: PageProps) => {
  return (
    <div 
      contentEditable={true} 
      suppressContentEditableWarning={true}
      style={{
        position: 'absolute',
        top: 0,
        transform: `translateY(${translateY}px)`,
      }}
      className="bg-white border border-zinc-300 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black" 
    >
      <p>Page: {(index + 1).toString()}</p>
    </div>
  );
});

Page.displayName = 'Page';
