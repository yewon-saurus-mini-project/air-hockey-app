import { CircleInfo } from "../model";

const getCircleInfo = (element: HTMLDivElement | null): CircleInfo | null => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const radius = rect.width / 2; // Assume the element is circular
  const centerX = rect.left + radius;
  const centerY = rect.top + radius;
  return { centerX, centerY, radius };
};

const areCirclesColliding = (circle1: CircleInfo, circle2: CircleInfo): boolean => {
  const dx = circle1.centerX - circle2.centerX;
  const dy = circle1.centerY - circle2.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= circle1.radius + circle2.radius;
};

export { getCircleInfo, areCirclesColliding };