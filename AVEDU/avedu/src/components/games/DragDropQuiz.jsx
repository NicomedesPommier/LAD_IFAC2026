// src/components/games/DragDropQuiz.jsx
import React, { useState, useEffect } from "react";
import "../../styles/pages/_learn.scss";

export default function DragDropQuiz({ 
  title, 
  description, 
  items, // Array of { id: string, content: string }
  targets, // Array of { id: string, label: string, expectedItemId: string }
  onComplete 
}) {
  const [draggableItems, setDraggableItems] = useState(items);
  const [droppedItems, setDroppedItems] = useState({}); // targetId => item
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const isAllPlaced = targets.every(t => droppedItems[t.id]);
    const isComplete = targets.every(t => droppedItems[t.id]?.id === t.expectedItemId);
    
    if (isAllPlaced && isComplete && !validated) {
      setValidated(true);
      onComplete?.();
    } else if (!isComplete && validated) {
      setValidated(false);
    }
  }, [droppedItems, targets, onComplete, validated]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    try {
      const itemDataString = e.dataTransfer.getData("application/json");
      if (!itemDataString) return;
      const item = JSON.parse(itemDataString);
      
      // Remove from source pool if coming from pool
      setDraggableItems(prev => prev.filter(i => i.id !== item.id));
      
      // Handle the drop
      setDroppedItems(prev => {
        const next = { ...prev };
        
        // Remove item from any other target if it was already dropped somewhere else
        Object.keys(next).forEach(k => {
          if (next[k]?.id === item.id) {
            delete next[k];
          }
        });

        // If this target already had an item, return that item to the pool
        if (next[targetId] && next[targetId].id !== item.id) {
          setDraggableItems(d => {
            if (!d.find(i => i.id === next[targetId].id)) {
              return [...d, next[targetId]];
            }
            return d;
          });
        }
        
        next[targetId] = item;
        return next;
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // allow drop
  };

  const returnItem = (targetId) => {
    const item = droppedItems[targetId];
    if (item) {
      setDroppedItems(prev => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
      setDraggableItems(prev => {
        if (!prev.find(i => i.id === item.id)) {
          return [...prev, item];
        }
        return prev;
      });
    }
  };

  return (
    <div className="slide-wrap slide-gap-md" style={{ width: '100%' }}>
      <h2>{title || "Drag & Drop Challenge"}</h2>
      {description && <p className="slide-muted">{description}</p>}

      <div className="slide-grid slide-gap-lg slide-mt-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Source Pool */}
        <div className="slide-card" style={{ flex: 1, border: '1px solid #444' }}>
          <div className="slide-card__title">Options</div>
          <p className="slide-text--sm slide-muted slide-mb-sm">Drag items to the correct blanks on the right.</p>

          <div className="slide-flex slide-flex--col slide-gap-sm slide-mt-sm">
            {draggableItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="btn"
                style={{ 
                  cursor: 'grab', 
                  backgroundColor: '#444', 
                  padding: '10px 15px', 
                  borderRadius: '5px',
                  color: 'white',
                  textAlign: 'left'
                }}
              >
                {item.content}
              </div>
            ))}
            {draggableItems.length === 0 && <span className="slide-muted" style={{ fontStyle: 'italic' }}>All options placed</span>}
          </div>
        </div>

        {/* Drop Targets */}
        <div className="slide-flex slide-flex--col slide-gap-md">
          {targets.map(target => {
            const currentItem = droppedItems[target.id];
            const isCorrect = currentItem && currentItem.id === target.expectedItemId;
            
            return (
              <div 
                key={target.id}
                className="slide-card"
                onDrop={(e) => handleDrop(e, target.id)}
                onDragOver={handleDragOver}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem',
                  border: currentItem ? (isCorrect ? '2px solid #00ff88' : '2px solid #ff4444') : '2px dashed #666',
                  transition: 'border 0.2s',
                  backgroundColor: '#2a2a2a'
                }}
              >
                <div style={{ flex: 1, fontWeight: 'bold' }}>{target.label}</div>
                <div 
                  className="slide-flex slide-items-center slide-justify-center"
                  style={{ 
                    minWidth: '200px', 
                    minHeight: '40px', 
                    background: 'rgba(0,0,0,0.5)', 
                    borderRadius: '4px',
                    marginLeft: '1rem'
                  }}
                >
                  {currentItem ? (
                    <div 
                      className="btn btn--primary" 
                      style={{ cursor: 'pointer', margin: 0, width: '100%', textAlign: 'center' }}
                      onClick={() => returnItem(target.id)}
                      title="Click to remove"
                    >
                      {currentItem.content}
                    </div>
                  ) : (
                    <span className="slide-muted slide-text--sm">Drop here</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {validated && (
        <div className="slide-card slide-card--success slide-mt-md">
          <div className="slide-card__title">🎉 Perfect Match!</div>
          <p>Great job! You have correctly matched all the items and earned your XP.</p>
        </div>
      )}
    </div>
  );
}
