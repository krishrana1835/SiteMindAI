import Bottleneck from "bottleneck";

const embeddingLimiter = new Bottleneck({
  reservoir: 100,
  reservoirRefreshInterval: 60 * 1000,
  reservoirRefreshAmount: 100, 
  maxConcurrent: 5,
});

export default embeddingLimiter;