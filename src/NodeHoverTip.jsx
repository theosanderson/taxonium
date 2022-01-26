
const NodeHoverTip = ({hoverInfo}) => {
    if (!hoverInfo) {
        return null;
    }

    const selectedNode = hoverInfo.object;

    if (!selectedNode) {
        return null;
    }



    return (
        <div
          className="bg-gray-100 p-3 opacity-90 text-sm"
          style={{
            position: "absolute",
            zIndex: 1,
            pointerEvents: "none",
            left: hoverInfo.x,
            top: hoverInfo.y,
          }}
        >
          <h2 className="font-bold">{selectedNode.name}</h2>
          </div>)


}

export default NodeHoverTip;
