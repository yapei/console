import * as React from 'react';
import { Node, observer } from '@console/topology';
import { AddNodeDirection, BUILDER_NODE_ADD_RADIUS, BUILDER_NODE_ERROR_RADIUS } from './const';
import ErrorNodeDecorator from './ErrorNodeDecorator';
import PlusNodeDecorator from './PlusNodeDecorator';
import TaskNode from './TaskNode';
import { BuilderNodeModelData } from './types';

const BuilderNode: React.FC<{ element: Node }> = ({ element }) => {
  const [showAdd, setShowAdd] = React.useState(false);
  const { width, height } = element.getBounds();
  const data: BuilderNodeModelData = element.getData();
  const { error, onAddNode, onNodeSelection } = data;

  return (
    <g
      className="odc-builder-node"
      onFocus={() => setShowAdd(true)}
      onBlur={() => setShowAdd(false)}
      onMouseOver={() => setShowAdd(true)}
      onMouseOut={() => setShowAdd(false)}
    >
      <rect
        x={-BUILDER_NODE_ADD_RADIUS * 2}
        y={0}
        width={width + BUILDER_NODE_ADD_RADIUS * 4}
        height={height + BUILDER_NODE_ADD_RADIUS * 2}
        fill="transparent"
      />
      <g onClick={() => onNodeSelection(data)}>
        <TaskNode element={element} disableTooltip />
        {error && (
          <ErrorNodeDecorator
            x={BUILDER_NODE_ERROR_RADIUS / 2}
            y={BUILDER_NODE_ERROR_RADIUS / 4}
            errorStr={error}
          />
        )}
      </g>
      <g style={{ display: showAdd ? 'block' : 'none' }}>
        <PlusNodeDecorator
          x={width + BUILDER_NODE_ADD_RADIUS}
          y={height / 2}
          onClick={() => onAddNode(AddNodeDirection.AFTER)}
        />
        <PlusNodeDecorator
          x={-BUILDER_NODE_ADD_RADIUS}
          y={height / 2}
          onClick={() => onAddNode(AddNodeDirection.BEFORE)}
        />
        <PlusNodeDecorator
          x={width / 2}
          y={height + BUILDER_NODE_ADD_RADIUS}
          onClick={() => onAddNode(AddNodeDirection.PARALLEL)}
        />
      </g>
    </g>
  );
};

export default observer(BuilderNode);
