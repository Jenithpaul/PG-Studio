import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getStraightPath } from 'reactflow';
import { Relation } from '@pg-studio/shared';

interface EdgeWithTooltipProps extends EdgeProps {
  data?: {
    relation: Relation;
  };
}

const EdgeWithTooltip: React.FC<EdgeWithTooltipProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleMouseEnter = (event: React.MouseEvent) => {
    setShowTooltip(true);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (showTooltip) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const formatConstraintAction = (action?: string) => {
    if (!action) return 'NO ACTION';
    return action.replace('_', ' ');
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          cursor: 'pointer',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      />
      
      {showTooltip && data?.relation && (
        <div
          className="edge-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-header">
              <strong>Foreign Key Relationship</strong>
            </div>
            <div className="tooltip-body">
              <div className="tooltip-row">
                <span className="label">From:</span>
                <span className="value">{data.relation.sourceTable}.{data.relation.sourceColumn}</span>
              </div>
              <div className="tooltip-row">
                <span className="label">To:</span>
                <span className="value">{data.relation.targetTable}.{data.relation.targetColumn}</span>
              </div>
              {data.relation.constraintName && (
                <div className="tooltip-row">
                  <span className="label">Constraint:</span>
                  <span className="value">{data.relation.constraintName}</span>
                </div>
              )}
              <div className="tooltip-row">
                <span className="label">On Delete:</span>
                <span className="value">{formatConstraintAction(data.relation.onDelete)}</span>
              </div>
              <div className="tooltip-row">
                <span className="label">On Update:</span>
                <span className="value">{formatConstraintAction(data.relation.onUpdate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EdgeWithTooltip;