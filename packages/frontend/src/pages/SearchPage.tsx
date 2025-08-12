import SearchInterface from '../components/Search/SearchInterface';
import { useTreeStore } from '../stores/treeStore';
import { useContextStore } from '../stores/contextStore';
import type { DocumentNode } from '@shared/types';

export default function SearchPage() {
  const { selectNode, setFocusedNode } = useTreeStore();
  const { includeMultiple } = useContextStore();

  const handleNodeSelect = (node: DocumentNode) => {
    selectNode(node.id);
    setFocusedNode(node.id);
  };

  const handleAddToContext = (nodes: DocumentNode[]) => {
    const nodeIds = nodes.map(node => node.id);
    includeMultiple(nodeIds);
  };

  return (
    <div className="h-full">
      <SearchInterface
        onNodeSelect={handleNodeSelect}
        onAddToContext={handleAddToContext}
      />
    </div>
  );
}